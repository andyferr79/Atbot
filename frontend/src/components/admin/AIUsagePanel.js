// 📂 E:/ATBot/frontend/src/components/admin/AIUsagePanel.js

import React, { useEffect, useState } from "react";
import api from "../../services/api";
import "../../styles/AdminDashboard.css";

const AIUsagePanel = () => {
  const [stats, setStats] = useState(null);

  const fetchStats = async () => {
    try {
      const res = await api.get("/api/admin/ai-usage"); // ✅ Rotta aggiornata
      setStats(res.data);
    } catch (err) {
      console.error("❌ Errore nel recupero statistiche IA:", err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="card ai-usage-panel">
      <h3>Statistiche IA</h3>
      {!stats ? (
        <p>⏳ Caricamento dati IA...</p>
      ) : (
        <ul className="ai-usage-list">
          <li>
            📨 Risposte IA generate oggi:{" "}
            <strong>{stats.responsesToday}</strong>
          </li>
          <li>
            ⚙️ Funzioni più usate:{" "}
            <strong>{stats.topFeatures.join(", ")}</strong>
          </li>
          <li>
            🕒 Tempo medio risposta: <strong>{stats.avgResponseTime}ms</strong>
          </li>
          <li>
            ✅ Stato API:{" "}
            <strong
              className={stats.apiStatus === "ONLINE" ? "success" : "danger"}
            >
              {stats.apiStatus}
            </strong>
          </li>
        </ul>
      )}
    </div>
  );
};

export default AIUsagePanel;
