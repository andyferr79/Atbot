import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { useTranslation } from "react-i18next";
import { auth } from "../../firebaseConfig";
import "../../styles/Login.css";

/**
 * Login page ‒ authenticates the user with Firebase Auth,
 * stores a fresh ID‑Token in localStorage and redirects
 * to the correct area (admin‑dashboard or home).
 */
export default function Login() {
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showResend, setShowResend] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const db = getFirestore();

  /**
   * Handles the form submission and user sign‑in.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setShowResend(false);
    setLoading(true);

    try {
      // 🔐 authenticate with Firebase Auth
      const { user } = await signInWithEmailAndPassword(auth, email, password);

      // 🚫 block if e‑mail is not verified
      if (!user.emailVerified) {
        setError("email_not_verified");
        setShowResend(true);
        setLoading(false);
        return;
      }

      // 🔑 get a *fresh* ID‑Token (forces refresh)
      const token = await user.getIdToken(true);
      if (!token) throw new Error("token_missing");

      // 💾 persist session in localStorage for API interceptor
      localStorage.setItem("firebaseToken", token);
      localStorage.setItem("user_id", user.uid);
      localStorage.setItem("email", user.email);

      // 📥 fetch extra user data (role / plan)
      const snap = await getDoc(doc(db, "users", user.uid));
      const { role = "user", plan = "BASE" } = snap.exists() ? snap.data() : {};

      localStorage.setItem("role", role);
      localStorage.setItem("plan", plan);

      // 🚀 redirect based on role
      navigate(role === "admin" ? "/admin-dashboard" : "/");
    } catch (err) {
      console.error("Login error →", err.code || err.message);
      // map common Firebase Auth errors to translation keys
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

  /**
   * Sends the verification e‑mail again if the user asks for it.
   */
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
