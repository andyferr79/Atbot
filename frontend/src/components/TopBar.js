import React from "react";
import { Link } from "react-router-dom";
import { FaUser, FaUserPlus, FaSignOutAlt } from "react-icons/fa";
import logo from "../assets/stayprologo.png";
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
          <span className="icon-wrapper">
            <FaUser className="icon" />
          </span>
          <span>Login</span>
        </Link>
        <Link to="/signup" className="top-link">
          <span className="icon-wrapper">
            <FaUserPlus className="icon" />
          </span>
          <span>Registrati</span>
        </Link>
        <Link to="/logout" className="top-link">
          <span className="icon-wrapper">
            <FaSignOutAlt className="icon" />
          </span>
          <span>Logout</span>
        </Link>
      </nav>
    </header>
  );
};

export default TopBar;
