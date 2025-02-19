// 📂 E:\\ATBot\\frontend\\src\\pages\\auth\\SignUp.js
// Correzione import per firebaseConfig.js

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../styles/SignUp.css";

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await axios.post(
        "http://localhost:3001/api/auth/register",
        {
          email,
          password,
        }
      );
      localStorage.setItem("token", response.data.token);
      alert("✅ Registrazione completata! Controlla la tua email.");
      navigate("/dashboard");
    } catch (err) {
      setError("❌ Errore: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:3001/api/auth/google"
      );
      localStorage.setItem("token", response.data.token);
      alert("✅ Accesso riuscito tramite Google!");
      navigate("/dashboard");
    } catch (err) {
      setError("❌ Errore: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <h2>🧪 Test della Registrazione StayPro</h2>
      <form onSubmit={handleSignUp}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Account"}
        </button>
        <button
          type="button"
          className="google-button"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          {loading ? "Connecting..." : "Sign up with Google"}
        </button>
        {error && <p className="error-message">{error}</p>}
      </form>
      <p>📝 Controlla la console e Firebase Firestore dopo il test.</p>
    </div>
  );
};

export default SignUp;
