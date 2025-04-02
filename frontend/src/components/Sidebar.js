// 📂 E:\ATBot\frontend\src\components\Sidebar.js
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
import api from "../services/api";
import "../styles/sidebar.css";

const Sidebar = () => {
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadAnnouncements, setUnreadAnnouncements] = useState(0);

  useEffect(() => {
    fetchUnreadCounts();
  }, []);

  const fetchUnreadCounts = async () => {
    try {
      const notificationsResponse = await api.get(
        "/notifications/unread-count"
      );
      setUnreadNotifications(notificationsResponse.data.count);
      const announcementsResponse = await api.get(
        "/notifications/announcements/unread-count"
      );
      setUnreadAnnouncements(announcementsResponse.data.count);
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
            <span>Comunicazioni Ufficiali</span>
            {unreadAnnouncements > 0 && (
              <span className="badge">{unreadAnnouncements}</span>
            )}
          </Link>
        </li>
      </ul>
      <hr className="sidebar-divider" />
      <ul className="sidebar-menu">
        <li>
          <Link to="/settings">
            <FontAwesomeIcon icon={faCog} className="icon" />
            <span>Impostazioni</span>
          </Link>
        </li>
      </ul>
      <hr className="sidebar-divider" />
      <ul className="sidebar-menu">
        <li>
          <Link to="/support">
            <FontAwesomeIcon icon={faLifeRing} className="icon" />
            <span>Assistenza</span>
          </Link>
        </li>
        <li>
          <Link to="/chatbox">
            <FontAwesomeIcon icon={faRobot} className="icon" />
            <span>Chat IA</span>
          </Link>
        </li>
        <li>
          <Link to="/agent-hub">
            <FontAwesomeIcon icon={faRobot} className="icon" />
            <span>HUB Agente IA</span>
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
