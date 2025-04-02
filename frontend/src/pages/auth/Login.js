import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebaseConfig"; // ✅ Assicurati che il path sia corretto
import "../../styles/Login.css";

function Login() {
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

      // 🛡️ Controlla se l’email è verificata
      if (!user.emailVerified) {
        setError("Email non verificata. Controlla la tua casella di posta.");
        return;
      }

      // ✅ Salva info base nel localStorage
      localStorage.setItem("token", await user.getIdToken());
      localStorage.setItem("user_id", user.uid);
      localStorage.setItem("email", user.email);

      navigate("/dashboard");
    } catch (error) {
      console.error("Errore login Firebase:", error);
      setError("Credenziali errate o utente non registrato.");
    }
  };

  return (
    <div className="login-container">
      <h2>Accedi</h2>
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleSubmit}>
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
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login;
