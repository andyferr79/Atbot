import React, { useEffect, useState } from "react";
import api from "../../services/api";
import "../../styles/AdminDashboard.css";

const LogsPanel = () => {
  const [logs, setLogs] = useState([]);
  const [backupStatus, setBackupStatus] = useState("Caricamento...");
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await api.get("/admin/system-logs");
      const sortedLogs = res.data.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );
      setLogs(sortedLogs);
    } catch (err) {
      console.error("Errore log sistema:", err);
    }
  };

  const fetchBackupStatus = async () => {
    try {
      const res = await api.get("/admin/backup-status");
      setBackupStatus(res.data.status);
    } catch (err) {
      console.error("Errore stato backup:", err);
    }
  };

  const triggerBackup = async () => {
    try {
      await api.post("/admin/start-backup");
      setBackupStatus("Backup avviato...");
    } catch (err) {
      console.error("Errore avvio backup:", err);
    }
  };

  useEffect(() => {
    const load = async () => {
      await fetchLogs();
      await fetchBackupStatus();
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="card logs-panel">
      <h3>Log & Backup</h3>
      {loading ? (
        <p>⏳ Caricamento dati...</p>
      ) : (
        <>
          <div className="backup-section">
            <p>
              🗄️ Stato Backup: <strong>{backupStatus}</strong>
            </p>
            <button className="btn" onClick={triggerBackup}>
              Avvia Backup Manuale
            </button>
          </div>

          <ul className="logs-list">
            {logs.map((log, idx) => (
              <li key={idx}>
                <strong>{log.type}</strong> – {log.message} –{" "}
                {new Date(log.timestamp).toLocaleString()}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default LogsPanel;
