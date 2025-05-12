import React from "react";
import AutomationsSettings from "./AutomationsSettings";
import "../../styles/AgentHub.css";

const SettingsTab = ({
  autonomyLevel,
  setAutonomyLevel,
  settings,
  setSettings,
  plan,
  userId,
}) => {
  return (
    <div className="settings-tab-container">
      {/* 🔧 Sezione Automazioni */}
      <section className="automations-settings-section">
        <h2 className="section-title">🤖 Automazioni Disponibili</h2>
        <p className="section-description">
          Attiva o disattiva le automazioni disponibili in base al tuo piano. Le
          automazioni attive permettono all’agente IA di operare in modo
          autonomo, come inviare messaggi automatici, generare report,
          ottimizzare i prezzi e altro.
        </p>
        <AutomationsSettings userId={userId} plan={plan} />
      </section>

      {/* ⚙️ Sezione livello di autonomia */}
      <section className="autonomy-level-section">
        <h2 className="section-title">🎚️ Livello di Autonomia</h2>
        <p className="section-description">
          Scegli il livello di libertà con cui l’agente IA può agire. I livelli
          più alti permettono all’agente di prendere decisioni senza conferma
          manuale.
        </p>
        <div className="autonomy-options">
          <label>
            <input
              type="radio"
              value="base"
              checked={autonomyLevel === "base"}
              onChange={(e) => setAutonomyLevel(e.target.value)}
            />
            Base – solo suggerimenti IA, senza azioni automatiche.
          </label>
          <label>
            <input
              type="radio"
              value="moderate"
              checked={autonomyLevel === "moderate"}
              onChange={(e) => setAutonomyLevel(e.target.value)}
            />
            Moderato – IA può agire solo su automazioni abilitate.
          </label>
          <label>
            <input
              type="radio"
              value="full"
              checked={autonomyLevel === "full"}
              onChange={(e) => setAutonomyLevel(e.target.value)}
            />
            Completo – IA autonoma su tutte le azioni disponibili.
          </label>
        </div>
      </section>
    </div>
  );
};

export default SettingsTab;
