// PrivacyGDPR.js - Gestione Privacy e GDPR
import React, { useState } from "react";
import "../../../styles/PrivacyGDPR.css";

const PrivacyGDPR = () => {
  const [consents, setConsents] = useState({
    emailMarketing: true,
    pushNotifications: false,
    analytics: true,
  });

  const [requests, setRequests] = useState([
    {
      id: 1,
      type: "Esportazione Dati",
      date: "2025-01-01",
      status: "Completata",
    },
    {
      id: 2,
      type: "Cancellazione Dati",
      date: "2025-01-15",
      status: "In attesa",
    },
  ]);

  const handleExportData = () => {
    alert("I tuoi dati personali sono stati esportati con successo.");
    setRequests((prev) => [
      ...prev,
      {
        id: Date.now(),
        type: "Esportazione Dati",
        date: new Date().toISOString().split("T")[0],
        status: "Completata",
      },
    ]);
  };

  const handleDeleteData = () => {
    const confirmDelete = window.confirm(
      "Sei sicuro di voler richiedere la cancellazione dei tuoi dati personali? Questa azione è irreversibile."
    );
    if (confirmDelete) {
      alert("La tua richiesta di cancellazione dati è stata inviata.");
      setRequests((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "Cancellazione Dati",
          date: new Date().toISOString().split("T")[0],
          status: "In attesa",
        },
      ]);
    }
  };

  const toggleConsent = (type) => {
    setConsents((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  return (
    <div className="privacy-gdpr">
      <h2 className="section-title">Privacy e GDPR</h2>
      <p className="section-description">
        Gestisci i tuoi dati personali e le tue preferenze di privacy in
        conformità al GDPR.
      </p>

      {/* Esportazione e Cancellazione Dati */}
      <div className="data-management">
        <h3>Gestione Dati</h3>
        <button className="export-button" onClick={handleExportData}>
          Esporta Dati
        </button>
        <button className="delete-button" onClick={handleDeleteData}>
          Richiedi Cancellazione Dati
        </button>
      </div>

      {/* Gestione Consensi */}
      <div className="consents-section">
        <h3>Gestione Consensi</h3>
        <label>
          <input
            type="checkbox"
            checked={consents.emailMarketing}
            onChange={() => toggleConsent("emailMarketing")}
          />
          Consenti marketing via email
        </label>
        <label>
          <input
            type="checkbox"
            checked={consents.pushNotifications}
            onChange={() => toggleConsent("pushNotifications")}
          />
          Consenti notifiche push
        </label>
        <label>
          <input
            type="checkbox"
            checked={consents.analytics}
            onChange={() => toggleConsent("analytics")}
          />
          Consenti utilizzo dati anonimi per analisi
        </label>
      </div>

      {/* Storico Richieste GDPR */}
      <div className="requests-section">
        <h3>Storico Richieste</h3>
        <table className="requests-table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Data</th>
              <th>Stato</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id}>
                <td>{request.type}</td>
                <td>{request.date}</td>
                <td>{request.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Documentazione GDPR */}
      <div className="documentation-section">
        <h3>Documentazione GDPR</h3>
        <a href="/privacy-policy.pdf" target="_blank" className="doc-link">
          Scarica la Politica sulla Privacy
        </a>
        <a href="/terms-of-service.pdf" target="_blank" className="doc-link">
          Scarica i Termini di Servizio
        </a>
      </div>
    </div>
  );
};

export default PrivacyGDPR;
