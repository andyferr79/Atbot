// Notifications.js - Sezione Notifiche
import React from "react";
import "../../../styles/Notifications.css";
// Stile specifico

const Notifications = () => {
  return (
    <div className="notifications">
      <h2 className="section-title">Notifiche</h2>
      <p className="section-description">
        Configura le notifiche email e push per rimanere sempre aggiornato.
      </p>

      <div className="notifications-section">
        <label className="notifications-label">
          <input type="checkbox" className="notifications-checkbox" />
          Notifiche email
        </label>
        <label className="notifications-label">
          <input type="checkbox" className="notifications-checkbox" />
          Notifiche push
        </label>
      </div>

      <div className="notifications-section">
        <label className="notifications-label">
          Aggiungi destinatario:
          <input
            type="email"
            placeholder="example@email.com"
            className="notifications-input"
          />
        </label>
      </div>

      <div className="notifications-buttons">
        <button className="save-button">Salva</button>
        <button className="cancel-button">Annulla</button>
      </div>
    </div>
  );
};

export default Notifications;
