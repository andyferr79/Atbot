// 📂 E:\ATBot\frontend\src\components\TopBar.js
// Correzione percorso logo con percorso relativo corretto

import React from "react";
import { Link } from "react-router-dom";
import { FaUser, FaUserPlus, FaSignOutAlt } from "react-icons/fa";
import logo from "../assets/stayprologo.png"; // Percorso corretto
import "../styles/TopBar.css";

const TopBar = () => {
  return (
    <header className="top-bar">
      <div className="logo">
        <img src={logo} alt="StayPro Logo" className="logo-icon" />
        <span className="logo-title">StayPro</span>
      </div>
      <nav className="nav-links">
        <Link to="/login" className="top-link">
          <FaUser /> Login
        </Link>
        <Link to="/signup" className="top-link">
          <FaUserPlus /> Registrati
        </Link>
        <Link to="/logout" className="top-link">
          <FaSignOutAlt /> Logout
        </Link>
      </nav>
    </header>
  );
};

export default TopBar;

/* ✅ Nota: Il file logo deve essere in: */
/* 📂 E:\ATBot\frontend\src\assets\stayprologo.png */
