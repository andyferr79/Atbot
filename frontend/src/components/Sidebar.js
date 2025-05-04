// 📂 E:/ATBot/frontend/src/components/Sidebar.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faBook,
  faUser,
  faBed,
  faChartBar,
  faBullhorn,
  faTruck,
  faCog,
  faLifeRing,
  faRobot,
  faBell,
  faEnvelopeOpenText,
  faCrown,
} from "@fortawesome/free-solid-svg-icons";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import api from "../services/api";
import AgentChatbox from "../pages/AgentChatbox"; // ✅ Chatbox fluttuante
import "../styles/sidebar.css";

const Sidebar = () => {
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadAnnouncements, setUnreadAnnouncements] = useState(0);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUnreadNotifications(0);
        setUnreadAnnouncements(0);
        setRole(null);
        return;
      }

      setRole(localStorage.getItem("role") || "user");

      try {
        const { data: notif } = await api.get("/getUnreadNotificationsCount");
        setUnreadNotifications(notif.unreadCount || 0);

        const { data: ann } = await api.get("/getOfficialAnnouncements");
        const unread = ann.filter((a) => !a.status?.read);
        setUnreadAnnouncements(unread.length);
      } catch (err) {
        console.error("Errore notifiche/annunci:", err);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
      <div className="sidebar">
        {/* ------------ LOGO --------------- */}
        <div className="sidebar-header">
          <img src="/logo.png" alt="StayPro Logo" className="sidebar-logo" />
          <h1>StayPro</h1>
        </div>

        {/* ------------ MENU PRINCIPALE --------------- */}
        <ul className="sidebar-menu">
          <li>
            <Link to="/">
              <FontAwesomeIcon icon={faHome} className="icon" />
              <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link to="/bookings">
              <FontAwesomeIcon icon={faBook} className="icon" />
              <span>Prenotazioni</span>
            </Link>
          </li>
          <li>
            <Link to="/guests">
              <FontAwesomeIcon icon={faUser} className="icon" />
              <span>Ospiti</span>
            </Link>
          </li>
          <li>
            <Link to="/rooms">
              <FontAwesomeIcon icon={faBed} className="icon" />
              <span>Camere</span>
            </Link>
          </li>
          <li>
            <Link to="/reports">
              <FontAwesomeIcon icon={faChartBar} className="icon" />
              <span>Report</span>
            </Link>
          </li>
          <li>
            <Link to="/marketing">
              <FontAwesomeIcon icon={faBullhorn} className="icon" />
              <span>Marketing</span>
            </Link>
          </li>
          <li>
            <Link to="/suppliers">
              <FontAwesomeIcon icon={faTruck} className="icon" />
              <span>Fornitori</span>
            </Link>
          </li>
        </ul>

        <hr className="sidebar-divider" />

        {/* ------------ NOTIFICHE / ANNUNCI --------------- */}
        <ul className="sidebar-menu">
          <li>
            <Link to="/notifications">
              <FontAwesomeIcon icon={faBell} className="icon" />
              <span>Notifiche</span>
              {unreadNotifications > 0 && (
                <span className="badge">{unreadNotifications}</span>
              )}
            </Link>
          </li>
          <li>
            <Link to="/announcements">
              <FontAwesomeIcon icon={faEnvelopeOpenText} className="icon" />
              <span>Annunci</span>
              {unreadAnnouncements > 0 && (
                <span className="badge">{unreadAnnouncements}</span>
              )}
            </Link>
          </li>
          {role === "admin" && (
            <li>
              <Link to="/admin-dashboard">
                <FontAwesomeIcon icon={faCrown} className="icon" />
                <span>Admin</span>
              </Link>
            </li>
          )}
        </ul>

        <hr className="sidebar-divider" />

        {/* ------------ SETTINGS / SUPPORTO --------------- */}
        <ul className="sidebar-menu">
          <li>
            <Link to="/settings">
              <FontAwesomeIcon icon={faCog} className="icon" />
              <span>Impostazioni</span>
            </Link>
          </li>
          <li>
            <Link to="/support">
              <FontAwesomeIcon icon={faLifeRing} className="icon" />
              <span>Assistenza</span>
            </Link>
          </li>
        </ul>

        <hr className="sidebar-divider" />

        {/* ------------ AGENTE IA --------------- */}
        <div className="sidebar-section-title">AGENTE IA</div>
        <ul className="sidebar-menu agent-section">
          <li>
            <div className="agent-ia-entry">
              <FontAwesomeIcon icon={faRobot} className="icon pulse" />
              <span>Agente</span>
            </div>
          </li>
          <li>
            <Link to="/agent-hub">
              <FontAwesomeIcon icon={faRobot} className="icon" />
              <span>HUB Agente IA</span>
            </Link>
          </li>
        </ul>

        {/* ------------ UPGRADE BANNER --------------- */}
        <div className="sidebar-upgrade">
          <div className="upgrade-content">
            <img
              src="/gold-icon.png"
              alt="Gold Plan"
              className="upgrade-icon"
            />
            <p>Passa al piano Gold</p>
            <Link to="/upgrade" className="upgrade-btn">
              Aggiorna ora
            </Link>
          </div>
        </div>
      </div>

      {/* ✅ Agent fluttuante attivo ovunque */}
      <AgentChatbox />
    </>
  );
};

export default Sidebar;
