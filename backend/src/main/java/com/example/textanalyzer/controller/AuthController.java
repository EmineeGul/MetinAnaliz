package com.example.textanalyzer.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.example.textanalyzer.dto.AuthRequest;
import com.example.textanalyzer.dto.AuthStatusResponse;
import com.example.textanalyzer.dto.RegisterRequest;
import com.example.textanalyzer.dto.UpgradePlanRequest;
import com.example.textanalyzer.service.AuthService;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

	public static final String SESSION_USER_ID_KEY = "loggedInUserId";
	public static final String SESSION_USERNAME_KEY = "loggedInUsername";
	public static final String SESSION_PLAN_KEY = "userPlan";
	public static final int FREE_MAX_CHARACTERS = 600;
	public static final int PRO_MAX_CHARACTERS = 4000;
	public static final int PREMIUM_MAX_CHARACTERS = 8000;

	private final AuthService authService;

	@GetMapping("/status")
	public ResponseEntity<AuthStatusResponse> authStatus(HttpSession session) {
		return ResponseEntity.ok(authService.authStatus(session));
	}

	@PostMapping("/register")
	public ResponseEntity<AuthStatusResponse> register(@RequestBody RegisterRequest request, HttpSession session) {
		try {
			return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request, session));
		} catch (IllegalArgumentException exception) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage());
		}
	}

	@PostMapping("/login")
	public ResponseEntity<AuthStatusResponse> login(@RequestBody AuthRequest request, HttpSession session) {
		try {
			return ResponseEntity.ok(authService.login(request, session));
		} catch (IllegalArgumentException exception) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, exception.getMessage());
		}
	}

	@PostMapping("/logout")
	public ResponseEntity<AuthStatusResponse> logout(HttpSession session) {
		return ResponseEntity.ok(authService.logout(session));
	}

	@PostMapping("/upgrade")
	public ResponseEntity<AuthStatusResponse> upgradeToPremium(@RequestBody UpgradePlanRequest request, HttpSession session) {
		try {
			return ResponseEntity.ok(authService.upgradePlan(request, session));
		} catch (IllegalArgumentException exception) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage());
		}
	}

	@PostMapping("/cancel-plan")
	public ResponseEntity<AuthStatusResponse> cancelPlan(HttpSession session) {
		try {
			return ResponseEntity.ok(authService.cancelPaidPlan(session));
		} catch (IllegalArgumentException exception) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage());
		}
	}
}
