// 📊 FinancialReport.js - Report Finanziari con Importazione & Grafici Ottimizzati
import React, { useState, useEffect, useRef, useCallback } from "react";
import Chart from "chart.js/auto";
import "../../../styles/FinancialReport.css";
import {
  getFinancialReportData,
  exportFinancialReport,
} from "../../../services/reports/financialReportApi";

const FinancialReport = () => {
  const [financeData, setFinanceData] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    revenueTrends: [],
  });

  const revenueChartRef = useRef(null);
  let revenueChartInstance = useRef(null); // 🔥 Memorizza l'istanza del grafico

  // ✅ Fetch dei dati finanziari
  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        const response = await getFinancialReportData();
        setFinanceData(response.data);
      } catch (error) {
        console.error("❌ Errore nel recupero dei dati finanziari:", error);
      }
    };

    fetchFinancialData();
  }, []);

  // ✅ Creazione grafico con `useCallback`
  const renderCharts = useCallback(() => {
    if (financeData.revenueTrends.length > 0 && revenueChartRef.current) {
      if (revenueChartInstance.current) {
        revenueChartInstance.current.destroy(); // ✅ Rimuove il vecchio grafico prima di ricrearlo
      }

      revenueChartInstance.current = new Chart(revenueChartRef.current, {
        type: "bar",
        data: {
          labels: financeData.revenueTrends.map((d) => d.date),
          datasets: [
            {
              label: "Entrate (€)",
              data: financeData.revenueTrends.map((d) => d.value),
              backgroundColor: "rgba(76, 175, 80, 0.5)", // Verde semi-trasparente
              borderColor: "#4CAF50",
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              labels: {
                color: "#2C3E50",
                font: {
                  size: 14,
                  weight: "bold",
                },
              },
            },
          },
          scales: {
            x: { ticks: { color: "#2C3E50" } },
            y: { ticks: { color: "#2C3E50" }, beginAtZero: true },
          },
        },
      });
    }
  }, [financeData]); // 🔥 Aggiunto `financeData` come dipendenza

  // ✅ Effettua il rendering del grafico quando cambiano i dati
  useEffect(() => {
    renderCharts();
  }, [financeData, renderCharts]);

  return (
    <div className="financial-report">
      <h2>📊 Report Finanziari</h2>

      {/* 📌 Panoramica Finanziaria */}
      <div className="financial-summary">
        <h3>📌 Panoramica</h3>
        <ul>
          <li>💰 Entrate: €{financeData.totalRevenue}</li>
          <li>💸 Uscite: €{financeData.totalExpenses}</li>
          <li>📈 Profitto Netto: €{financeData.netProfit}</li>
        </ul>
      </div>

      {/* 📈 Grafico Entrate */}
      <div className="charts-container">
        <canvas ref={revenueChartRef}></canvas>
      </div>

      {/* 📥 Esportazione */}
      <div className="export-options">
        <button onClick={() => exportFinancialReport("pdf")}>
          📄 Esporta PDF
        </button>
        <button onClick={() => exportFinancialReport("csv")}>
          📂 Esporta CSV
        </button>
      </div>
    </div>
  );
};

export default FinancialReport;
