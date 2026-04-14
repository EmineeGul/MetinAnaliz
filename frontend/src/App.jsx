import { useEffect, useState } from "react";

const GUEST_STATE = {
  loggedIn: false,
  username: null,
  email: null,
  planType: "FREE",
  maxCharacters: 600,
  fileUploadEnabled: false,
  canUpgradeToPremium: true,
  premiumPriceLabel: "249.99 TL / ay",
  proPriceLabel: "119.99 TL / ay",
  billingMessage: "Pro ve Premium ile daha geniş analiz limitleri açılır."
};

const EMPTY_PAYMENT = {
  cardHolderName: "",
  cardNumber: "",
  expiryMonth: "",
  expiryYear: "",
  cvv: "",
  acceptedTerms: false
};

const EMPTY_PAYMENT_ERRORS = {
  cardNumber: "",
  expiryMonth: "",
  expiryYear: "",
  cvv: ""
};

function formatCardNumber(value) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

function validatePaymentField(field, value) {
  if (field === "cardNumber") {
    if (/[^\d\s]/.test(value)) return "Kart numarası sadece rakamlardan oluşmalıdır.";
    if (value.replace(/\s/g, "").length !== 16) return "Kart numarası 16 haneli olmalıdır.";
    return "";
  }

  if (field === "expiryMonth") {
    if (!/^\d{2}$/.test(value)) return "Ay değeri 01 ile 12 arasında olmalıdır.";
    const month = Number(value);
    return month >= 1 && month <= 12 ? "" : "Ay değeri 01 ile 12 arasında olmalıdır.";
  }

  if (field === "expiryYear") {
    if (!/^\d{4}$/.test(value) || Number(value) < 2026) return "Yıl 2026 veya daha büyük olmalıdır.";
    return "";
  }

  if (field === "cvv") {
    if (!/^\d{3}$/.test(value)) return "CVV 3 haneli olmalıdır.";
    return "";
  }

  return "";
}

function validatePayment(payment) {
  return {
    cardNumber: validatePaymentField("cardNumber", payment.cardNumber),
    expiryMonth: validatePaymentField("expiryMonth", payment.expiryMonth),
    expiryYear: validatePaymentField("expiryYear", payment.expiryYear),
    cvv: validatePaymentField("cvv", payment.cvv)
  };
}

function hasPaymentErrors(errors) {
  return Object.values(errors).some(Boolean);
}

function mapPaymentError(message) {
  if (
    message === "Kart numarası 16 haneli olmalıdır." ||
    message === "Kart numarası sadece rakamlardan oluşmalıdır."
  ) {
    return { field: "cardNumber", message };
  }

  if (message === "Ay değeri 01 ile 12 arasında olmalıdır.") {
    return { field: "expiryMonth", message };
  }

  if (message === "Yıl 2026 veya daha büyük olmalıdır.") {
    return { field: "expiryYear", message };
  }

  if (message === "CVV 3 haneli olmalıdır.") {
    return { field: "cvv", message };
  }

  return null;
}

async function extractErrorMessage(response, fallbackMessage) {
  const bodyText = await response.text();
  if (!bodyText) return fallbackMessage;

  try {
    const payload = JSON.parse(bodyText);
    return payload?.message || payload?.detail || payload?.error || fallbackMessage;
  } catch {
    return bodyText;
  }
}

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value ?? "-"}</p>
    </div>
  );
}

function PaymentFields({ payment, setPayment, errors, setErrors }) {
  function updateField(field, rawValue) {
    const nextValue =
      field === "cardNumber"
        ? formatCardNumber(rawValue)
        : rawValue.replace(/\D/g, "").slice(0, field === "expiryMonth" ? 2 : field === "expiryYear" ? 4 : 3);

    const nextPayment = { ...payment, [field]: nextValue };
    const nextError =
      field === "cardNumber" && /[^\d\s]/.test(rawValue)
        ? "Kart numarası sadece rakamlardan oluşmalıdır."
        : validatePaymentField(field, nextValue);

    setPayment(nextPayment);
    setErrors({ ...errors, [field]: nextError });
  }

  return (
    <div className="payment-box">
      <p className="payment-title">Ödeme Bilgileri</p>
      <div className="payment-grid">
        <input
          type="text"
          value={payment.cardHolderName}
          onChange={(event) => setPayment({ ...payment, cardHolderName: event.target.value })}
          placeholder="Kart üzerindeki ad"
        />
        <div>
          <input
            type="text"
            value={payment.cardNumber}
            onChange={(event) => updateField("cardNumber", event.target.value)}
            placeholder="4242 4242 4242 4242"
            inputMode="numeric"
          />
          {errors.cardNumber ? <p className="error-message">{errors.cardNumber}</p> : null}
        </div>
        <div>
          <input
            type="text"
            value={payment.expiryMonth}
            onChange={(event) => updateField("expiryMonth", event.target.value)}
            placeholder="Ay"
            inputMode="numeric"
          />
          {errors.expiryMonth ? <p className="error-message">{errors.expiryMonth}</p> : null}
        </div>
        <div>
          <input
            type="text"
            value={payment.expiryYear}
            onChange={(event) => updateField("expiryYear", event.target.value)}
            placeholder="Yıl"
            inputMode="numeric"
          />
          {errors.expiryYear ? <p className="error-message">{errors.expiryYear}</p> : null}
        </div>
        <div>
          <input
            type="text"
            value={payment.cvv}
            onChange={(event) => updateField("cvv", event.target.value)}
            placeholder="CVV"
            inputMode="numeric"
          />
          {errors.cvv ? <p className="error-message">{errors.cvv}</p> : null}
        </div>
      </div>
      <label className="terms-line">
        <input
          type="checkbox"
          checked={payment.acceptedTerms}
          onChange={(event) => setPayment({ ...payment, acceptedTerms: event.target.checked })}
        />
        <span>Seçilen planın aylık ücretlendirmesini kabul ediyorum.</span>
      </label>
    </div>
  );
}

function PlanCard({ name, price, features, selected, onSelect, tone }) {
  return (
    <button
      type="button"
      className={`store-card ${tone}${selected ? " selected-store-card" : ""}`}
      onClick={onSelect}
    >
      <p className="store-name">{name}</p>
      <h3>{price}</h3>
      {features.map((feature) => (
        <span key={feature} className="store-feature">
          {feature}
        </span>
      ))}
    </button>
  );
}

export default function App() {
  const [stage, setStage] = useState("loading");
  const [activeAuthTab, setActiveAuthTab] = useState("login");
  const [selectedPlan, setSelectedPlan] = useState("PRO");
  const [auth, setAuth] = useState(GUEST_STATE);
  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [authError, setAuthError] = useState("");
  const [upgradeError, setUpgradeError] = useState("");
  const [cancelError, setCancelError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [upgradeSubmitting, setUpgradeSubmitting] = useState(false);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerPayment, setRegisterPayment] = useState(EMPTY_PAYMENT);
  const [upgradePayment, setUpgradePayment] = useState(EMPTY_PAYMENT);
  const [registerPaymentErrors, setRegisterPaymentErrors] = useState(EMPTY_PAYMENT_ERRORS);
  const [upgradePaymentErrors, setUpgradePaymentErrors] = useState(EMPTY_PAYMENT_ERRORS);
  const [registerForm, setRegisterForm] = useState({
    username: "",
    email: "",
    password: "",
    planType: "FREE"
  });

  useEffect(() => {
    loadAuthStatus();
  }, []);

  async function loadAuthStatus() {
    try {
      const response = await fetch("/api/auth/status", { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setAuth(data.loggedIn ? data : GUEST_STATE);
      setStage(data.loggedIn ? "app" : "gate");
    } catch {
      setAuth(GUEST_STATE);
      setStage("gate");
    }
  }

  function continueAsGuest() {
    setAuth(GUEST_STATE);
    setStage("app");
    setAuthError("");
    setUpgradeError("");
    setCancelError("");
  }

  async function handleLogin(event) {
    event.preventDefault();
    setAuthSubmitting(true);
    setAuthError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(loginForm)
      });

      if (!response.ok) {
        throw new Error((await response.text()) || "Giriş başarısız.");
      }

      const data = await response.json();
      setAuth(data);
      setStage("app");
      setCancelError("");
    } catch (requestError) {
      setAuthError(requestError.message || "Giriş başarısız.");
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();

    if (registerForm.planType !== "FREE") {
      const nextErrors = validatePayment(registerPayment);
      setRegisterPaymentErrors(nextErrors);
      if (hasPaymentErrors(nextErrors)) {
        setAuthError("Lütfen ödeme alanlarındaki hataları düzeltin.");
        return;
      }
    }

    setAuthSubmitting(true);
    setAuthError("");

    try {
      const payload = {
        ...registerForm,
        paymentDetails: registerForm.planType === "FREE" ? null : registerPayment
      };

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(await extractErrorMessage(response, "Kayıt başarısız."));
      }

      const data = await response.json();
      setAuth(data);
      setStage("app");
      setCancelError("");
    } catch (requestError) {
      const paymentError = mapPaymentError(requestError.message);

      if (paymentError) {
        setRegisterPaymentErrors({ ...EMPTY_PAYMENT_ERRORS, [paymentError.field]: paymentError.message });
        setAuthError("Lütfen ödeme alanlarındaki hataları düzeltin.");
      } else {
        setAuthError(requestError.message || "Kayıt başarısız.");
      }
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function handleUpgrade(event) {
    event.preventDefault();

    const nextErrors = validatePayment(upgradePayment);
    setUpgradePaymentErrors(nextErrors);
    if (hasPaymentErrors(nextErrors)) {
      setUpgradeError("Lütfen ödeme alanlarındaki hataları düzeltin.");
      return;
    }

    setUpgradeSubmitting(true);
    setUpgradeError("");

    try {
      const response = await fetch("/api/auth/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ planType: selectedPlan, paymentDetails: upgradePayment })
      });

      if (!response.ok) {
        throw new Error(await extractErrorMessage(response, "Plan yükseltme başarısız."));
      }

      const data = await response.json();
      setAuth(data);
      setUpgradePayment(EMPTY_PAYMENT);
      setUpgradePaymentErrors(EMPTY_PAYMENT_ERRORS);
      setStage("app");
      setCancelError("");
    } catch (requestError) {
      const paymentError = mapPaymentError(requestError.message);

      if (paymentError) {
        setUpgradePaymentErrors({ ...EMPTY_PAYMENT_ERRORS, [paymentError.field]: paymentError.message });
        setUpgradeError("Lütfen ödeme alanlarındaki hataları düzeltin.");
      } else {
        setUpgradeError(requestError.message || "Plan yükseltme başarısız.");
      }
    } finally {
      setUpgradeSubmitting(false);
    }
  }

  async function handleCancelPlan() {
    setCancelSubmitting(true);
    setCancelError("");

    try {
      const response = await fetch("/api/auth/cancel-plan", {
        method: "POST",
        headers: { Accept: "application/json" }
      });

      if (!response.ok) {
        throw new Error((await response.text()) || "Üyelik iptali başarısız.");
      }

      const data = await response.json();
      setAuth(data);
      setSelectedFile(null);
    } catch (requestError) {
      setCancelError(requestError.message || "Üyelik iptali başarısız.");
    } finally {
      setCancelSubmitting(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setAuth(GUEST_STATE);
      setStage("gate");
      setLoginForm({ email: "", password: "" });
      setRegisterForm({ username: "", email: "", password: "", planType: "FREE" });
      setRegisterPayment(EMPTY_PAYMENT);
      setRegisterPaymentErrors(EMPTY_PAYMENT_ERRORS);
      setUpgradePayment(EMPTY_PAYMENT);
      setUpgradePaymentErrors(EMPTY_PAYMENT_ERRORS);
      setCancelError("");
    }
  }

  async function handleAnalyze(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    if (text.length > auth.maxCharacters) {
      setError(`Bu hesap tipi için maksimum ${auth.maxCharacters} karakter gönderebilirsiniz.`);
      setResult(null);
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "text/plain", Accept: "application/json" },
        body: text
      });

      if (!response.ok) {
        throw new Error((await response.text()) || "Analiz başarısız.");
      }

      setResult(await response.json());
    } catch (requestError) {
      setError(requestError.message || "Analiz başarısız.");
      setResult(null);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFileAnalyze(event) {
    event.preventDefault();

    if (!selectedFile) {
      setError("Lütfen önce bir dosya seçin.");
      return;
    }

    setUploadingFile(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/analyze-file", { method: "POST", body: formData });

      if (!response.ok) {
        throw new Error((await response.text()) || "Dosya analizi başarısız.");
      }

      setResult(await response.json());
    } catch (requestError) {
      setError(requestError.message || "Dosya analizi başarısız.");
      setResult(null);
    } finally {
      setUploadingFile(false);
    }
  }

  const remainingCharacters = auth.maxCharacters - text.length;
  const showStoreButton = auth.loggedIn && auth.canUpgradeToPremium;

  if (stage === "loading") {
    return (
      <main className="page-shell">
        <section className="gate-panel single-panel">
          <div className="gate-copy">
            <p className="eyebrow">Yükleniyor</p>
            <h1>MetinAnaliz</h1>
          </div>
        </section>
      </main>
    );
  }

  if (stage === "gate") {
    return (
      <main className="page-shell">
        <section className="gate-panel">
          <div className="gate-copy">
            <p className="eyebrow">Planlar</p>
            <h1>MetinAnaliz</h1>
            <p className="hero-description">
              Free, Pro ve Premium arasından seçim yap. Satın alma ekranları artık ayrı ve fiyatlar açıkça
              görünüyor.
            </p>
            <div className="limit-list">
              <div className="limit-item">
                <span>Free</span>
                <strong>0 TL</strong>
              </div>
              <div className="limit-item">
                <span>Pro</span>
                <strong>119.99 TL / ay</strong>
              </div>
              <div className="limit-item">
                <span>Premium</span>
                <strong>249.99 TL / ay</strong>
              </div>
            </div>
            <button className="secondary-button" type="button" onClick={continueAsGuest}>
              Misafir olarak devam et
            </button>
          </div>

          <div className="login-panel">
            <div className="auth-switch">
              <button
                type="button"
                className={`tab-button${activeAuthTab === "login" ? " active-tab" : ""}`}
                onClick={() => setActiveAuthTab("login")}
              >
                Giriş Yap
              </button>
              <button
                type="button"
                className={`tab-button${activeAuthTab === "register" ? " active-tab" : ""}`}
                onClick={() => setActiveAuthTab("register")}
              >
                Kayıt Ol
              </button>
            </div>

            {activeAuthTab === "login" ? (
              <form className="auth-form" onSubmit={handleLogin}>
                <p className="eyebrow">Giriş</p>
                <h2>Hesabına giriş yap</h2>
                <p className="login-note">Demo premium hesap: member@example.com / text123</p>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
                  placeholder="E-posta"
                />
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                  placeholder="Şifre"
                />
                {authError ? <p className="error-message">{authError}</p> : null}
                <button type="submit" disabled={authSubmitting}>
                  {authSubmitting ? "Giriş yapılıyor..." : "Giriş yap"}
                </button>
              </form>
            ) : (
              <form className="auth-form" onSubmit={handleRegister}>
                <p className="eyebrow">Kayıt</p>
                <h2>Yeni hesap oluştur</h2>
                <input
                  type="text"
                  value={registerForm.username}
                  onChange={(event) => setRegisterForm({ ...registerForm, username: event.target.value })}
                  placeholder="Kullanıcı adı"
                />
                <input
                  type="email"
                  value={registerForm.email}
                  onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })}
                  placeholder="E-posta"
                />
                <input
                  type="password"
                  value={registerForm.password}
                  onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })}
                  placeholder="Şifre"
                />
                <div className="plan-picker">
                  <label className={`plan-card${registerForm.planType === "FREE" ? " selected-plan" : ""}`}>
                    <input
                      type="radio"
                      name="planType"
                      value="FREE"
                      checked={registerForm.planType === "FREE"}
                      onChange={(event) => setRegisterForm({ ...registerForm, planType: event.target.value })}
                    />
                    <span>Free</span>
                    <strong>0 TL</strong>
                  </label>
                  <label className={`plan-card pro-plan-card${registerForm.planType === "PRO" ? " selected-plan" : ""}`}>
                    <input
                      type="radio"
                      name="planType"
                      value="PRO"
                      checked={registerForm.planType === "PRO"}
                      onChange={(event) => setRegisterForm({ ...registerForm, planType: event.target.value })}
                    />
                    <span>Pro</span>
                    <strong>119.99 TL / ay</strong>
                  </label>
                  <label
                    className={`plan-card premium-plan-card${registerForm.planType === "PREMIUM" ? " selected-plan" : ""}`}
                  >
                    <input
                      type="radio"
                      name="planType"
                      value="PREMIUM"
                      checked={registerForm.planType === "PREMIUM"}
                      onChange={(event) => setRegisterForm({ ...registerForm, planType: event.target.value })}
                    />
                    <span>Premium</span>
                    <strong>249.99 TL / ay</strong>
                  </label>
                </div>
                {registerForm.planType !== "FREE" ? (
                  <PaymentFields
                    payment={registerPayment}
                    setPayment={setRegisterPayment}
                    errors={registerPaymentErrors}
                    setErrors={setRegisterPaymentErrors}
                  />
                ) : null}
                {authError ? <p className="error-message">{authError}</p> : null}
                <button type="submit" disabled={authSubmitting}>
                  {authSubmitting ? "Kayıt yapılıyor..." : "Kayıt ol"}
                </button>
              </form>
            )}
          </div>
        </section>
      </main>
    );
  }

  if (stage === "store") {
    return (
      <main className="page-shell">
        <section className="store-panel">
          <div className="topbar">
            <div>
              <p className="eyebrow">Satın Alma</p>
              <h1>Planını Seç</h1>
            </div>
            <button className="ghost-button" type="button" onClick={() => setStage("app")}>
              Hesaba dön
            </button>
          </div>

          <div className="store-grid">
            <PlanCard
              name="Pro"
              price="119.99 TL / ay"
              features={["4000 karakter", "Daha hızlı analiz", "Orta seviye kullanım"]}
              selected={selectedPlan === "PRO"}
              onSelect={() => setSelectedPlan("PRO")}
              tone="pro-tone"
            />
            <PlanCard
              name="Premium"
              price="249.99 TL / ay"
              features={["8000 karakter", "Dosya yükleme", "Tüm gelişmiş özellikler"]}
              selected={selectedPlan === "PREMIUM"}
              onSelect={() => setSelectedPlan("PREMIUM")}
              tone="premium-tone"
            />
          </div>

          <form className="upgrade-form" onSubmit={handleUpgrade}>
            <p className="billing-note">{selectedPlan === "PRO" ? auth.proPriceLabel : auth.premiumPriceLabel}</p>
            <PaymentFields
              payment={upgradePayment}
              setPayment={setUpgradePayment}
              errors={upgradePaymentErrors}
              setErrors={setUpgradePaymentErrors}
            />
            {upgradeError ? <p className="error-message">{upgradeError}</p> : null}
            <button type="submit" disabled={upgradeSubmitting}>
              {upgradeSubmitting ? "Ödeme alınıyor..." : `${selectedPlan} satın al`}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <div className="topbar">
            <div>
              <p className="eyebrow">{auth.loggedIn ? `${auth.planType} plan` : "Misafir modu"}</p>
              <h1>MetinAnaliz</h1>
            </div>
            <div className="action-row">
              {showStoreButton ? (
                <button className="secondary-button" type="button" onClick={() => setStage("store")}>
                  Planları gör
                </button>
              ) : null}
              <button className="ghost-button" type="button" onClick={handleLogout}>
                {auth.loggedIn ? "Çıkış yap" : "Giriş ekranına dön"}
              </button>
            </div>
          </div>

          <p className="hero-description">Metni veya dosyayı hesabının planına göre analiz et.</p>
          <div className="membership-badge">
            <span>{auth.loggedIn ? `${auth.username} | ${auth.email}` : "Misafir kullanıcı"}</span>
            <strong>
              {auth.loggedIn ? `${auth.planType} | Limit ${auth.maxCharacters} karakter` : "Free benzeri limit | 600 karakter"}
            </strong>
          </div>
          <p className="billing-note">{auth.billingMessage}</p>
        </div>

        <div className="analysis-stack">
          <form className="analyzer-form" onSubmit={handleAnalyze}>
            <label className="input-label" htmlFor="text-input">
              Metin Girişi
            </label>
            <textarea
              id="text-input"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Metninizi buraya yazın..."
              rows="8"
            />
            <div className="form-footer">
              <p className={`character-note${remainingCharacters < 0 ? " limit-exceeded" : ""}`}>
                Kalan karakter: {remainingCharacters}
              </p>
              <button type="submit" disabled={submitting || remainingCharacters < 0}>
                {submitting ? "Analiz ediliyor..." : "Metni analiz et"}
              </button>
            </div>
          </form>

          {auth.fileUploadEnabled ? (
            <form className="upload-form" onSubmit={handleFileAnalyze}>
              <div className="upload-header">
                <p className="eyebrow">Premium Özellik</p>
                <h2>Dosya Yükle</h2>
              </div>
              <p className="upload-note">Desteklenen formatlar: .txt, .pdf, .docx</p>
              <label className="file-picker" htmlFor="file-input">
                <input
                  id="file-input"
                  type="file"
                  accept=".txt,.pdf,.docx"
                  onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                />
                <span>{selectedFile ? selectedFile.name : "Dosya seçmek için tıkla"}</span>
              </label>
              <button type="submit" disabled={uploadingFile}>
                {uploadingFile ? "Dosya analiz ediliyor..." : "Dosyayı analiz et"}
              </button>
            </form>
          ) : null}

          {auth.loggedIn && auth.planType !== "FREE" ? (
            <div className="cancel-plan-box">
              <div className="upload-header">
                <p className="eyebrow">Üyelik Yönetimi</p>
                <h2>Ücretli Planı İptal Et</h2>
              </div>
              <p className="upload-note">
                İptal işlemi sonrası hesabın Free plana döner ve ücretli özellikler kapanır.
              </p>
              {cancelError ? <p className="error-message">{cancelError}</p> : null}
              <button className="danger-button" type="button" onClick={handleCancelPlan} disabled={cancelSubmitting}>
                {cancelSubmitting ? "Üyelik iptal ediliyor..." : "Üyeliği iptal et"}
              </button>
            </div>
          ) : null}
        </div>
      </section>

      <section className="results-panel">
        <div className="results-header">
          <div>
            <p className="eyebrow">Analiz Sonucu</p>
            <h2>Canlı Özet</h2>
          </div>
          {error ? <p className="error-message">{error}</p> : null}
        </div>
        <div className="stats-grid">
          <StatCard label="Kelime Sayısı" value={result?.wordCount} />
          <StatCard label="Karakter Sayısı" value={result?.characterCount} />
          <StatCard label="Cümle Sayısı" value={result?.sentenceCount} />
          <StatCard label="En Sık Kelime" value={result?.mostFrequentWord} />
        </div>
      </section>
    </main>
  );
}
