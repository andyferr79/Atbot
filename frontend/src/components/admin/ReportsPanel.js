import React from "react";
import "../../styles/AdminDashboard.css";

const ReportsPanel = () => {
  return (
    <div className="card reports-panel">
      <h3>Centro Report</h3>
      <div className="reports-actions">
        <button className="btn">📥 Scarica Report</button>
        <button className="btn">📧 Invia via Email</button>
        <button className="btn">🗂 Consulta Storico</button>
      </div>
      <div className="reports-note">
        I report generati includono entrate, attività utenti, IA, marketing e
        performance tecniche.
      </div>
    </div>
  );
};

export default ReportsPanel;
