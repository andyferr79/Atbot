import React from "react";
import { Link } from "react-router-dom";
import { FaUser, FaUserPlus, FaSignOutAlt } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import logo from "../assets/stayprologo.png";
import "../styles/TopBar.css";

const TopBar = () => {
  const { t, i18n } = useTranslation();

  const changeLanguage = (e) => {
    const selectedLang = e.target.value;
    i18n.changeLanguage(selectedLang);
    localStorage.setItem("i18nextLng", selectedLang);
  };

  return (
    <header className="top-bar">
      <div className="logo">
        <img src={logo} alt="StayPro Logo" className="logo-icon" />
        <span className="logo-title">StayPro</span>
      </div>

      <nav className="nav-links">
        <Link to="/login" className="top-link">
          <span className="icon-wrapper">
            <FaUser className="icon" />
          </span>
          <span>{t("topbar.login")}</span>
        </Link>

        <Link to="/signup" className="top-link">
          <span className="icon-wrapper">
            <FaUserPlus className="icon" />
          </span>
          <span>{t("topbar.signup")}</span>
        </Link>

        <Link to="/logout" className="top-link">
          <span className="icon-wrapper">
            <FaSignOutAlt className="icon" />
          </span>
          <span>{t("topbar.logout")}</span>
        </Link>
      </nav>

      <div className="language-select">
        <select onChange={changeLanguage} value={i18n.language}>
          <option value="en">English</option>
          <option value="it">Italiano</option>
          <option value="fr">Français</option>
          <option value="es">Español</option>
          <option value="de">Deutsch</option>
          <option value="pt">Português</option>
          <option value="ar">العربية</option>
          <option value="th">ไทย</option>
          <option value="ja">日本語</option>
          <option value="ko">한국어</option>
          <option value="tl">Filipino</option>
          <option value="en-AU">English (AU)</option>
          <option value="el">Ελληνικά</option>
          <option value="nl">Nederlands</option>
          <option value="pl">Polski</option>
          <option value="sv">Svenska</option>
        </select>
      </div>
    </header>
  );
};

export default TopBar;
