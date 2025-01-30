// Reports.js - Pagina principale dei Report
import React, { useState } from "react";
import "../../styles/Reports.css";
import GeneralReport from "./sections/GeneralReport";
import FinancialReport from "./sections/FinancialReport";
import BookingsReport from "./sections/BookingsReport";
import SuppliersReport from "./sections/SuppliersReport";
import CleaningReport from "./sections/CleaningReport";
import MarketingReport from "./sections/MarketingReport";
import CustomersReport from "./sections/CustomersReport";

const reportSections = [
  {
    id: "general",
    title: "Report Generali",
    description: "Panoramica dei dati chiave dell'hotel.",
    icon: "📊",
    component: <GeneralReport />,
  },
  {
    id: "financial",
    title: "Report Finanziari",
    description: "Dati su entrate, uscite e profitti.",
    icon: "💰",
    component: <FinancialReport />,
  },
  {
    id: "bookings",
    title: "Report Prenotazioni",
    description: "Analisi dei check-in, check-out e cancellazioni.",
    icon: "🏨",
    component: <BookingsReport />,
  },
  {
    id: "suppliers",
    title: "Report Fornitori",
    description: "Gestione fornitori e storico acquisti.",
    icon: "🚛",
    component: <SuppliersReport />,
  },
  {
    id: "cleaning",
    title: "Report Pulizia",
    description: "Monitoraggio delle attività di housekeeping.",
    icon: "🧹",
    component: <CleaningReport />,
  },
  {
    id: "marketing",
    title: "Report Marketing",
    description: "Dati su campagne pubblicitarie e conversioni.",
    icon: "📢",
    component: <MarketingReport />,
  },
  {
    id: "customers",
    title: "Report Clienti",
    description: "Feedback, recensioni e fidelizzazione.",
    icon: "🛎️",
    component: <CustomersReport />,
  },
];

const Reports = () => {
  const [activeReport, setActiveReport] = useState(null);

  const handleOpenReport = (reportId) => {
    setActiveReport(reportId);
  };

  const handleCloseReport = () => {
    setActiveReport(null);
  };

  return (
    <div className="reports-page">
      <h1 className="reports-title">Report & Statistiche</h1>

      {activeReport ? (
        <div className="report-detail">
          <button className="back-button" onClick={handleCloseReport}>
            ⬅ Torna Indietro
          </button>
          {
            reportSections.find((section) => section.id === activeReport)
              ?.component
          }
        </div>
      ) : (
        <div className="reports-container">
          {reportSections.map((section) => (
            <div
              key={section.id}
              className="report-card"
              onClick={() => handleOpenReport(section.id)}
            >
              <div className="report-icon">{section.icon}</div>
              <h2 className="report-card-title">{section.title}</h2>
              <p className="report-card-description">{section.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reports;
