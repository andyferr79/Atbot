// ✅ Integrations.js - Gestione Integrazioni con salvataggio Firestore
import React, { useState, useEffect, useCallback } from "react";

import {
  getIntegrations,
  addIntegration,
  removeIntegration,
} from "../../services/api"; // ✅ PATH CORRETTO

import "../../styles/Integrations.css";

const Integrations = () => {
  const [integrations, setIntegrations] = useState([]);
  const [newIntegration, setNewIntegration] = useState({
    platform: "",
    apiKey: "",
    additionalInfo: "",
  });

  const userId = localStorage.getItem("user_id");

  const availablePlatforms = [
    { name: "Facebook", type: "social" },
    { name: "Instagram", type: "social" },
    { name: "LinkedIn", type: "social" },
    { name: "Twitter", type: "social" },
    { name: "TikTok", type: "social" },
    { name: "Booking.com", type: "distribution" },
    { name: "Airbnb", type: "distribution" },
    { name: "Expedia", type: "distribution" },
    { name: "Agoda", type: "distribution" },
    { name: "TripAdvisor", type: "distribution" },
    { name: "Salesforce", type: "crm" },
    { name: "HubSpot", type: "crm" },
    { name: "QuickBooks", type: "accounting" },
    { name: "Xero", type: "accounting" },
  ];

  const fetchIntegrations = useCallback(async () => {
    try {
      const data = await getIntegrations(userId);
      setIntegrations(data);
    } catch (err) {
      console.error("❌ Errore nel caricamento delle integrazioni:", err);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) fetchIntegrations();
  }, [userId, fetchIntegrations]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewIntegration((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddIntegration = async () => {
    if (!newIntegration.platform || !newIntegration.apiKey) {
      alert("❌ Compila tutti i campi richiesti.");
      return;
    }

    try {
      const integrationWithUid = { ...newIntegration, uid: userId };
      const added = await addIntegration(integrationWithUid);
      setIntegrations((prev) => [...prev, added]);
      setNewIntegration({ platform: "", apiKey: "", additionalInfo: "" });
      alert("✅ Integrazione aggiunta con successo!");
    } catch (err) {
      alert("❌ Errore durante l'aggiunta dell'integrazione.");
    }
  };

  const handleRemoveIntegration = async (id) => {
    try {
      await removeIntegration(id, userId);
      setIntegrations((prev) => prev.filter((i) => i.id !== id));
      alert("✅ Integrazione rimossa con successo!");
    } catch (err) {
      alert("❌ Errore durante la rimozione.");
    }
  };

  return (
    <div className="integrations">
      <h2 className="section-title">Gestione Integrazioni</h2>
      <p className="section-description">
        Collega StayPro a social media, canali di distribuzione e strumenti di
        terze parti.
      </p>

      {/* 🔧 Aggiungi Nuova Integrazione */}
      <div className="add-integration-section">
        <h3>Aggiungi Nuova Integrazione</h3>
        <label>
          Piattaforma:
          <select
            name="platform"
            value={newIntegration.platform}
            onChange={handleInputChange}
          >
            <option value="">Seleziona una piattaforma</option>
            {availablePlatforms.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name} ({p.type})
              </option>
            ))}
          </select>
        </label>

        <label>
          API Key:
          <input
            type="text"
            name="apiKey"
            value={newIntegration.apiKey}
            onChange={handleInputChange}
            placeholder="Inserisci la chiave API"
          />
        </label>

        <label>
          Informazioni aggiuntive:
          <textarea
            name="additionalInfo"
            value={newIntegration.additionalInfo}
            onChange={handleInputChange}
            placeholder="Inserisci informazioni aggiuntive se necessarie"
          />
        </label>

        <button className="add-button" onClick={handleAddIntegration}>
          ➕ Aggiungi Integrazione
        </button>
      </div>

      {/* 📋 Elenco Integrazioni Attive */}
      <div className="integrations-list">
        <h3>Integrazioni Attive</h3>
        {integrations.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Piattaforma</th>
                <th>API Key</th>
                <th>Info Aggiuntive</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {integrations.map((integration) => (
                <tr key={integration.id}>
                  <td>{integration.platform}</td>
                  <td>{integration.apiKey}</td>
                  <td>{integration.additionalInfo}</td>
                  <td>
                    <button
                      className="remove-button"
                      onClick={() => handleRemoveIntegration(integration.id)}
                    >
                      🗑️ Rimuovi
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Nessuna integrazione configurata.</p>
        )}
      </div>
    </div>
  );
};

export default Integrations;
