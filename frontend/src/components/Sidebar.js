import React from "react";
import { Link } from "react-router-dom"; // Usa Link di React Router
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
  faComments,
} from "@fortawesome/free-solid-svg-icons";
import "../styles/sidebar.css"; // Stili CSS

const Sidebar = () => {
  return (
    <div className="sidebar">
      {/* Header con logo */}
      <div className="sidebar-header">
        <img src="/logo.png" alt="StayPro Logo" className="sidebar-logo" />
        <h1>StayPro</h1>
      </div>

      {/* Menu principale */}
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

      {/* Footer con impostazioni, assistenza e chat */}
      <div className="sidebar-footer">
        <FontAwesomeIcon icon={faComments} className="icon" title="Chat" />
      </div>
    </div>
  );
};

export default Sidebar;
