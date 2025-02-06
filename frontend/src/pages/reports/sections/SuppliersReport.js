// 🏭 SuppliersReport.js - Report Fornitori con Analisi e Grafici
import React, { useState, useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import "../../../styles/SuppliersReport.css";
import suppliersReportApi from "../../../services/reports/suppliersReportApi"; // ✅ Import corretto

const { getSuppliersReportData } = suppliersReportApi; // ✅ Funzione API

const SuppliersReport = () => {
  const [suppliersData, setSuppliersData] = useState({
    totalSuppliers: 0,
    activeContracts: 0,
    totalExpenses: 0,
    supplierTrends: [], // ✅ Assicuriamoci che supplierTrends sia sempre un array
    topSuppliers: [],
  });

  const chartRef = useRef(null);
  let chartInstance = useRef(null);

  // 📊 Recupero dati fornitori
  useEffect(() => {
    const fetchSuppliersData = async () => {
      try {
        const response = await getSuppliersReportData();

        // ✅ Assicuriamoci che supplierTrends sia sempre un array
        setSuppliersData({
          ...response,
          supplierTrends: response.supplierTrends || [],
        });
      } catch (error) {
        console.error("❌ Errore nel recupero dei dati fornitori:", error);
      }
    };
    fetchSuppliersData();
  }, []);

  // 🎨 Creazione del grafico fornitori
  useEffect(() => {
    if (suppliersData.supplierTrends.length > 0 && chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy(); // ✅ Evita sovrapposizioni
      }

      chartInstance.current = new Chart(chartRef.current, {
        type: "bar",
        data: {
          labels: suppliersData.supplierTrends.map((d) => d.date),
          datasets: [
            {
              label: "Spese Fornitori (€)",
              data: suppliersData.supplierTrends.map((d) => d.amount),
              backgroundColor: "rgba(255, 99, 132, 0.5)",
              borderColor: "#FF6384",
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          animation: { duration: 1200, easing: "easeInOutQuart" },
          plugins: {
            legend: {
              labels: { color: "#2C3E50", font: { size: 14, weight: "bold" } },
            },
          },
          scales: {
            x: { ticks: { color: "#2C3E50" } },
            y: { ticks: { color: "#2C3E50" }, beginAtZero: true },
          },
        },
      });
    }
  }, [suppliersData]);

  return (
    <div className="suppliers-report">
      <h2>🏭 Report Fornitori</h2>

      {/* 📌 Panoramica Fornitori */}
      <div className="dashboard">
        <h3>📌 Panoramica</h3>
        <ul>
          <li>📋 Totale Fornitori: {suppliersData.totalSuppliers}</li>
          <li>✅ Contratti Attivi: {suppliersData.activeContracts}</li>
          <li>💰 Totale Spese: €{suppliersData.totalExpenses}</li>
        </ul>

        {/* 📈 Grafico spese fornitori */}
        <div className="chart-container">
          {suppliersData.supplierTrends.length > 0 ? (
            <canvas ref={chartRef}></canvas>
          ) : (
            <p>📭 Nessun dato disponibile per i fornitori.</p>
          )}
        </div>
      </div>

      {/* 🏆 Fornitori Principali */}
      {suppliersData.topSuppliers.length > 0 && (
        <div className="top-suppliers">
          <h3>🏆 Fornitori con Maggiori Spese</h3>
          <ul>
            {suppliersData.topSuppliers.map((supplier) => (
              <li key={supplier.id}>
                {supplier.name} - €{supplier.totalSpent}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SuppliersReport;
