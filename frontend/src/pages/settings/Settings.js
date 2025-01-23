// Settings.js - Pagina Impostazioni
import React, { useState } from "react";
import "../../styles/Settings.css";

// Importa le sezioni modulari
import GeneralPreferences from "./sections/GeneralPreferences";
import Notifications from "./sections/Notifications";
import StructureSettings from "./sections/StructureSettings";
import UsersPermissions from "./sections/UsersPermissions";
import Integrations from "./sections/Integrations";
import BackupSecurity from "./sections/BackupSecurity";
import Subscription from "./sections/Subscription";
import PrivacyGDPR from "./sections/PrivacyGDPR";

const settingsSections = [
  {
    id: "general-preferences",
    title: "Preferenze Generali",
    description: "Lingua, fuso orario e valuta preferita.",
    icon: "🌐",
    content: <GeneralPreferences />, // Componente modulare
  },
  {
    id: "notifications",
    title: "Notifiche",
    description: "Configurazione notifiche email e push.",
    icon: "🔔",
    content: <Notifications />, // Componente modulare
  },
  {
    id: "structure-settings",
    title: "Configurazioni della Struttura",
    description: "Informazioni della struttura e categorie di camere.",
    icon: "🏨",
    content: <StructureSettings />, // Componente modulare
  },
  {
    id: "users-permissions",
    title: "Utenti e Permessi",
    description: "Gestione collaboratori e cronologia accessi.",
    icon: "👥",
    content: <UsersPermissions />, // Componente modulare
  },
  {
    id: "integrations",
    title: "Integrazioni",
    description: "Collegamento a social media e canali di distribuzione.",
    icon: "🔗",
    content: <Integrations />, // Componente modulare
  },
  {
    id: "backup-security",
    title: "Backup e Sicurezza",
    description: "Backup automatici e gestione password.",
    icon: "🔒",
    content: <BackupSecurity />, // Componente modulare
  },
  {
    id: "subscription",
    title: "Abbonamento",
    description: "Dettagli del piano e gestione pagamenti.",
    icon: "💳",
    content: <Subscription />, // Componente modulare
  },
  {
    id: "privacy-gdpr",
    title: "Privacy e GDPR",
    description: "Gestione dei dati e conformità GDPR.",
    icon: "📜",
    content: <PrivacyGDPR />, // Componente modulare
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
            {
              settingsSections.find((section) => section.id === activeSection)
                ?.title
            }
          </h2>
          <div className="settings-content">
            {
              settingsSections.find((section) => section.id === activeSection)
                ?.content
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
