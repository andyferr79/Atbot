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
  const navigate = useNavigate();

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

  const isPasswordStrong = (pwd) =>
    /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(pwd);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSignUp = async (e) => {
    e.preventDefault();
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

    if (password !== confirmPassword) {
      setError("passwords_do_not_match");
      return;
    }
    if (!isPasswordStrong(password)) {
      setError("password_too_weak");
      return;
    }

    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`,
      });

      await sendEmailVerification(user);

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email,
        firstName,
        lastName,
        company,
        plan: plan.toUpperCase(),
        role: "user",
        createdAt: serverTimestamp(),
      });

      await addDoc(collection(db, "logs_signup"), {
        uid: user.uid,
        email,
        plan: plan.toUpperCase(),
        ts: serverTimestamp(),
      });

      localStorage.setItem("user_id", user.uid); // ✅ Aggiunto salvataggio UID

      alert(t("signup_success_check_email"));
      navigate("/login");
    } catch (err) {
      console.error("❌ Sign‑up error:", err);
      switch (err.code) {
        case "auth/email-already-in-use":
          setError("email_already_registered");
          break;
        case "auth/invalid-email":
          setError("invalid_email_format");
          break;
        case "auth/weak-password":
          setError("password_too_weak");
          break;
        default:
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

      <form onSubmit={handleSignUp} noValidate>
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
          autoComplete="organization"
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
