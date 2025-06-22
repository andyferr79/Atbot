// 📂 E:/ATBot/frontend/src/components/admin/AnnouncementsPanel.js

import React, { useEffect, useState } from "react";
import api from "../../services/api";
import "../../styles/AdminDashboard.css";

const AnnouncementsPanel = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [destinatari, setDestinatari] = useState("all");

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get("/api/admin/announcements");
      setAnnouncements(res.data);
    } catch (err) {
      console.error("Errore nel recupero annunci:", err);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/admin/announcements", {
        title,
        message,
        pinned: false,
        destinatari: [destinatari],
      });
      setTitle("");
      setMessage("");
      setDestinatari("all");
      fetchAnnouncements();
    } catch (err) {
      console.error("Errore durante creazione annuncio:", err);
    }
  };

  return (
    <div className="card announcements-panel">
      <h3>Nuovo Annuncio</h3>
      <form onSubmit={handleSubmit} className="announcement-form">
        <input
          type="text"
          placeholder="Titolo"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="Messaggio"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        ></textarea>
        <select
          value={destinatari}
          onChange={(e) => setDestinatari(e.target.value)}
        >
          <option value="all">Tutti gli utenti</option>
          <option value="base">Solo utenti Base</option>
          <option value="gold">Solo utenti Gold</option>
        </select>
        <button type="submit">Invia</button>
      </form>

      <h4>Ultimi annunci</h4>
      <ul className="announcement-list">
        {announcements.slice(0, 5).map((a) => (
          <li key={a.id}>
            <strong>{a.title}</strong> – {a.message}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AnnouncementsPanel;
