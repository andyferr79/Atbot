import React, { useEffect, useState } from "react";

const AutomationsSettings = ({ userId, plan }) => {
  const [automations, setAutomations] = useState([]);

  useEffect(() => {
    if (!userId) return;

    fetch(`http://localhost:8000/agent/automations/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("📋 Automazioni caricate:", data.automations);
        setAutomations(data.automations || []);
      })
      .catch((err) => console.error("❌ Errore caricamento automazioni:", err));
  }, [userId]);

  const toggleAutomation = async (id, current) => {
    try {
      await fetch(`http://localhost:8000/agent/automations/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ automation_id: id, enabled: !current }),
      });

      setAutomations((prev) =>
        prev.map((auto) =>
          auto.id === id ? { ...auto, enabled: !current } : auto
        )
      );
    } catch (err) {
      console.error("❌ Errore toggle automazione:", err);
    }
  };

  return (
    <div
      style={{
        padding: "12px 0",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      {automations.map((auto) => (
        <div
          key={auto.id}
          style={{
            border: "1px solid #ccc",
            borderRadius: "10px",
            padding: "16px",
            background: "#fff",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <strong>{auto.title}</strong>
            <span>{auto.available_in.join(" / ").toUpperCase()}</span>
          </div>
          <p style={{ marginTop: "8px", fontSize: "14px", color: "#444" }}>
            {auto.description}
          </p>
          {auto.canToggle ? (
            <label style={{ marginTop: "10px", display: "inline-block" }}>
              <input
                type="checkbox"
                checked={auto.enabled}
                onChange={() => toggleAutomation(auto.id, auto.enabled)}
              />{" "}
              {auto.enabled ? "✅ Attiva" : "❌ Disattiva"}
            </label>
          ) : (
            <p
              style={{ color: "#999", fontStyle: "italic", marginTop: "10px" }}
            >
              🔒 Non disponibile nel tuo piano
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

export default AutomationsSettings;
