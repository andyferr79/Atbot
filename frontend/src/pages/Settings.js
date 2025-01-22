// Settings.js - Pagina Impostazioni
import React, { useState } from "react";
import "../styles/Settings.css";

const settingsSections = [
  {
    id: "general-preferences",
    title: "Preferenze Generali",
    description: "Lingua, fuso orario e valuta preferita.",
    icon: "🌐",
    content: (
      <div>
        <label>
          Lingua:
          <select>
            <option value="it">Italiano</option>
            <option value="en">Inglese</option>
          </select>
        </label>
        <label>
          Fuso orario:
          <select>
            <option value="CET">CET</option>
            <option value="UTC">UTC</option>
          </select>
        </label>
        <label>
          Valuta preferita:
          <select>
            <option value="EUR">Euro (€)</option>
            <option value="USD">Dollaro ($)</option>
          </select>
        </label>
      </div>
    ),
  },
  {
    id: "notifications",
    title: "Notifiche",
    description: "Configurazione notifiche email e push.",
    icon: "🔔",
    content: (
      <div>
        <label>
          <input type="checkbox" /> Notifiche email
        </label>
        <label>
          <input type="checkbox" /> Notifiche push
        </label>
        <label>
          Aggiungi destinatario:
          <input type="email" placeholder="example@email.com" />
        </label>
      </div>
    ),
  },
  {
    id: "structure-settings",
    title: "Configurazioni della Struttura",
    description: "Informazioni della struttura e categorie di camere.",
    icon: "🏨",
    content: (
      <div>
        <label>
          Nome struttura:
          <input type="text" placeholder="Inserisci il nome della struttura" />
        </label>
        <label>
          Indirizzo:
          <input type="text" placeholder="Inserisci l'indirizzo" />
        </label>
        <label>
          Numero massimo di camere:
          <input type="number" min="1" placeholder="Inserisci il numero" />
        </label>
      </div>
    ),
  },
  {
    id: "users-permissions",
    title: "Utenti e Permessi",
    description: "Gestione collaboratori e cronologia accessi.",
    icon: "👥",
    content: (
      <div>
        <label>
          Aggiungi collaboratore:
          <input type="text" placeholder="Nome collaboratore" />
        </label>
        <button>Aggiungi</button>
        <p>Visualizza la cronologia accessi dei collaboratori.</p>
      </div>
    ),
  },
  {
    id: "integrations",
    title: "Integrazioni",
    description: "Collegamento a social media e canali di distribuzione.",
    icon: "🔗",
    content: (
      <div>
        <label>
          Collega account social:
          <input type="text" placeholder="Inserisci il link del profilo" />
        </label>
        <label>
          Collega canale di distribuzione:
          <input type="text" placeholder="Inserisci il nome del canale" />
        </label>
      </div>
    ),
  },
  {
    id: "backup-security",
    title: "Backup e Sicurezza",
    description: "Backup automatici e gestione password.",
    icon: "🔒",
    content: (
      <div>
        <label>
          Backup automatico:
          <input type="checkbox" /> Attiva
        </label>
        <label>
          Cambia password:
          <input type="password" placeholder="Nuova password" />
        </label>
      </div>
    ),
  },
  {
    id: "subscription",
    title: "Abbonamento",
    description: "Dettagli del piano e gestione pagamenti.",
    icon: "💳",
    content: (
      <div>
        <p>Piano attuale: StayPro Plus</p>
        <button>Gestisci Pagamento</button>
        <button>Modifica Piano</button>
      </div>
    ),
  },
  {
    id: "privacy-gdpr",
    title: "Privacy e GDPR",
    description: "Gestione dei dati e conformità GDPR.",
    icon: "📜",
    content: (
      <div>
        <p>Esporta i tuoi dati personali:</p>
        <button>Esporta</button>
        <p>Cancella i tuoi dati personali:</p>
        <button>Cancella</button>
      </div>
    ),
  },
];

const Settings = () => {
  const [activeSection, setActiveSection] = useState(null);

  const handleOpenSection = (sectionId) => {
    setActiveSection(sectionId);
  };

  const handleCloseSection = () => {
    setActiveSection(null);
  };

  return (
    <div className="settings-page">
      <h1 className="settings-title">Impostazioni</h1>

      {activeSection ? (
        <div className="settings-detail">
          <button className="back-button" onClick={handleCloseSection}>
            ⬅ Torna Indietro
          </button>
          <h2>
            {settingsSections.find((section) => section.id === activeSection)?.title}
          </h2>
          <div className="settings-content">
            {
              settingsSections.find((section) => section.id === activeSection)?.content
            }
          </div>
        </div>
      ) : (
        <div className="settings-container">
          {settingsSections.map((section) => (
            <div
              key={section.id}
              className="settings-card"
              onClick={() => handleOpenSection(section.id)}
            >
              <div className="settings-icon">{section.icon}</div>
              <h2 className="settings-card-title">{section.title}</h2>
              <p className="settings-card-description">{section.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Settings;
