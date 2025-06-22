import React, { useEffect, useState } from "react";
import api from "../../services/api";
import "../../../styles/Notifications.css";

const Notifications = () => {
  const userId = localStorage.getItem("user_id");
  const [settings, setSettings] = useState({
    email: false,
    push: false,
    recipients: [""],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get(`/notifications?uid=${userId}`);
        setSettings(
          res.data || { email: false, push: false, recipients: [""] }
        );
      } catch {
        console.warn("⚠️ Nessuna configurazione notifiche trovata.");
      }
    };
    fetchNotifications();
  }, [userId]);

  const handleToggle = (e) => {
    const { name, checked } = e.target;
    setSettings((prev) => ({ ...prev, [name]: checked }));
  };

  const handleRecipientChange = (index, value) => {
    const updated = [...settings.recipients];
    updated[index] = value;
    setSettings((prev) => ({ ...prev, recipients: updated }));
  };

  const handleAddRecipient = () => {
    setSettings((prev) => ({
      ...prev,
      recipients: [...prev.recipients, ""],
    }));
  };

  const handleSave = async () => {
    const sanitizedRecipients = settings.recipients.filter(
      (r) => r.trim() !== ""
    );
    setLoading(true);
    try {
      await api.post("/notifications", {
        uid: userId,
        email: settings.email,
        push: settings.push,
        recipients: sanitizedRecipients,
      });
      alert("✅ Notifiche salvate correttamente.");
    } catch {
      alert("❌ Errore durante il salvataggio.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="notifications">
      <h2 className="section-title">Notifiche</h2>
      <p className="section-description">
        Configura le notifiche email e push per rimanere sempre aggiornato.
      </p>

      <div className="notifications-section">
        {["email", "push"].map((type) => (
          <label key={type} className="notifications-label">
            <input
              type="checkbox"
              name={type}
              checked={settings[type]}
              onChange={handleToggle}
              className="notifications-checkbox"
            />
            Notifiche {type}
          </label>
        ))}
      </div>

      <div className="notifications-section">
        <h4>Destinatari Email</h4>
        {settings.recipients.map((email, idx) => (
          <input
            key={idx}
            type="email"
            className="notifications-input"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => handleRecipientChange(idx, e.target.value)}
          />
        ))}
        {settings.recipients.at(-1).trim() !== "" && (
          <button onClick={handleAddRecipient}>+ Aggiungi Destinatario</button>
        )}
      </div>

      <div className="notifications-buttons">
        <button onClick={handleSave} disabled={loading}>
          💾 Salva
        </button>
        <button onClick={() => window.location.reload()} disabled={loading}>
          ❌ Annulla
        </button>
      </div>
    </div>
  );
};

export default Notifications;
