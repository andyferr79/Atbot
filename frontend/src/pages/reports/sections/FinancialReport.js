// 💰 FinancialReport.js - Report Finanziari con Opzioni di Importazione
import React, { useState, useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import "../../../styles/FinancialReport.css";
import {
  getFinancialReportData,
  exportFinancialReport,
  importFinancialData,
} from "../../../services/reports/financialReportApi";

const FinancialReport = () => {
  const [financeData, setFinanceData] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    revenueTrends: [],
    transactions: [],
  });

  const [importMethod, setImportMethod] = useState(null);
  const revenueChartRef = useRef(null);
  const expensesChartRef = useRef(null);

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        const response = await getFinancialReportData();
        setFinanceData(response.data);
      } catch (error) {
        console.error("Errore nel recupero dei dati finanziari:", error);
      }
    };

    fetchFinancialData();
  }, []);

  useEffect(() => {
    if (financeData.revenueTrends.length > 0) {
      renderCharts();
    }
  }, [financeData]);

  const renderCharts = () => {
    if (revenueChartRef.current) {
      new Chart(revenueChartRef.current, {
        type: "line",
        data: {
          labels: financeData.revenueTrends.map((d) => d.date),
          datasets: [
            {
              label: "Entrate (€)",
              data: financeData.revenueTrends.map((d) => d.value),
              borderColor: "#4CAF50",
              backgroundColor: "rgba(76, 175, 80, 0.3)",
              fill: true,
            },
          ],
        },
      });
    }

    if (expensesChartRef.current) {
      new Chart(expensesChartRef.current, {
        type: "line",
        data: {
          labels: financeData.revenueTrends.map((d) => d.date),
          datasets: [
            {
              label: "Uscite (€)",
              data: financeData.revenueTrends.map((d) => d.expenses),
              borderColor: "#E74C3C",
              backgroundColor: "rgba(231, 76, 60, 0.3)",
              fill: true,
            },
          ],
        },
      });
    }
  };

  return (
    <div className="financial-report">
      {/* 📊 SEZIONE REPORT */}
      <div className="report-main">
        <h2>📊 Report Finanziari</h2>
        <p>Monitoraggio delle entrate, uscite e profitti dell'hotel.</p>

        {/* ✅ Panoramica Finanziaria */}
        <div className="financial-summary">
          <h3>📌 Panoramica</h3>
          <ul>
            <li>💰 Entrate: €{financeData.totalRevenue}</li>
            <li>💸 Uscite: €{financeData.totalExpenses}</li>
            <li>📈 Profitto Netto: €{financeData.netProfit}</li>
          </ul>
        </div>

        {/* 📊 Grafico Entrate/Uscite */}
        <div className="charts-container">
          <canvas ref={revenueChartRef}></canvas>
          <canvas ref={expensesChartRef}></canvas>
        </div>

        {/* 📜 Storico Transazioni */}
        <div className="transactions-history">
          <h3>📄 Storico Transazioni</h3>
          <table>
            <thead>
              <tr>
                <th>📅 Data</th>
                <th>🏦 Descrizione</th>
                <th>💰 Importo</th>
                <th>📤 Tipo</th>
              </tr>
            </thead>
            <tbody>
              {financeData.transactions.map((txn) => (
                <tr key={txn.id}>
                  <td>{txn.date}</td>
                  <td>{txn.description}</td>
                  <td>€{txn.amount}</td>
                  <td>{txn.type === "income" ? "Entrata" : "Uscita"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 📥 Esportazione e Automazione */}
        <div className="export-options">
          <button onClick={() => exportFinancialReport("pdf")}>
            📄 Esporta PDF
          </button>
          <button onClick={() => exportFinancialReport("csv")}>
            📂 Esporta CSV
          </button>
        </div>
      </div>

      {/* 🔄 SIDEBAR OPZIONI IMPORTAZIONE */}
      <div className="report-sidebar">
        <h3>🔄 Importa Dati Contabili</h3>
        <p>
          Seleziona il metodo più adatto per importare i dati finanziari nel
          sistema.
        </p>

        <button onClick={() => setImportMethod("api")}>🔗 Connetti API</button>
        <button onClick={() => setImportMethod("file")}>
          📂 Carica CSV/XML
        </button>
        <button onClick={() => setImportMethod("manual")}>
          ✍️ Inserisci Manualmente
        </button>

        {importMethod === "api" && (
          <p>🔗 Collega il tuo software di contabilità via API.</p>
        )}
        {importMethod === "file" && (
          <input
            type="file"
            onChange={(e) => importFinancialData(e.target.files[0])}
          />
        )}
        {importMethod === "manual" && (
          <p>✍️ Inserisci manualmente le transazioni finanziarie.</p>
        )}
      </div>
    </div>
  );
};

export default FinancialReport;
