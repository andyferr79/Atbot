// 📂 E:/ATBot/frontend/src/pages/admin/AdminAlertPanel.js

import React, { useEffect, useState } from "react";
import { getSystemAlerts as getAdminSystemAlerts } from "../../services/api";

import "./AdminAlertPanel.css";

const AdminAlertPanel = ({ enableFilters = true, groupByType = false }) => {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await getAdminSystemAlerts(); // 🔁 via API Express
        setAlerts(response.data || []);
      } catch (error) {
        console.error("❌ Errore nel recupero alert:", error);
      }
    };

    fetchAlerts();
  }, []);

  const filteredAlerts =
    filter === "all"
      ? alerts
      : alerts.filter((a) => a.type.toLowerCase() === filter);

  const grouped =
    groupByType && filteredAlerts.length
      ? filteredAlerts.reduce((acc, curr) => {
          acc[curr.type] = acc[curr.type] || [];
          acc[curr.type].push(curr);
          return acc;
        }, {})
      : null;

  return (
    <div className="admin-alert-panel">
      <h2>🛑 Allerta Sicurezza e Anomalie</h2>

      {enableFilters && (
        <div className="alert-filters">
          <button onClick={() => setFilter("all")}>Tutti</button>
          <button onClick={() => setFilter("error")}>Errori</button>
          <button onClick={() => setFilter("warning")}>Warning</button>
          <button onClick={() => setFilter("info")}>Info</button>
        </div>
      )}

      {groupByType && grouped
        ? Object.entries(grouped).map(([type, group]) => (
            <div key={type}>
              <h3>{type}</h3>
              {group.map((alert, idx) => (
                <div
                  key={idx}
                  className={`alert-box ${alert.type.toLowerCase()}`}
                >
                  <strong>{alert.type}</strong>: {alert.message}{" "}
                  <span className="timestamp">
                    {new Date(alert.timestamp._seconds * 1000).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ))
        : filteredAlerts.map((alert, idx) => (
            <div key={idx} className={`alert-box ${alert.type.toLowerCase()}`}>
              <strong>{alert.type}</strong>: {alert.message}{" "}
              <span className="timestamp">
                {new Date(alert.timestamp._seconds * 1000).toLocaleString()}
              </span>
            </div>
          ))}
    </div>
  );
};

export default AdminAlertPanel;
