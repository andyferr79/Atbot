// BackupSecurity.js - Gestione Backup e Sicurezza
import React, { useState } from "react";
import "../../../styles/BackupSecurity.css";

const BackupSecurity = () => {
  const [backups, setBackups] = useState([
    { id: 1, date: "2025-01-24", size: "10MB" },
    { id: 2, date: "2025-01-23", size: "9MB" },
  ]);
  const [autoBackup, setAutoBackup] = useState(true);
  const [password, setPassword] = useState("");

  const toggleAutoBackup = () => {
    setAutoBackup(!autoBackup);
    alert(`Backup automatico ${!autoBackup ? "abilitato" : "disabilitato"}`);
  };

  const handlePasswordChange = () => {
    if (password) {
      alert("Password aggiornata con successo!");
      setPassword("");
    } else {
      alert("Inserisci una nuova password.");
    }
  };

  const downloadBackup = (id) => {
    alert(`Download del backup con ID: ${id}`);
  };

  const restoreBackup = (id) => {
    alert(`Ripristino del backup con ID: ${id}`);
  };

  const addBackup = () => {
    const newBackup = {
      id: Date.now(),
      date: new Date().toISOString().split("T")[0],
      size: "12MB",
    };
    setBackups((prevBackups) => [...prevBackups, newBackup]);
    alert("Backup aggiunto con successo!");
  };

  return (
    <div className="backup-security">
      <h2 className="section-title">Gestione Backup e Sicurezza</h2>
      <p className="section-description">
        Configura i backup automatici e proteggi i tuoi dati con le impostazioni
        di sicurezza.
      </p>

      {/* Backup Automatico */}
      <div className="backup-section">
        <h3>Backup Automatico</h3>
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={autoBackup}
            onChange={toggleAutoBackup}
          />
          {autoBackup ? "Abilitato" : "Disabilitato"}
        </label>
        <button className="add-backup-button" onClick={addBackup}>
          Crea Backup Manuale
        </button>
      </div>

      {/* Elenco Backup */}
      <div className="backup-list">
        <h3>Elenco Backup Disponibili</h3>
        {backups.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Dimensione</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((backup) => (
                <tr key={backup.id}>
                  <td>{backup.date}</td>
                  <td>{backup.size}</td>
                  <td>
                    <button
                      className="download-button"
                      onClick={() => downloadBackup(backup.id)}
                    >
                      Scarica
                    </button>
                    <button
                      className="restore-button"
                      onClick={() => restoreBackup(backup.id)}
                    >
                      Ripristina
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Nessun backup disponibile.</p>
        )}
      </div>

      {/* Sicurezza */}
      <div className="security-section">
        <h3>Impostazioni di Sicurezza</h3>
        <label>
          Nuova Password:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Inserisci la nuova password"
          />
        </label>
        <button className="save-password-button" onClick={handlePasswordChange}>
          Aggiorna Password
        </button>
      </div>
    </div>
  );
};

export default BackupSecurity;
