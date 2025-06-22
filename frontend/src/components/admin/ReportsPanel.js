// 📂 E:/ATBot/frontend/src/components/admin/ReportsPanel.js

import React, { useEffect, useState } from "react";
import api from "../../services/api";
import "../../styles/AdminDashboard.css";

const ReportsPanel = () => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchReportHistory = async () => {
      try {
        const res = await api.get("/api/admin/reports/history");
        setHistory(res.data || []);
      } catch (err) {
        console.error("Errore nel recupero storico report:", err);
      }
    };

    fetchReportHistory();
  }, []);

  const handleDownload = async () => {
    try {
      const res = await api.get("/api/admin/reports/export", {
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "report.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Errore nel download report:", err);
    }
  };

  const handleSendEmail = async () => {
    try {
      await api.post("/api/admin/reports/send-latest");
      alert("📧 Report inviato con successo!");
    } catch (err) {
      console.error("Errore invio report via email:", err);
    }
  };

  return (
    <div className="card reports-panel">
      <h3>Centro Report</h3>

      <div className="reports-actions">
        <button className="btn" onClick={handleDownload}>
          📥 Scarica Report
        </button>
        <button className="btn" onClick={handleSendEmail}>
          📧 Invia via Email
        </button>
      </div>

      <div className="reports-note">
        I report includono entrate, attività utenti, IA, marketing e performance
        tecniche.
      </div>

      <h4>🗂 Storico Report Generati</h4>
      <ul className="reports-history">
        {history.length === 0 ? (
          <li>Nessun report generato.</li>
        ) : (
          history.map((item, idx) => (
            <li key={idx}>
              📄 {item.name} –{" "}
              <span className="timestamp">
                {new Date(item.timestamp).toLocaleString()}
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default ReportsPanel;
