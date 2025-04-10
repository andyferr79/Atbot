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
} from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import api from "../services/api";
import "../styles/sidebar.css";

const Sidebar = () => {
  const { t } = useTranslation();

  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadAnnouncements, setUnreadAnnouncements] = useState(0);

  useEffect(() => {
    fetchUnreadCounts();
  }, []);

  const fetchUnreadCounts = async () => {
    try {
      const notificationsResponse = await api.get(
        "/getUnreadNotificationsCount"
      );
      setUnreadNotifications(notificationsResponse.data.unreadCount || 0);
    } catch (error) {
      console.error("Errore nel recupero delle notifiche:", error);
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <img src="/logo.png" alt="StayPro Logo" className="sidebar-logo" />
        <h1>StayPro</h1>
      </div>

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
          </Link>
        </li>
      </ul>

      <hr className="sidebar-divider" />

      <ul className="sidebar-menu">
        <li>
          <Link to="/settings">
            <FontAwesomeIcon icon={faCog} className="icon" />
            <span>{t("sidebar.settings")}</span>
          </Link>
        </li>
      </ul>

      <hr className="sidebar-divider" />

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

      {/* 🔥 Upgrade Banner in fondo */}
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
