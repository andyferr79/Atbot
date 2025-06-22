import api from "./api"; // ✅ CORRETTO all’interno di services/

// 📊 Recupera le impostazioni dei report
export const getReportSettings = () => api.get("/getReportSettings");

// ⚙️ Aggiorna le impostazioni dei report
export const updateReportSettings = (settings) =>
  api.put("/updateReportSettings", settings);

// 🚀 Genera un report immediatamente
export const generateReportNow = () => {
  const userId = localStorage.getItem("user_id");
  return api.post("/generateReportNow", {
    generatedBy: userId,
  });
};

// 📊 Recupera dati per la dashboard dei report
export const getDashboardMetrics = () => api.get("/getDashboardMetrics");

// 📅 Recupera dati sulle prenotazioni per il report BookingReport.js
export const getBookingsData = () => api.get("/getBookingsData");

// 📄 Recupera dati sui report finanziari
export const getFinancialReport = () => api.get("/getFinancialReport");

// 🚛 Recupera dati sui fornitori per il report
export const getSuppliersReport = () => api.get("/getSuppliersReport");

// 🏨 Recupera dati sulla pulizia delle camere
export const getCleaningReport = () => api.get("/getCleaningReport");

// 📢 Recupera dati sulle campagne marketing
export const getMarketingReport = () => api.get("/getMarketingReport");

// 🛎️ Recupera dati sui clienti e feedback
export const getCustomersReport = () => api.get("/getCustomersReport");

export default api;
