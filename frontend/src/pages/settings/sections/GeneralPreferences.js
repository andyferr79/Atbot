// GeneralPreferences.js - Preferenze Generali con salvataggio backend
import React, { useState, useEffect } from "react";
import api from "../../services/api";
import "../../../styles/GeneralPreferences.css";

const GeneralPreferences = () => {
  const [language, setLanguage] = useState("it");
  const [timezone, setTimezone] = useState("CET");
  const [currency, setCurrency] = useState("EUR");
  const [loading, setLoading] = useState(false);
  const userId = localStorage.getItem("user_id");

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const res = await api.get(`/getPreferences?uid=${userId}`);
        const { language, timezone, currency } = res.data;
        if (language) setLanguage(language);
        if (timezone) setTimezone(timezone);
        if (currency) setCurrency(currency);
      } catch (err) {
        console.error("Errore nel caricamento delle preferenze:", err);
      }
    };
    if (userId) fetchPreferences();
  }, [userId]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put("/updatePreferences", {
        uid: userId,
        language,
        timezone,
        currency,
      });
      alert("✅ Preferenze aggiornate con successo");
    } catch (err) {
      alert("❌ Errore durante il salvataggio delle preferenze");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    window.location.reload();
  };

  return (
    <div className="general-preferences">
      <h2 className="section-title">Preferenze Generali</h2>
      <p className="section-description">
        Configura le tue preferenze generali per personalizzare l'esperienza.
      </p>

      <div className="preferences-section">
        <label className="preferences-label">
          Lingua:
          <select
            className="preferences-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="it">Italiano</option>
            <option value="en">Inglese</option>
            <option value="es">Spagnolo</option>
            <option value="de">Tedesco</option>
            <option value="fr">Francese</option>
            <option value="ar">Arabo</option>
            <option value="pt">Portoghese</option>
          </select>
        </label>
      </div>

      <div className="preferences-section">
        <label className="preferences-label">
          Fuso orario:
          <select
            className="preferences-select"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
          >
            <option value="CET">CET (Central European Time)</option>
            <option value="UTC">UTC (Coordinated Universal Time)</option>
            <option value="PST">PST (Pacific Standard Time)</option>
            <option value="EST">EST (Eastern Standard Time)</option>
            <option value="IST">IST (India Standard Time)</option>
            <option value="GMT">GMT (Greenwich Mean Time)</option>
            <option value="AEDT">
              AEDT (Australian Eastern Daylight Time)
            </option>
          </select>
        </label>
      </div>

      <div className="preferences-section">
        <label className="preferences-label">
          Valuta preferita:
          <select
            className="preferences-select"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            <option value="EUR">Euro (€)</option>
            <option value="USD">Dollaro ($)</option>
            <option value="GBP">Sterlina (£)</option>
            <option value="AED">Dirham (AED)</option>
            <option value="BRL">Real Brasiliano (R$)</option>
            <option value="INR">Rupia Indiana (₹)</option>
            <option value="JPY">Yen Giapponese (¥)</option>
            <option value="AUD">Dollaro Australiano (A$)</option>
            <option value="CAD">Dollaro Canadese (C$)</option>
            <option value="CHF">Franco Svizzero (CHF)</option>
            <option value="CNY">Yuan Cinese (¥)</option>
            <option value="SAR">Riyal Saudita (SAR)</option>
            <option value="ZAR">Rand Sudafricano (R)</option>
            <option value="SEK">Corona Svedese (kr)</option>
            <option value="NOK">Corona Norvegese (kr)</option>
          </select>
        </label>
      </div>

      <div className="preferences-buttons">
        <button className="save-button" onClick={handleSave} disabled={loading}>
          Salva
        </button>
        <button className="cancel-button" onClick={handleCancel}>
          Annulla
        </button>
      </div>
    </div>
  );
};

export default GeneralPreferences;
