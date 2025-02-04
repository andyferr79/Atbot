// 📅 BookingsReport.js - Report Prenotazioni Ottimizzato
import React, { useState, useEffect, useRef, useCallback } from "react";
import Chart from "chart.js/auto";
import "../../../styles/BookingsReport.css";
import { getBookingsReportData } from "../../../services/reports/bookingsReportApi";

const BookingsReport = () => {
  const [bookingsData, setBookingsData] = useState({
    totalBookings: 0,
    checkIns: 0,
    checkOuts: 0,
    cancellations: 0,
    bookingTrends: [],
  });

  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // 📊 Recupero dati prenotazioni con gestione errori
  useEffect(() => {
    const fetchBookingsData = async () => {
      try {
        const response = await getBookingsReportData();
        if (response) setBookingsData(response);
      } catch (error) {
        console.error("❌ Errore nel recupero dei dati prenotazioni:", error);
      }
    };
    fetchBookingsData();
  }, []);

  // 🎨 Creazione del grafico ottimizzato con `useCallback`
  const renderChart = useCallback(() => {
    if (!bookingsData.bookingTrends.length || !chartRef.current) return;

    try {
      if (chartInstance.current) chartInstance.current.destroy(); // ✅ Rimuove il grafico precedente

      chartInstance.current = new Chart(chartRef.current, {
        type: "line",
        data: {
          labels: bookingsData.bookingTrends.map((d) => d.date),
          datasets: [
            {
              label: "Prenotazioni",
              data: bookingsData.bookingTrends.map((d) => d.value),
              borderColor: "#4CAF50",
              backgroundColor: "rgba(76, 175, 80, 0.3)",
              fill: true,
              tension: 0.4,
              pointRadius: 5,
              pointHoverRadius: 8,
              borderWidth: 3,
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
    } catch (error) {
      console.error("❌ Errore nella generazione del grafico:", error);
    }
  }, [bookingsData]);

  useEffect(() => {
    renderChart();
  }, [bookingsData, renderChart]);

  return (
    <div className="bookings-report">
      <h2>📅 Report Prenotazioni</h2>

      {/* 📊 Panoramica */}
      <div className="dashboard">
        <h3>📌 Panoramica Prenotazioni</h3>
        <ul>
          <li>📋 Totale Prenotazioni: {bookingsData.totalBookings}</li>
          <li>✅ Check-in oggi: {bookingsData.checkIns}</li>
          <li>🚪 Check-out oggi: {bookingsData.checkOuts}</li>
          <li>❌ Cancellazioni: {bookingsData.cancellations}</li>
        </ul>

        {/* 📈 Grafico prenotazioni */}
        <div className="chart-container">
          <canvas ref={chartRef}></canvas>
        </div>
      </div>
    </div>
  );
};

export default BookingsReport;
