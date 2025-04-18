import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useTranslation } from "react-i18next";
import "../styles/AnnouncementsPage.css";

const AnnouncementsPage = () => {
  const { t } = useTranslation();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get("/getOfficialAnnouncements");
      setAnnouncements(res.data);
    } catch (err) {
      console.error("Errore nel recupero annunci:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const archiveAnnouncement = async (id) => {
    try {
      await api.post("/archiveAnnouncement", { announcementId: id });
      setAnnouncements((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, status: { ...a.status, archived: true } } : a
        )
      );
    } catch (err) {
      console.error("Errore durante archiviazione:", err);
    }
  };

  const deleteAnnouncement = async (id) => {
    try {
      await api.post("/deleteAnnouncement", { announcementId: id });
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Errore durante eliminazione:", err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.post("/markAnnouncementAsRead", { announcementId: id });
      setAnnouncements((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, status: { ...a.status, read: true } } : a
        )
      );
    } catch (err) {
      console.error("Errore nel segnare come letto:", err);
    }
  };

  return (
    <div className="announcements-container">
      <h2>{t("notifications.title") || "Comunicazioni Ufficiali"}</h2>

      {loading ? (
        <p>⏳ Caricamento...</p>
      ) : announcements.length === 0 ? (
        <p>📭 Nessuna comunicazione disponibile.</p>
      ) : (
        <ul className="announcement-list">
          {announcements
            .filter((a) => !a.status?.archived)
            .map((announcement) => (
              <li
                key={announcement.id}
                className={`announcement-item ${
                  !announcement.status.read ? "unread" : ""
                }`}
              >
                <div className="announcement-header">
                  <strong>{announcement.title}</strong>
                  <span className="date">
                    {new Date(announcement.date).toLocaleDateString()}
                  </span>
                </div>
                <p className="message">{announcement.message}</p>
                <div className="actions">
                  {!announcement.status.read && (
                    <button onClick={() => markAsRead(announcement.id)}>
                      Segna come letto
                    </button>
                  )}
                  <button onClick={() => archiveAnnouncement(announcement.id)}>
                    Archivia
                  </button>
                  <button onClick={() => deleteAnnouncement(announcement.id)}>
                    Elimina
                  </button>
                </div>
                {!announcement.status.read && (
                  <span className="badge">NUOVO</span>
                )}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
};

export default AnnouncementsPage;
