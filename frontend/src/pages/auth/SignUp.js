// 📂 E:/ATBot/frontend/src/pages/auth/SignUp.js

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  setDoc,
  serverTimestamp,
  collection,
  addDoc,
} from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import "../../styles/SignUp.css";

const SignUp = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    company: "",
    plan: "BASE",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const {
      email,
      password,
      confirmPassword,
      firstName,
      lastName,
      company,
      plan,
    } = formData;

    if (password.length < 6) {
      setError("La password deve contenere almeno 6 caratteri.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Le password non corrispondono.");
      setLoading(false);
      return;
    }

    try {
      // ✅ Crea utente su Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // ✅ Aggiorna il profilo utente
      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`,
      });

      // ✅ Invia email di verifica
      await sendEmailVerification(user);

      // ✅ Salva su Firestore
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email,
        firstName,
        lastName,
        company,
        plan,
        role: "user",
        createdAt: serverTimestamp(),
      });

      // ✅ Log evento in logs_signup
      const logRef = collection(db, "logs_signup");
      await addDoc(logRef, {
        uid: user.uid,
        email,
        timestamp: serverTimestamp(),
      });

      alert(
        "✅ Registrazione avvenuta con successo! Controlla la tua email per confermare l'account."
      );
      navigate("/login");
    } catch (err) {
      console.error("❌ Errore nella registrazione:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("Questa email è già registrata.");
      } else {
        setError(
          "Registrazione fallita. " + (err.message || "Riprova più tardi.")
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <h2>Registrazione</h2>
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleSignUp}>
        <input
          type="text"
          name="firstName"
          placeholder="Nome"
          value={formData.firstName}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="lastName"
          placeholder="Cognome"
          value={formData.lastName}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder="Conferma Password"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="company"
          placeholder="Azienda"
          value={formData.company}
          onChange={handleChange}
        />
        <select name="plan" value={formData.plan} onChange={handleChange}>
          <option value="BASE">Piano BASE</option>
          <option value="GOLD">Piano GOLD</option>
        </select>
        <button type="submit" disabled={loading}>
          {loading ? "Registrazione in corso..." : "Registrati"}
        </button>
      </form>
    </div>
  );
};

export default SignUp;
