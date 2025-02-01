import axios from "axios";

// 📌 Istanza Axios per la gestione dei report
const reportsApi = axios.create({
  baseURL: "http://localhost:3001/api/reports",
});

// 📊 Recupera le impostazioni dei report
export const getReportSettings = () => reportsApi.get("/settings");

// ⚙️ Aggiorna le impostazioni dei report
export const updateReportSettings = (settings) =>
  reportsApi.put("/settings", settings);

// 🚀 Genera un report immediatamente
export const generateReportNow = () => reportsApi.post("/generate");

// 📊 Recupera dati per la dashboard dei report
export const getDashboardMetrics = () => reportsApi.get("/dashboard");

// 📅 Recupera dati sulle prenotazioni per il report BookingReport.js
export const getBookingsData = () => reportsApi.get("/bookings-data");

// 📄 Recupera dati sui report finanziari
export const getFinancialReport = () => reportsApi.get("/financial-data");

// 🚛 Recupera dati sui fornitori per il report
export const getSuppliersReport = () => reportsApi.get("/suppliers-data");

// 🏨 Recupera dati sulla pulizia delle camere
export const getCleaningReport = () => reportsApi.get("/cleaning-data");

// 📢 Recupera dati sulle campagne marketing
export const getMarketingReport = () => reportsApi.get("/marketing-data");

// 🛎️ Recupera dati sui clienti e feedback
export const getCustomersReport = () => reportsApi.get("/customers-data");

export default reportsApi;
