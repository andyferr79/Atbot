// 📂 E:/ATBot/frontend/src/pages/auth/Login.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { useTranslation } from "react-i18next";
import { auth } from "../../firebaseConfig";
import "../../styles/Login.css";

/**
 * Login page ‒ autenticazione con Firebase Auth,
 * salvataggio ID‑Token con custom claims in localStorage
 * e redirect in base al ruolo.
 */
export default function Login() {
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showResend, setShowResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setShowResend(false);
    setLoading(true);

    try {
      // 🔐 autenticazione
      const { user } = await signInWithEmailAndPassword(auth, email, password);

      // 🚫 blocco se email non verificata
      if (!user.emailVerified) {
        setError("email_not_verified");
        setShowResend(true);
        setLoading(false);
        return;
      }

      // 🔑 forziamo il refresh e leggiamo i custom claims
      const idTokenResult = await user.getIdTokenResult(true);
      const token = idTokenResult.token;
      if (!token) throw new Error("token_missing");

      // 💾 salviamo token e dati utente
      localStorage.setItem("firebaseToken", token);
      localStorage.setItem("user_id", user.uid);
      localStorage.setItem("email", user.email);

      // 📑 leggiamo role e plan dai claims
      const { role = "user", plan = "BASE" } = idTokenResult.claims || {};

      localStorage.setItem("role", role);
      localStorage.setItem("plan", plan);

      // 🚀 redirect
      navigate(role === "admin" ? "/admin-dashboard" : "/");
    } catch (err) {
      console.error("Login error →", err.code || err.message);
      const codeMap = {
        "auth/user-not-found": "user_not_found",
        "auth/wrong-password": "invalid_credentials",
        "auth/too-many-requests": "too_many_requests",
      };
      setError(codeMap[err.code] || "login_failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      const user = auth.currentUser;
      if (user && !user.emailVerified) {
        await sendEmailVerification(user);
        alert(t("verification_email_sent"));
      }
    } catch (err) {
      console.error("Resend verification error →", err.message);
      alert(t("error_sending_verification_email"));
    }
  };

  return (
    <div className="login-container">
      <h2>{t("login")}</h2>

      {error && <p className="error-message">{t(error)}</p>}

      {showResend && (
        <button
          type="button"
          onClick={handleResendVerification}
          className="resend-button"
        >
          {t("resend_verification_email")}
        </button>
      )}

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder={t("email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <input
          type="password"
          placeholder={t("password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        <button type="submit" disabled={loading} className="primary-button">
          {loading ? t("loading") : t("login")}
        </button>
      </form>
    </div>
  );
}
