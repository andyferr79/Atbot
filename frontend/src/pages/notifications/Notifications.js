import React, { useState, useEffect } from "react";
import api from "../../services/api";
import "../../styles/notifications-cliente.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faInbox,
  faStar,
  faArchive,
  faTrash,
  faCheck,
  faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";
import Sidebar from "../../components/Sidebar"; // Sidebar di StayPro

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [filter, setFilter] = useState("inbox");

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get("/notifications");
      setNotifications(response.data.notifications);
    } catch (error) {
      console.error("Errore nel recupero delle notifiche:", error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/read/${id}`);
      fetchNotifications();
    } catch (error) {
      console.error("Errore nel segnare la notifica come letta:", error);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "inbox") return true;
    if (filter === "starred") return n.starred;
    if (filter === "archived") return n.archived;
    return false;
  });

  return (
    <div className="notifications-page">
      <Sidebar /> {/* Sidebar di StayPro sempre visibile */}
      <div className="notifications-container">
        {/* Sidebar interna per i filtri */}
        <div className="notifications-sidebar">
          <button className="new-message-btn">
            <FontAwesomeIcon icon={faPaperPlane} /> Nuovo Messaggio
          </button>

          <h3>Filtri</h3>
          <button
            className={filter === "inbox" ? "active" : ""}
            onClick={() => setFilter("inbox")}
          >
            <FontAwesomeIcon icon={faInbox} /> Inbox
          </button>
          <button
            className={filter === "starred" ? "active" : ""}
            onClick={() => setFilter("starred")}
          >
            <FontAwesomeIcon icon={faStar} /> Preferiti
          </button>
          <button
            className={filter === "archived" ? "active" : ""}
            onClick={() => setFilter("archived")}
          >
            <FontAwesomeIcon icon={faArchive} /> Archiviati
          </button>
          <button
            className={filter === "deleted" ? "active" : ""}
            onClick={() => setFilter("deleted")}
          >
            <FontAwesomeIcon icon={faTrash} /> Cestino
          </button>
        </div>

        {/* Lista delle notifiche */}
        <div className="notifications-list">
          <h3>Notifiche</h3>
          {filteredNotifications.length === 0 ? (
            <p className="empty-message">🎉 Nessuna nuova notifica!</p>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`notification-item ${
                  selectedNotification?.id === notification.id ? "selected" : ""
                } ${notification.status === "unread" ? "unread" : ""}`}
                onClick={() => setSelectedNotification(notification)}
              >
                <img
                  src="/user-avatar.png"
                  alt="Avatar"
                  className="notification-avatar"
                />
                <div className="notification-text">
                  <strong>{notification.type.toUpperCase()}</strong>
                  <p>{notification.message}</p>
                  <small>
                    {new Date(notification.createdAt).toLocaleString()}
                  </small>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Dettaglio della notifica */}
        <div className="notification-details">
          {selectedNotification ? (
            <>
              <h3>{selectedNotification.type.toUpperCase()}</h3>
              <p>{selectedNotification.message}</p>
              <button
                className="mark-read-btn"
                onClick={() => markAsRead(selectedNotification.id)}
              >
                <FontAwesomeIcon icon={faCheck} /> Segna come letta
              </button>
            </>
          ) : (
            <p className="empty-details">
              Seleziona una notifica per visualizzarne i dettagli.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
