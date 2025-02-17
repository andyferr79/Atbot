// 📂 E:\ATBot\frontend\src\pages\auth\SignUp.js
// Correzione import per firebaseConfig.js

import React, { useState } from "react";
import { auth, db, googleProvider } from "../../firebaseConfig";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";
import "../../styles/SignUp.css";

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email,
        method: "email/password",
        createdAt: serverTimestamp(),
      });
      alert("✅ Registrazione completata! Controlla la tua email.");
    } catch (err) {
      setError("❌ Errore: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await setDoc(doc(db, "users", result.user.uid), {
        email: result.user.email,
        provider: "Google",
        createdAt: serverTimestamp(),
      });
      alert("✅ Accesso riuscito tramite Google!");
    } catch (err) {
      setError("❌ Errore: " + err.message);
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
