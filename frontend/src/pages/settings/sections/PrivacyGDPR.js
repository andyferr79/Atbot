import React, { useEffect, useState, useCallback } from "react";
import api from "../../services/api";

import "../../../styles/PrivacyGDPR.css";

const PrivacyGDPR = () => {
  const userId = localStorage.getItem("user_id");

  const [consents, setConsents] = useState({
    emailMarketing: false,
    pushNotifications: false,
    analytics: false,
  });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🔁 Fetch consensi salvati
  const fetchConsents = useCallback(async () => {
    try {
      const res = await api.get(`/privacy/consents?uid=${userId}`);
      setConsents(res.data || {});
    } catch {
      console.warn("⚠️ Nessun consenso salvato.");
    }
  }, [userId]);

  // 🔁 Fetch richieste GDPR
  const fetchRequests = useCallback(async () => {
    try {
      const res = await api.get(`/privacy/requests?uid=${userId}`);
      setRequests(res.data || []);
    } catch {
      console.warn("⚠️ Nessuna richiesta trovata.");
    }
  }, [userId]);

  // 🚀 Al caricamento
  useEffect(() => {
    fetchConsents();
    fetchRequests();
  }, [fetchConsents, fetchRequests]);

  // 🔘 Toggle consenso
  const toggleConsent = async (type) => {
    const updated = { ...consents, [type]: !consents[type] };
    setConsents(updated);
    try {
      await api.post(`/privacy/consents`, { uid: userId, consents: updated });
    } catch {
      alert("❌ Errore nel salvataggio dei consensi.");
    }
  };

  // 📩 Richiesta GDPR
  const handleRequest = async (actionType) => {
    if (
      actionType === "Cancellazione Dati" &&
      !window.confirm(
        "Sei sicuro di voler richiedere la cancellazione dei tuoi dati? Questa azione è irreversibile."
      )
    )
      return;

    setLoading(true);
    try {
      await api.post(`/privacy/requests`, {
        uid: userId,
        type: actionType,
        date: new Date().toISOString(),
      });
      alert("✅ Richiesta inviata con successo.");
      fetchRequests();
    } catch {
      alert("❌ Errore durante l'invio della richiesta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="privacy-gdpr">
      <h2 className="section-title">Privacy e GDPR</h2>
      <p className="section-description">
        Gestisci i tuoi dati personali e le tue preferenze di privacy in
        conformità al GDPR.
      </p>

      {/* 🔐 Gestione Dati */}
      <div className="data-management">
        <h3>Gestione Dati</h3>
        <button
          className="export-button"
          onClick={() => handleRequest("Esportazione Dati")}
          disabled={loading}
        >
          Esporta Dati
        </button>
        <button
          className="delete-button"
          onClick={() => handleRequest("Cancellazione Dati")}
          disabled={loading}
        >
          Richiedi Cancellazione Dati
        </button>
      </div>

      {/* ✅ Consensi */}
      <div className="consents-section">
        <h3>Gestione Consensi</h3>
        {Object.entries(consents).map(([key, value]) => (
          <label key={key}>
            <input
              type="checkbox"
              checked={value}
              onChange={() => toggleConsent(key)}
            />
            {key === "emailMarketing" && "Consenti marketing via email"}
            {key === "pushNotifications" && "Consenti notifiche push"}
            {key === "analytics" &&
              "Consenti utilizzo dati anonimi per analisi"}
          </label>
        ))}
      </div>

      {/* 📜 Storico richieste */}
      <div className="requests-section">
        <h3>Storico Richieste</h3>
        {requests.length > 0 ? (
          <table className="requests-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Data</th>
                <th>Stato</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td>{r.type}</td>
                  <td>{new Date(r.date).toLocaleDateString()}</td>
                  <td>{r.status || "In attesa"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Nessuna richiesta GDPR effettuata.</p>
        )}
      </div>

      {/* 📄 Documentazione */}
      <div className="documentation-section">
        <h3>Documentazione GDPR</h3>
        <a href="/privacy-policy.pdf" target="_blank" className="doc-link">
          📄 Politica sulla Privacy
        </a>
        <a href="/terms-of-service.pdf" target="_blank" className="doc-link">
          📜 Termini di Servizio
        </a>
      </div>
    </div>
  );
};

export default PrivacyGDPR;
