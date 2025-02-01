// GeneralReport.js - Automazione Generazione Report
import React, { useState, useEffect, useRef, useCallback } from "react";
import Chart from "chart.js/auto"; // Libreria per grafici
import "../../../styles/GeneralReport.css";

import {
  getReportSettings,
  updateReportSettings,
  generateReportNow,
  getDashboardMetrics,
} from "../../../services/reportsApi";

const GeneralReport = () => {
  const [settings, setSettings] = useState({
    enabled: false,
    frequency: "daily",
    sendVia: "email",
    recipients: "",
  });

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    occupancyRate: 0,
    activeBookings: 0,
    totalRevenue: 0,
    averageStay: 0,
    cancellations: 0,
    revenueTrends: [],
    occupancyTrends: [],
  });

  const revenueChartRef = useRef(null);
  const occupancyChartRef = useRef(null);

  // Carica impostazioni e metriche all'avvio
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await getReportSettings();
        setSettings(response.data);
      } catch (error) {
        console.error(
          "Errore nel recupero delle impostazioni del report",
          error
        );
      }
    };

    const fetchMetrics = async () => {
      try {
        const response = await getDashboardMetrics();
        setDashboardData(response.data);
      } catch (error) {
        console.error("Errore nel recupero dei dati di dashboard", error);
      }
    };

    fetchSettings();
    fetchMetrics();
  }, []);

  // Funzione per creare i grafici
  const renderCharts = useCallback(() => {
    if (revenueChartRef.current !== null) {
      revenueChartRef.current.destroy();
    }
    if (occupancyChartRef.current !== null) {
      occupancyChartRef.current.destroy();
    }

    const ctx1 = document.getElementById("revenueChart").getContext("2d");
    const ctx2 = document.getElementById("occupancyChart").getContext("2d");

    revenueChartRef.current = new Chart(ctx1, {
      type: "line",
      data: {
        labels: dashboardData.revenueTrends.map((d) => d.date),
        datasets: [
          {
            label: "Entrate (€)",
            data: dashboardData.revenueTrends.map((d) => d.value),
            borderColor: "blue",
            backgroundColor: "rgba(0, 0, 255, 0.2)",
            fill: true,
          },
        ],
      },
    });

    occupancyChartRef.current = new Chart(ctx2, {
      type: "bar",
      data: {
        labels: dashboardData.occupancyTrends.map((d) => d.date),
        datasets: [
          {
            label: "Occupazione (%)",
            data: dashboardData.occupancyTrends.map((d) => d.value),
            backgroundColor: "green",
          },
        ],
      },
    });
  }, [dashboardData]);

  // Avvia i grafici quando i dati cambiano
  useEffect(() => {
    if (dashboardData.revenueTrends.length > 0) {
      renderCharts();
    }
  }, [dashboardData, renderCharts]);

  // Gestione delle impostazioni del report
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSaveSettings = async () => {
    try {
      await updateReportSettings(settings);
      alert("Impostazioni salvate con successo!");
    } catch (error) {
      console.error("Errore nel salvataggio delle impostazioni", error);
      alert("Errore nel salvataggio delle impostazioni");
    }
  };

  const handleGenerateNow = async () => {
    setLoading(true);
    try {
      const response = await generateReportNow();
      setHistory((prev) => [response.data, ...prev]);
      alert("Report generato con successo!");
    } catch (error) {
      console.error("Errore nella generazione del report", error);
      alert("Errore nella generazione del report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="general-report">
      <h2>Automazione Generazione Report</h2>

      {/* 📊 DASHBOARD */}
      <div className="dashboard">
        <h3>Panoramica Generale</h3>
        <ul>
          <li>Tasso di occupazione: {dashboardData.occupancyRate}%</li>
          <li>Prenotazioni attive: {dashboardData.activeBookings}</li>
          <li>Entrate totali: €{dashboardData.totalRevenue}</li>
          <li>Permanenza media: {dashboardData.averageStay} giorni</li>
          <li>Cancellazioni: {dashboardData.cancellations}%</li>
        </ul>

        {/* 📈 Grafici */}
        <div className="charts-container">
          <canvas id="revenueChart"></canvas>
          <canvas id="occupancyChart"></canvas>
        </div>
      </div>

      {/* ⚙️ AUTOMAZIONE REPORT */}
      <label>
        <input
          type="checkbox"
          name="enabled"
          checked={settings.enabled}
          onChange={handleChange}
        />
        Abilita generazione automatica
      </label>

      <label>
        Frequenza:
        <select
          name="frequency"
          value={settings.frequency}
          onChange={handleChange}
        >
          <option value="daily">Giornaliera</option>
          <option value="weekly">Settimanale</option>
          <option value="monthly">Mensile</option>
        </select>
      </label>

      <label>
        Modalità di invio:
        <select name="sendVia" value={settings.sendVia} onChange={handleChange}>
          <option value="email">Email</option>
          <option value="sms">SMS</option>
          <option value="cloud">Cloud Storage</option>
        </select>
      </label>

      <label>
        Destinatari:
        <input
          type="text"
          name="recipients"
          value={settings.recipients}
          onChange={handleChange}
          placeholder="Inserisci email o numero di telefono"
        />
      </label>

      <button onClick={handleSaveSettings}>Salva Impostazioni</button>
      <button onClick={handleGenerateNow} disabled={loading}>
        {loading ? "Generazione..." : "Genera Ora"}
      </button>

      {/* 📄 STORICO REPORT */}
      <h3>Storico Report</h3>
      <ul>
        {history.length > 0 ? (
          history.map((report, index) => (
            <li key={index}>
              {report.date} - {report.status}
            </li>
          ))
        ) : (
          <p>Nessun report generato.</p>
        )}
      </ul>
    </div>
  );
};

export default GeneralReport;
