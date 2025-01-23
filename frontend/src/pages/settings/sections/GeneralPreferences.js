// GeneralPreferences.js - Preferenze Generali
import React from "react";
import "../../../styles/GeneralPreferences.css";
// Stile specifico

const GeneralPreferences = () => {
  return (
    <div className="general-preferences">
      <h2 className="section-title">Preferenze Generali</h2>
      <p className="section-description">
        Configura le tue preferenze generali per personalizzare l'esperienza.
      </p>

      <div className="preferences-section">
        <label className="preferences-label">
          Lingua:
          <select className="preferences-select">
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
          <select className="preferences-select">
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
          <select className="preferences-select">
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
        <button className="save-button">Salva</button>
        <button className="cancel-button">Annulla</button>
      </div>
    </div>
  );
};

export default GeneralPreferences;
