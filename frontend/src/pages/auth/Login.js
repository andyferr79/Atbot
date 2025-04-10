import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useTranslation } from "react-i18next";
import { auth } from "../../firebaseConfig";
import "../../styles/Login.css";

function Login() {
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      if (!user.emailVerified) {
        setError("email_not_verified");
        return;
      }

      const token = await user.getIdToken(true);
      if (!token) throw new Error("Token non ricevuto");

      localStorage.setItem("firebaseToken", token);
      localStorage.setItem("token", token);
      localStorage.setItem("user_id", user.uid);
      localStorage.setItem("email", user.email);

      navigate("/");
    } catch (err) {
      console.error("❌ Errore login:", err.code, err.message);
      setError("invalid_credentials");
    }
  };

  return (
    <div className="login-container">
      <h2>{t("login")}</h2>
      {error && <p className="error-message">{t(error)}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder={t("email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder={t("password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">{t("login")}</button>
      </form>
    </div>
  );
}

export default Login;
