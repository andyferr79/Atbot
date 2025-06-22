// 📂 E:/ATBot/frontend/src/pages/admin/AdminDashboard.js

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/AdminDashboard.css";

import KPICards from "../../components/admin/KPICards";
import AnnouncementsPanel from "../../components/admin/AnnouncementsPanel";
import ReportsPanel from "../../components/admin/ReportsPanel";
import AIUsagePanel from "../../components/admin/AIUsagePanel";
import AutomationsPanel from "../../components/admin/AutomationsPanel";
import BenchmarkStats from "../../components/admin/BenchmarkStats";
import UserTimelineModal from "../../components/admin/UserTimelineModal";
import LogsPanel from "../../components/admin/LogsPanel";
import AdminAlertPanel from "./AdminAlertPanel";
import GPTSpendChart from "../../components/admin/GPTSpendChart";
import { getUserInfo } from "../../../services/api";
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAdmin = async () => {
      try {
        const res = await getUserInfo(); // ✅ uso corretto della funzione
        console.log("🧪 Risposta getUserInfo:", res.data);
        if (res.data?.role !== "admin") {
          console.warn("⚠️ Accesso negato: non sei admin");
          navigate("/");
        } else {
          console.log("✅ Accesso admin confermato");
          setLoading(false);
        }
      } catch (err) {
        console.error("❌ Errore nel controllo ruolo:", err);
        navigate("/");
      }
    };

    verifyAdmin();
  }, [navigate]);

  if (loading)
    return (
      <p style={{ padding: "20px" }}>🔒 Verifica accesso alla dashboard...</p>
    );

  return (
    <div className="admin-dashboard-container">
      <h1 className="admin-title">Dashboard Amministratore StayPro</h1>

      <section className="dashboard-section">
        <AdminAlertPanel enableFilters={true} groupByType={true} />
      </section>

      <section className="dashboard-section">
        <h2>KPI in tempo reale</h2>
        <KPICards />
      </section>

      <section className="dashboard-section">
        <h2>Spesa GPT giornaliera</h2>
        <GPTSpendChart />
      </section>

      <section className="dashboard-section">
        <h2>Annunci ufficiali</h2>
        <AnnouncementsPanel />
      </section>

      <section className="dashboard-section">
        <h2>Report & Esportazioni</h2>
        <ReportsPanel />
      </section>

      <section className="dashboard-section">
        <h2>Analisi Performance Agente IA</h2>
        <AIUsagePanel />
      </section>

      <section className="dashboard-section">
        <h2>Automazioni Avanzate</h2>
        <AutomationsPanel />
      </section>

      <section className="dashboard-section">
        <h2>Statistiche Comparative & Benchmark</h2>
        <BenchmarkStats />
      </section>

      <section className="dashboard-section">
        <h2>Cronologia utenti</h2>
        <UserTimelineModal />
      </section>

      <section className="dashboard-section">
        <h2>Log amministrativi & Stato sistema</h2>
        <LogsPanel />
      </section>
    </div>
  );
};

export default AdminDashboard;
