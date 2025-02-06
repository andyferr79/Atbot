// 💰 FinancialReport.js - Report Finanziari con Opzioni di Importazione
import React, { useState, useEffect, useRef, useCallback } from "react";
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
  const revenueChartInstance = useRef(null);
  const expensesChartInstance = useRef(null);

  // ✅ Recupero dati finanziari
  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        const response = await getFinancialReportData();
        setFinanceData(response.data || {});
      } catch (error) {
        console.error("❌ Errore nel recupero dei dati finanziari:", error);
      }
    };
    fetchFinancialData();
  }, []);

  // ✅ Creazione dei grafici
  const renderCharts = useCallback(() => {
    if (financeData.revenueTrends.length > 0) {
      if (revenueChartRef.current) {
        if (revenueChartInstance.current)
          revenueChartInstance.current.destroy();
        revenueChartInstance.current = new Chart(revenueChartRef.current, {
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
        if (expensesChartInstance.current)
          expensesChartInstance.current.destroy();
        expensesChartInstance.current = new Chart(expensesChartRef.current, {
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
    }
  }, [financeData]);

  useEffect(() => {
    renderCharts();
  }, [financeData, renderCharts]);

  // ✅ Funzione per importare il file selezionato
  const handleFileUpload = async (event) => {
    const selectedFile = event.target.files[0];

    if (selectedFile) {
      try {
        await importFinancialData(selectedFile);
        console.log("✅ Dati importati con successo:", selectedFile.name);
        alert(`Dati importati con successo! File: ${selectedFile.name}`);
      } catch (error) {
        console.error("❌ Errore nell'importazione dei dati:", error);
        alert("Errore durante l'importazione.");
      }
    }
  };

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
        <canvas ref={expensesChartRef}></canvas>
      </div>

      {/* 📜 Storico Transazioni */}
      {financeData.transactions.length > 0 ? (
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
      ) : (
        <p>📭 Nessuna transazione registrata.</p>
      )}

      {/* 📥 Esportazione */}
      <div className="export-options">
        <button onClick={() => exportFinancialReport("pdf")}>
          📄 Esporta PDF
        </button>
        <button onClick={() => exportFinancialReport("csv")}>
          📂 Esporta CSV
        </button>
      </div>

      {/* 🔄 SIDEBAR OPZIONI IMPORTAZIONE */}
      <div className="report-sidebar">
        <h3>🔄 Importa Dati Contabili</h3>
        <p>Seleziona il metodo di importazione.</p>

        <button onClick={() => setImportMethod("api")}>🔗 Connetti API</button>
        <button onClick={() => setImportMethod("file")}>
          📂 Carica CSV/XML
        </button>
        <button onClick={() => setImportMethod("manual")}>
          ✍️ Inserisci Manualmente
        </button>

        {importMethod === "file" && (
          <input type="file" onChange={handleFileUpload} />
        )}
      </div>

      {/* 📌 Mostra il metodo di importazione selezionato */}
      {importMethod && (
        <p>🛠 Metodo di importazione selezionato: {importMethod}</p>
      )}
    </div>
  );
};

export default FinancialReport;
