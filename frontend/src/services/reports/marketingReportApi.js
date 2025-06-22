// 📌 marketingReportApi.js - API per il Report Marketing con Firebase Functions
import api from "./api"; // ✅ CORRETTO all’interno di services/

// ✅ Recupera i dati del report marketing
export const getMarketingReportData = async () => {
  try {
    const response = await api.get("/getMarketingReports");
    return response.data;
  } catch (error) {
    console.error("Errore nel recupero del report marketing:", error);
    throw error;
  }
};

// ✅ Genera manualmente un report di marketing
export const generateMarketingReportNow = async () => {
  try {
    const response = await api.post("/generateMarketingReport");
    return response.data;
  } catch (error) {
    console.error("Errore nella generazione del report marketing:", error);
    throw error;
  }
};

// ✅ Imposta configurazioni automatiche per il report marketing
export const updateMarketingReportSettings = async (settings) => {
  try {
    const response = await api.put("/updateMarketingReportSettings", settings);
    return response.data;
  } catch (error) {
    console.error(
      "Errore nel salvataggio delle impostazioni del report marketing",
      error
    );
    throw error;
  }
};

// ✅ 🔥 FIX EXPORT - Assegniamo a una variabile prima di esportare
const marketingReportApi = {
  getMarketingReportData,
  generateMarketingReportNow,
  updateMarketingReportSettings,
};

export default marketingReportApi;
