package com.example.textanalyzer.service;

import java.time.LocalDateTime;
import java.util.Locale;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.example.textanalyzer.controller.AuthController;
import com.example.textanalyzer.dto.AuthRequest;
import com.example.textanalyzer.dto.AuthStatusResponse;
import com.example.textanalyzer.dto.PaymentDetailsRequest;
import com.example.textanalyzer.dto.RegisterRequest;
import com.example.textanalyzer.dto.UpgradePlanRequest;
import com.example.textanalyzer.model.PlanType;
import com.example.textanalyzer.model.UserAccount;
import com.example.textanalyzer.repository.UserAccountRepository;

import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

	private static final String PRO_PRICE_LABEL = "119.99 TL / ay";
	private static final String PREMIUM_PRICE_LABEL = "249.99 TL / ay";

	private final UserAccountRepository userAccountRepository;
	private final PasswordEncoder passwordEncoder;

	@PostConstruct
	public void seedPremiumDemoUser() {
		if (userAccountRepository.existsByUsername("member")) {
			return;
		}

		userAccountRepository.save(UserAccount.builder()
				.username("member")
				.email("member@example.com")
				.passwordHash(passwordEncoder.encode("text123"))
				.planType(PlanType.PREMIUM)
				.paymentCardLastFour("4242")
				.premiumActivatedAt(LocalDateTime.now())
				.build());
	}

	public AuthStatusResponse register(RegisterRequest request, HttpSession session) {
		String username = normalize(request.getUsername());
		String email = normalize(request.getEmail()).toLowerCase(Locale.ROOT);
		String password = request.getPassword() == null ? "" : request.getPassword().trim();
		PlanType planType = resolvePlan(request.getPlanType());

		if (username.length() < 3) {
			throw new IllegalArgumentException("Kullanici adi en az 3 karakter olmali.");
		}
		if (!email.contains("@")) {
			throw new IllegalArgumentException("Gecerli bir e-posta girin.");
		}
		if (password.length() < 6) {
			throw new IllegalArgumentException("Sifre en az 6 karakter olmali.");
		}
		if (userAccountRepository.existsByUsername(username)) {
			throw new IllegalArgumentException("Bu kullanici adi zaten kullaniliyor.");
		}
		if (userAccountRepository.existsByEmail(email)) {
			throw new IllegalArgumentException("Bu e-posta zaten kayitli.");
		}
		if (planType != PlanType.FREE) {
			validatePaymentDetails(request.getPaymentDetails());
		}

		UserAccount user = userAccountRepository.save(UserAccount.builder()
				.username(username)
				.email(email)
				.passwordHash(passwordEncoder.encode(password))
				.planType(planType)
				.paymentCardLastFour(planType != PlanType.FREE
						? extractLastFour(request.getPaymentDetails().getCardNumber())
						: null)
				.premiumActivatedAt(planType != PlanType.FREE ? LocalDateTime.now() : null)
				.build());

		storeUserInSession(session, user);
		return toStatusResponse(user, true);
	}

	public AuthStatusResponse upgradePlan(UpgradePlanRequest request, HttpSession session) {
		Long userId = (Long) session.getAttribute(AuthController.SESSION_USER_ID_KEY);
		if (userId == null) {
			throw new IllegalArgumentException("Plan yukseltmek icin once giris yapin.");
		}

		UserAccount user = userAccountRepository.findById(userId)
				.orElseThrow(() -> new IllegalArgumentException("Kullanici bulunamadi."));

		PlanType requestedPlan = resolvePlan(request == null ? null : request.getPlanType());
		if (requestedPlan == PlanType.FREE) {
			throw new IllegalArgumentException("Yukseltme icin Pro veya Premium secmelisiniz.");
		}
		if (user.getPlanType() == requestedPlan) {
			throw new IllegalArgumentException("Bu hesap zaten secilen planda.");
		}

		validatePaymentDetails(request == null ? null : request.getPaymentDetails());
		user.setPlanType(requestedPlan);
		user.setPaymentCardLastFour(extractLastFour(request.getPaymentDetails().getCardNumber()));
		user.setPremiumActivatedAt(LocalDateTime.now());
		UserAccount updatedUser = userAccountRepository.save(user);

		storeUserInSession(session, updatedUser);
		return toStatusResponse(updatedUser, true);
	}

	public AuthStatusResponse cancelPaidPlan(HttpSession session) {
		Long userId = (Long) session.getAttribute(AuthController.SESSION_USER_ID_KEY);
		if (userId == null) {
			throw new IllegalArgumentException("Uyeligi iptal etmek icin once giris yapin.");
		}

		UserAccount user = userAccountRepository.findById(userId)
				.orElseThrow(() -> new IllegalArgumentException("Kullanici bulunamadi."));

		if (user.getPlanType() == PlanType.FREE) {
			throw new IllegalArgumentException("Bu hesap zaten ucretsiz planda.");
		}

		user.setPlanType(PlanType.FREE);
		user.setPaymentCardLastFour(null);
		user.setPremiumActivatedAt(null);
		UserAccount updatedUser = userAccountRepository.save(user);

		storeUserInSession(session, updatedUser);
		return toStatusResponse(updatedUser, true);
	}

	public AuthStatusResponse login(AuthRequest request, HttpSession session) {
		String email = normalize(request.getEmail()).toLowerCase(Locale.ROOT);
		String password = request.getPassword() == null ? "" : request.getPassword();

		UserAccount user = userAccountRepository.findByEmail(email)
				.orElseThrow(() -> new IllegalArgumentException("Gecersiz e-posta veya sifre."));

		if (!passwordEncoder.matches(password, user.getPasswordHash())) {
			throw new IllegalArgumentException("Gecersiz e-posta veya sifre.");
		}

		storeUserInSession(session, user);
		return toStatusResponse(user, true);
	}

	public AuthStatusResponse logout(HttpSession session) {
		session.invalidate();
		return AuthStatusResponse.builder()
				.loggedIn(false)
				.planType(PlanType.FREE.name())
				.maxCharacters(AuthController.FREE_MAX_CHARACTERS)
				.fileUploadEnabled(false)
				.canUpgradeToPremium(true)
				.premiumPriceLabel(PREMIUM_PRICE_LABEL)
				.proPriceLabel(PRO_PRICE_LABEL)
				.billingMessage("Premium ile dosya yukleme ve genis analiz limitleri acilir.")
				.build();
	}

	public AuthStatusResponse authStatus(HttpSession session) {
		Long userId = (Long) session.getAttribute(AuthController.SESSION_USER_ID_KEY);
		if (userId == null) {
			return AuthStatusResponse.builder()
					.loggedIn(false)
					.planType(PlanType.FREE.name())
					.maxCharacters(AuthController.FREE_MAX_CHARACTERS)
					.fileUploadEnabled(false)
					.canUpgradeToPremium(true)
					.premiumPriceLabel(PREMIUM_PRICE_LABEL)
					.proPriceLabel(PRO_PRICE_LABEL)
					.billingMessage("Premium ile dosya yukleme ve genis analiz limitleri acilir.")
					.build();
		}

		UserAccount user = userAccountRepository.findById(userId)
				.orElseGet(() -> {
					session.invalidate();
					return null;
				});

		if (user == null) {
			return AuthStatusResponse.builder()
					.loggedIn(false)
					.planType(PlanType.FREE.name())
					.maxCharacters(AuthController.FREE_MAX_CHARACTERS)
					.fileUploadEnabled(false)
					.canUpgradeToPremium(true)
					.premiumPriceLabel(PREMIUM_PRICE_LABEL)
					.proPriceLabel(PRO_PRICE_LABEL)
					.billingMessage("Premium ile dosya yukleme ve genis analiz limitleri acilir.")
					.build();
		}

		storeUserInSession(session, user);
		return toStatusResponse(user, true);
	}

	public int resolveCharacterLimit(HttpSession session) {
		PlanType planType = resolvePlanFromSession(session);
		return switch (planType) {
			case PREMIUM -> AuthController.PREMIUM_MAX_CHARACTERS;
			case PRO -> AuthController.PRO_MAX_CHARACTERS;
			case FREE -> AuthController.FREE_MAX_CHARACTERS;
		};
	}

	public boolean canUploadFiles(HttpSession session) {
		return resolvePlanFromSession(session) == PlanType.PREMIUM;
	}

	private PlanType resolvePlanFromSession(HttpSession session) {
		Object rawPlan = session.getAttribute(AuthController.SESSION_PLAN_KEY);
		if (rawPlan == null) {
			return PlanType.FREE;
		}
		return resolvePlan(String.valueOf(rawPlan));
	}

	private void storeUserInSession(HttpSession session, UserAccount user) {
		session.setAttribute(AuthController.SESSION_USER_ID_KEY, user.getId());
		session.setAttribute(AuthController.SESSION_USERNAME_KEY, user.getUsername());
		session.setAttribute(AuthController.SESSION_PLAN_KEY, user.getPlanType().name());
	}

	private AuthStatusResponse toStatusResponse(UserAccount user, boolean loggedIn) {
		return AuthStatusResponse.builder()
				.loggedIn(loggedIn)
				.username(user.getUsername())
				.email(user.getEmail())
				.planType(user.getPlanType().name())
				.maxCharacters(resolveCharacterLimitForPlan(user.getPlanType()))
				.fileUploadEnabled(user.getPlanType() == PlanType.PREMIUM)
				.canUpgradeToPremium(user.getPlanType() != PlanType.PREMIUM)
				.premiumPriceLabel(PREMIUM_PRICE_LABEL)
				.proPriceLabel(PRO_PRICE_LABEL)
				.billingMessage(buildBillingMessage(user))
				.build();
	}

	private String buildBillingMessage(UserAccount user) {
		if (user.getPlanType() == PlanType.PREMIUM && user.getPaymentCardLastFour() != null) {
			return "Premium aktif. Kayitli kart sonu: " + user.getPaymentCardLastFour();
		}
		if (user.getPlanType() == PlanType.PRO && user.getPaymentCardLastFour() != null) {
			return "Pro aktif. Kayitli kart sonu: " + user.getPaymentCardLastFour();
		}
		return "Pro ve Premium ile daha genis analiz limitleri acilir.";
	}

	private int resolveCharacterLimitForPlan(PlanType planType) {
		return switch (planType) {
			case PREMIUM -> AuthController.PREMIUM_MAX_CHARACTERS;
			case PRO -> AuthController.PRO_MAX_CHARACTERS;
			case FREE -> AuthController.FREE_MAX_CHARACTERS;
		};
	}

	private void validatePaymentDetails(PaymentDetailsRequest paymentDetails) {
		if (paymentDetails == null) {
			throw new IllegalArgumentException("Premium uyelik icin odeme bilgisi gerekli.");
		}
		if (!StringUtils.hasText(paymentDetails.getCardHolderName())) {
			throw new IllegalArgumentException("Kart uzerindeki ad zorunludur.");
		}

		String cardNumber = digitsOnly(paymentDetails.getCardNumber());
		String expiryMonth = digitsOnly(paymentDetails.getExpiryMonth());
		String expiryYear = digitsOnly(paymentDetails.getExpiryYear());
		String cvv = digitsOnly(paymentDetails.getCvv());

		if (cardNumber.length() < 16) {
			throw new IllegalArgumentException("Kart numarasi 16 haneli olmali.");
		}
		if (expiryMonth.length() == 0 || Integer.parseInt(expiryMonth) < 1 || Integer.parseInt(expiryMonth) > 12) {
			throw new IllegalArgumentException("Gecerli bir son kullanma ayi girin.");
		}
		if (expiryYear.length() < 2) {
			throw new IllegalArgumentException("Gecerli bir son kullanma yili girin.");
		}
		if (cvv.length() < 3) {
			throw new IllegalArgumentException("CVV en az 3 haneli olmali.");
		}
		if (!paymentDetails.isAcceptedTerms()) {
			throw new IllegalArgumentException("Premium satin alma kosullarini kabul etmelisiniz.");
		}
	}

	private String digitsOnly(String value) {
		return value == null ? "" : value.replaceAll("\\D", "");
	}

	private String extractLastFour(String cardNumber) {
		String digits = digitsOnly(cardNumber);
		return digits.substring(Math.max(0, digits.length() - 4));
	}

	private PlanType resolvePlan(String planType) {
		if (!StringUtils.hasText(planType)) {
			return PlanType.FREE;
		}
		try {
			return PlanType.valueOf(planType.trim().toUpperCase(Locale.ROOT));
		} catch (IllegalArgumentException exception) {
			throw new IllegalArgumentException("Gecersiz plan tipi.");
		}
	}

	private String normalize(String value) {
		return value == null ? "" : value.trim();
	}
}
