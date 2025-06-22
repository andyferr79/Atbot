// 📂 E:/ATBot/frontend/src/components/admin/BenchmarkStats.js

import React, { useEffect, useState } from "react";
import api from "../../services/api";
import "../../styles/AdminDashboard.css";

const BenchmarkStats = () => {
  const [stats, setStats] = useState(null);

  const fetchBenchmark = async () => {
    try {
      const res = await api.get("/api/admin/benchmark-stats"); // ✅ rotta aggiornata
      setStats(res.data);
    } catch (err) {
      console.error("❌ Errore recupero benchmark:", err);
    }
  };

  useEffect(() => {
    fetchBenchmark();
  }, []);

  return (
    <div className="card benchmark-panel">
      <h3>Confronto Mensile</h3>
      {!stats ? (
        <p>⏳ Caricamento statistiche...</p>
      ) : (
        <ul className="benchmark-list">
          <li>
            💸 Entrate mese attuale: <strong>€{stats.currentRevenue}</strong>
          </li>
          <li>
            📊 Entrate mese scorso: <strong>€{stats.previousRevenue}</strong>
          </li>
          <li>
            📈 Variazione:{" "}
            <strong className={stats.delta > 0 ? "success" : "danger"}>
              {stats.delta > 0 ? `+${stats.delta}%` : `${stats.delta}%`}
            </strong>
          </li>
        </ul>
      )}
    </div>
  );
};

export default BenchmarkStats;
