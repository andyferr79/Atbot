import React, { useEffect, useState } from "react";
import api from "../../services/api";
import "../../styles/AdminDashboard.css";

const AutomationsPanel = () => {
  const [automations, setAutomations] = useState([]);

  const fetchAutomations = async () => {
    try {
      const res = await api.get("/admin/automations");
      setAutomations(res.data);
    } catch (err) {
      console.error("Errore caricamento automazioni:", err);
    }
  };

  useEffect(() => {
    fetchAutomations();
  }, []);

  return (
    <div className="card automations-panel">
      <h3>Automazioni Attive</h3>
      {automations.length === 0 ? (
        <p>Nessuna automazione salvata.</p>
      ) : (
        <ul className="automation-list">
          {automations.map((a) => (
            <li key={a.id}>
              <strong>{a.name}</strong> → {a.trigger} ➜ {a.action}
              <span className={`badge ${a.active ? "success" : "muted"}`}>
                {a.active ? "Attiva" : "In Pausa"}
              </span>
            </li>
          ))}
        </ul>
      )}
      <button className="btn">+ Crea nuova automazione</button>
    </div>
  );
};

export default AutomationsPanel;
