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
import { useTranslation } from "react-i18next";
import { auth, db } from "../../firebaseConfig";
import "../../styles/SignUp.css";

const SignUp = () => {
  const { t } = useTranslation();
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
      setError("password_too_short");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("passwords_do_not_match");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`,
      });

      await sendEmailVerification(user);

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

      const logRef = collection(db, "logs_signup");
      await addDoc(logRef, {
        uid: user.uid,
        email,
        timestamp: serverTimestamp(),
      });

      alert(t("signup_success"));
      navigate("/login");
    } catch (err) {
      console.error("❌ Errore nella registrazione:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("email_already_registered");
      } else {
        setError("signup_failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <h2>{t("signup")}</h2>
      {error && <p className="error-message">{t(error)}</p>}
      <form onSubmit={handleSignUp}>
        <input
          type="text"
          name="firstName"
          placeholder={t("first_name")}
          value={formData.firstName}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="lastName"
          placeholder={t("last_name")}
          value={formData.lastName}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder={t("email")}
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder={t("password")}
          value={formData.password}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder={t("confirm_password")}
          value={formData.confirmPassword}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="company"
          placeholder={t("company")}
          value={formData.company}
          onChange={handleChange}
        />
        <select name="plan" value={formData.plan} onChange={handleChange}>
          <option value="BASE">{t("plan_base")}</option>
          <option value="GOLD">{t("plan_gold")}</option>
        </select>
        <button type="submit" disabled={loading}>
          {loading ? t("signup_loading") : t("signup")}
        </button>
      </form>
    </div>
  );
};

export default SignUp;
