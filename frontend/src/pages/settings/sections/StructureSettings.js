// StructureSettings.js - Configurazioni della Struttura
import React, { useState } from "react";
import "../../../styles/StructureSettings.css"; // Stile specifico

const StructureSettings = () => {
  const [logoPreview, setLogoPreview] = useState(null);

  const handleLogoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="structure-settings">
      <h2 className="section-title">Configurazioni della Struttura</h2>
      <p className="section-description">
        Configura le informazioni principali della tua struttura.
      </p>

      {/* Nome della struttura */}
      <div className="structure-section">
        <label className="structure-label">
          Nome struttura:
          <input
            type="text"
            placeholder="Inserisci il nome della struttura"
            className="structure-input"
          />
        </label>
      </div>

      {/* Indirizzo */}
      <div className="structure-section">
        <label className="structure-label">
          Indirizzo:
          <input
            type="text"
            placeholder="Inserisci l'indirizzo"
            className="structure-input"
          />
        </label>
      </div>

      {/* Numero massimo di camere */}
      <div className="structure-section">
        <label className="structure-label">
          Numero massimo di camere:
          <input
            type="number"
            min="1"
            placeholder="Inserisci il numero"
            className="structure-input"
          />
        </label>
      </div>

      {/* Caricamento Logo */}
      <div className="structure-section">
        <label className="structure-label">
          Carica il logo della struttura:
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            className="structure-input"
          />
        </label>
        {logoPreview && (
          <img
            src={logoPreview}
            alt="Anteprima Logo"
            className="logo-preview"
          />
        )}
      </div>

      {/* Descrizione Breve */}
      <div className="structure-section">
        <label className="structure-label">
          Descrizione breve:
          <textarea
            placeholder="Inserisci una descrizione breve della struttura (max 250 caratteri)"
            className="structure-textarea"
          ></textarea>
        </label>
      </div>

      {/* Tipo di Struttura */}
      <div className="structure-section">
        <label className="structure-label">
          Tipo di struttura:
          <select className="structure-select">
            <option value="hotel">Hotel</option>
            <option value="b&b">B&B</option>
            <option value="agriturismo">Agriturismo</option>
            <option value="resort">Resort</option>
          </select>
        </label>
      </div>

      {/* Servizi Offerti */}
      <div className="structure-section">
        <label className="structure-label">Servizi offerti:</label>
        <div className="structure-checkbox-group">
          <label>
            <input type="checkbox" /> Wi-Fi
          </label>
          <label>
            <input type="checkbox" /> Piscina
          </label>
          <label>
            <input type="checkbox" /> Parcheggio
          </label>
          <label>
            <input type="checkbox" /> Ristorante
          </label>
          <label>
            <input type="checkbox" /> Animali ammessi
          </label>
          <label>
            <input type="checkbox" /> Spa
          </label>
        </div>
      </div>

      {/* Politiche della Struttura */}
      <div className="structure-section">
        <label className="structure-label">
          Orario Check-in:
          <input type="time" className="structure-input" />
        </label>
        <label className="structure-label">
          Orario Check-out:
          <input type="time" className="structure-input" />
        </label>
        <label className="structure-label">
          Politica di cancellazione:
          <textarea
            placeholder="Descrivi la politica di cancellazione"
            className="structure-textarea"
          ></textarea>
        </label>
      </div>

      {/* Posizione GPS */}
      <div className="structure-section">
        <label className="structure-label">
          Latitudine:
          <input
            type="text"
            placeholder="Inserisci la latitudine"
            className="structure-input"
          />
        </label>
        <label className="structure-label">
          Longitudine:
          <input
            type="text"
            placeholder="Inserisci la longitudine"
            className="structure-input"
          />
        </label>
      </div>

      {/* Colore Tematico */}
      <div className="structure-section">
        <label className="structure-label">
          Colore tematico personalizzato:
          <input type="color" className="structure-color-picker" />
        </label>
      </div>

      {/* Bottoni */}
      <div className="structure-buttons">
        <button className="save-button">Salva</button>
        <button className="cancel-button">Annulla</button>
      </div>
    </div>
  );
};

export default StructureSettings;
