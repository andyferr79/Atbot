// StructureSettings.js - Configurazioni della Struttura
import React, { useState, useEffect, useCallback } from "react";
import api from "../../services/api";
import "../../../styles/StructureSettings.css";

const StructureSettings = () => {
  const [structure, setStructure] = useState({});
  const [logoPreview, setLogoPreview] = useState(null);
  const userId = localStorage.getItem("user_id");

  const fetchStructure = useCallback(async () => {
    try {
      const res = await api.get(`/structure/settings?uid=${userId}`);
      setStructure(res.data || {});
      setLogoPreview(res.data?.logo || null);
    } catch (err) {
      console.warn("⚠️ Nessuna configurazione trovata.");
    }
  }, [userId]);

  useEffect(() => {
    fetchStructure();
  }, [fetchStructure]);

  const handleLogoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="structure-settings">
      <h2 className="section-title">Configurazioni della Struttura</h2>
      <p className="section-description">
        Configura le informazioni principali della tua struttura.
      </p>

      <div className="structure-section">
        <label className="structure-label">
          Nome struttura:
          <input
            type="text"
            value={structure.name || ""}
            placeholder="Inserisci il nome della struttura"
            className="structure-input"
            onChange={(e) =>
              setStructure({ ...structure, name: e.target.value })
            }
          />
        </label>
      </div>

      <div className="structure-section">
        <label className="structure-label">
          Indirizzo:
          <input
            type="text"
            value={structure.address || ""}
            placeholder="Inserisci l'indirizzo"
            className="structure-input"
            onChange={(e) =>
              setStructure({ ...structure, address: e.target.value })
            }
          />
        </label>
      </div>

      <div className="structure-section">
        <label className="structure-label">
          Numero massimo di camere:
          <input
            type="number"
            min="1"
            value={structure.maxRooms || ""}
            placeholder="Inserisci il numero"
            className="structure-input"
            onChange={(e) =>
              setStructure({ ...structure, maxRooms: e.target.value })
            }
          />
        </label>
      </div>

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

      <div className="structure-section">
        <label className="structure-label">
          Descrizione breve:
          <textarea
            value={structure.description || ""}
            placeholder="Inserisci una descrizione breve della struttura (max 250 caratteri)"
            className="structure-textarea"
            onChange={(e) =>
              setStructure({ ...structure, description: e.target.value })
            }
          ></textarea>
        </label>
      </div>

      <div className="structure-section">
        <label className="structure-label">
          Tipo di struttura:
          <select
            className="structure-select"
            value={structure.type || ""}
            onChange={(e) =>
              setStructure({ ...structure, type: e.target.value })
            }
          >
            <option value="">Seleziona un tipo</option>
            <option value="hotel">Hotel</option>
            <option value="b&b">B&B</option>
            <option value="agriturismo">Agriturismo</option>
            <option value="resort">Resort</option>
          </select>
        </label>
      </div>

      <div className="structure-section">
        <label className="structure-label">Servizi offerti:</label>
        <div className="structure-checkbox-group">
          {[
            "Wi-Fi",
            "Piscina",
            "Parcheggio",
            "Ristorante",
            "Animali ammessi",
            "Spa",
          ].map((service) => (
            <label key={service}>
              <input
                type="checkbox"
                checked={structure.services?.includes(service) || false}
                onChange={(e) => {
                  const newServices = structure.services || [];
                  if (e.target.checked) {
                    setStructure({
                      ...structure,
                      services: [...newServices, service],
                    });
                  } else {
                    setStructure({
                      ...structure,
                      services: newServices.filter((s) => s !== service),
                    });
                  }
                }}
              />
              {service}
            </label>
          ))}
        </div>
      </div>

      <div className="structure-section">
        <label className="structure-label">
          Orario Check-in:
          <input
            type="time"
            value={structure.checkIn || ""}
            className="structure-input"
            onChange={(e) =>
              setStructure({ ...structure, checkIn: e.target.value })
            }
          />
        </label>
        <label className="structure-label">
          Orario Check-out:
          <input
            type="time"
            value={structure.checkOut || ""}
            className="structure-input"
            onChange={(e) =>
              setStructure({ ...structure, checkOut: e.target.value })
            }
          />
        </label>
        <label className="structure-label">
          Politica di cancellazione:
          <textarea
            value={structure.cancellationPolicy || ""}
            placeholder="Descrivi la politica di cancellazione"
            className="structure-textarea"
            onChange={(e) =>
              setStructure({ ...structure, cancellationPolicy: e.target.value })
            }
          ></textarea>
        </label>
      </div>

      <div className="structure-section">
        <label className="structure-label">
          Latitudine:
          <input
            type="text"
            value={structure.latitude || ""}
            placeholder="Inserisci la latitudine"
            className="structure-input"
            onChange={(e) =>
              setStructure({ ...structure, latitude: e.target.value })
            }
          />
        </label>
        <label className="structure-label">
          Longitudine:
          <input
            type="text"
            value={structure.longitude || ""}
            placeholder="Inserisci la longitudine"
            className="structure-input"
            onChange={(e) =>
              setStructure({ ...structure, longitude: e.target.value })
            }
          />
        </label>
      </div>

      <div className="structure-section">
        <label className="structure-label">
          Colore tematico personalizzato:
          <input
            type="color"
            value={structure.themeColor || "#000000"}
            className="structure-color-picker"
            onChange={(e) =>
              setStructure({ ...structure, themeColor: e.target.value })
            }
          />
        </label>
      </div>

      <div className="structure-buttons">
        <button className="save-button">Salva</button>
        <button className="cancel-button">Annulla</button>
      </div>
    </div>
  );
};

export default StructureSettings;
