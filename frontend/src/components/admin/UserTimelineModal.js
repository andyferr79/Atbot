// 📂 E:/ATBot/frontend/src/components/admin/UserTimelineModal.js

import React, { useState, useEffect } from "react";
import api from "../../services/api";
import "../../styles/AdminDashboard.css";

const UserTimelineModal = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [timeline, setTimeline] = useState([]);

  useEffect(() => {
    api.get("/api/admin/users").then((res) => setUsers(res.data));
  }, []);

  const fetchTimeline = async (userId) => {
    try {
      const res = await api.get(`/api/admin/user-timeline?userId=${userId}`);
      setTimeline(res.data);
    } catch (err) {
      console.error("Errore caricamento timeline:", err);
    }
  };

  const handleSelectUser = (e) => {
    const userId = e.target.value;
    setSelectedUser(userId);
    fetchTimeline(userId);
  };

  return (
    <div className="card user-timeline-modal">
      <h3>Attività Utente</h3>
      <select onChange={handleSelectUser} value={selectedUser || ""}>
        <option value="" disabled>
          Seleziona un utente
        </option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.email}
          </option>
        ))}
      </select>

      {timeline.length > 0 ? (
        <ul className="timeline-list">
          {timeline.map((event, idx) => (
            <li key={idx}>
              <strong>{event.action}</strong> –{" "}
              {new Date(event.timestamp).toLocaleString()}
            </li>
          ))}
        </ul>
      ) : (
        selectedUser && <p>⏳ Nessuna attività recente trovata.</p>
      )}
    </div>
  );
};

export default UserTimelineModal;
