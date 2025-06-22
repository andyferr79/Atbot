// ✅ BackupSecurity.js - Collegato al backend reale e multi-utente
import React, { useEffect, useState, useCallback } from "react";
import api from "../../services/api";
import "../../../styles/BackupSecurity.css";

const BackupSecurity = () => {
  const [lastBackup, setLastBackup] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const userId = localStorage.getItem("user_id");

  const fetchBackupStatus = useCallback(async () => {
    try {
      const res = await api.get(`/getBackupStatus?uid=${userId}`);
      setLastBackup(res.data.timestamp);
    } catch (err) {
      setLastBackup(null);
    }
  }, [userId]);

  const handleCreateBackup = async () => {
    setLoading(true);
    try {
      await api.post("/startBackup", { uid: userId });
      alert("✅ Backup creato con successo!");
      fetchBackupStatus();
    } catch (err) {
      alert("❌ Errore creazione backup.");
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!window.confirm("Sei sicuro di voler ripristinare l'ultimo backup?"))
      return;
    setLoading(true);
    try {
      await api.post("/restoreBackup", { uid: userId });
      alert("✅ Backup ripristinato.");
    } catch (err) {
      alert("❌ Errore ripristino backup.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword.trim()) {
      return alert("❌ Inserisci una nuova password valida.");
    }
    try {
      await api.put("/updatePassword", {
        uid: userId,
        newPassword,
      });
      alert("✅ Password aggiornata con successo.");
      setNewPassword("");
    } catch (err) {
      alert("❌ Errore aggiornamento password.");
    }
  };

  useEffect(() => {
    fetchBackupStatus();
  }, [fetchBackupStatus]);

  return (
    <div className="backup-security">
      <h2 className="section-title">Backup & Sicurezza</h2>
      <p className="section-description">
        Gestisci i tuoi dati con backup automatici e cambia la tua password in
        sicurezza.
      </p>

      <div className="backup-section">
        <h3>Backup Manuale</h3>
        <p>
          Ultimo Backup:{" "}
          <strong>{lastBackup || "Nessun backup trovato."}</strong>
        </p>
        <button onClick={handleCreateBackup} disabled={loading}>
          📦 Crea Backup Ora
        </button>
        <button onClick={handleRestoreBackup} disabled={loading}>
          ♻️ Ripristina Backup
        </button>
      </div>

      <div className="security-section">
        <h3>Cambia Password</h3>
        <input
          type="password"
          placeholder="Nuova password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <button onClick={handlePasswordChange} disabled={loading}>
          🔐 Aggiorna Password
        </button>
      </div>
    </div>
  );
};

export default BackupSecurity;
