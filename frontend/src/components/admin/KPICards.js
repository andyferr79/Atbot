import React, { useEffect, useState } from "react";
import api from "../../services/api";
import "../../styles/AdminDashboard.css";

const KPICards = () => {
  const [revenue, setRevenue] = useState(null);
  const [activeUsers, setActiveUsers] = useState(null);
  const [churnRate, setChurnRate] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);

  useEffect(() => {
    fetchKPI();
  }, []);

  const fetchKPI = async () => {
    try {
      const [revRes, usersRes, churnRes, statusRes] = await Promise.all([
        api.get("/getRevenueKPI"),
        api.get("/getActiveSubscriptions"),
        api.get("/getChurnRate"),
        api.get("/getSystemStatus"),
      ]);

      setRevenue(revRes.data.monthlyRevenue || 0);
      setActiveUsers(usersRes.data.activeSubscriptions || 0);
      setChurnRate(churnRes.data.churnedUsers || 0);
      setSystemStatus(statusRes.data || {});
    } catch (err) {
      console.error("❌ Errore caricamento KPI:", err);
    }
  };

  return (
    <div className="cards-row">
      <div className="card kpi-card">
        <h3>Entrate Mese</h3>
        <p className="kpi-value">
          € {revenue !== null ? revenue.toLocaleString() : "—"}
        </p>
        <span className="kpi-label">+15% rispetto al mese scorso</span>
      </div>

      <div className="card kpi-card">
        <h3>Utenti Attivi</h3>
        <p className="kpi-value">{activeUsers !== null ? activeUsers : "—"}</p>
        <span className="kpi-label">Gold/Base: prossimamente</span>
      </div>

      <div className="card kpi-card">
        <h3>Tasso Abbandono</h3>
        <p className="kpi-value">
          {churnRate !== null ? `${churnRate} utenti` : "—"}
        </p>
        <span className="kpi-label">↓ stabile</span>
      </div>

      <div className="card kpi-card">
        <h3>Stato Sistema</h3>
        <p
          className={`kpi-value ${
            systemStatus && systemStatus.status?.includes("✅")
              ? "success"
              : "danger"
          }`}
        >
          {systemStatus?.status || "—"}
        </p>
        <span className="kpi-label">
          Ultimo backup: {systemStatus?.lastBackup || "—"}
        </span>
      </div>
    </div>
  );
};

export default KPICards;
