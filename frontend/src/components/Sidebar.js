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
import { useTranslation } from "react-i18next";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import api from "../services/api";
import "../styles/sidebar.css";

const Sidebar = () => {
  const { t } = useTranslation();
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

      // Ruolo salvato al login
      setRole(localStorage.getItem("role") || "user");

      try {
        // 🔔 Notifiche
        const { data: notif } = await api.get("/getUnreadNotificationsCount");
        setUnreadNotifications(notif.unreadCount || 0);

        // 📬 Annunci ufficiali
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
            <span>{t("sidebar.dashboard")}</span>
          </Link>
        </li>
        <li>
          <Link to="/bookings">
            <FontAwesomeIcon icon={faBook} className="icon" />
            <span>{t("sidebar.bookings")}</span>
          </Link>
        </li>
        <li>
          <Link to="/guests">
            <FontAwesomeIcon icon={faUser} className="icon" />
            <span>{t("sidebar.guests")}</span>
          </Link>
        </li>
        <li>
          <Link to="/rooms">
            <FontAwesomeIcon icon={faBed} className="icon" />
            <span>{t("sidebar.rooms")}</span>
          </Link>
        </li>
        <li>
          <Link to="/reports">
            <FontAwesomeIcon icon={faChartBar} className="icon" />
            <span>{t("sidebar.reports")}</span>
          </Link>
        </li>
        <li>
          <Link to="/marketing">
            <FontAwesomeIcon icon={faBullhorn} className="icon" />
            <span>{t("sidebar.marketing")}</span>
          </Link>
        </li>
        <li>
          <Link to="/suppliers">
            <FontAwesomeIcon icon={faTruck} className="icon" />
            <span>{t("sidebar.suppliers")}</span>
          </Link>
        </li>
      </ul>

      <hr className="sidebar-divider" />

      {/* ------------ NOTIFICHE / ANNUNCI --------------- */}
      <ul className="sidebar-menu">
        <li>
          <Link to="/notifications">
            <FontAwesomeIcon icon={faBell} className="icon" />
            <span>{t("sidebar.notifications")}</span>
            {unreadNotifications > 0 && (
              <span className="badge">{unreadNotifications}</span>
            )}
          </Link>
        </li>
        <li>
          <Link to="/announcements">
            <FontAwesomeIcon icon={faEnvelopeOpenText} className="icon" />
            <span>{t("sidebar.officialAnnouncements")}</span>
            {unreadAnnouncements > 0 && (
              <span className="badge">{unreadAnnouncements}</span>
            )}
          </Link>
        </li>
        {role === "admin" && (
          <li>
            <Link to="/admin-dashboard">
              <FontAwesomeIcon icon={faCrown} className="icon" />
              <span>Amministrazione</span>
            </Link>
          </li>
        )}
      </ul>

      <hr className="sidebar-divider" />

      {/* ------------ SETTINGS --------------- */}
      <ul className="sidebar-menu">
        <li>
          <Link to="/settings">
            <FontAwesomeIcon icon={faCog} className="icon" />
            <span>{t("sidebar.settings")}</span>
          </Link>
        </li>
      </ul>

      <hr className="sidebar-divider" />

      {/* ------------ HELP / AI --------------- */}
      <ul className="sidebar-menu">
        <li>
          <Link to="/support">
            <FontAwesomeIcon icon={faLifeRing} className="icon" />
            <span>{t("sidebar.support")}</span>
          </Link>
        </li>
        <li>
          <Link to="/chatbox">
            <FontAwesomeIcon icon={faRobot} className="icon" />
            <span>{t("sidebar.chatIA")}</span>
          </Link>
        </li>
        <li>
          <Link to="/agent-hub">
            <FontAwesomeIcon icon={faRobot} className="icon" />
            <span>{t("sidebar.agentHub")}</span>
          </Link>
        </li>
      </ul>

      {/* ------------ UPGRADE BANNER --------------- */}
      <div className="sidebar-upgrade">
        <div className="upgrade-content">
          <img src="/gold-icon.png" alt="Gold Plan" className="upgrade-icon" />
          <p>{t("upgrade.message")}</p>
          <Link to="/upgrade" className="upgrade-btn">
            {t("upgrade.button")}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
