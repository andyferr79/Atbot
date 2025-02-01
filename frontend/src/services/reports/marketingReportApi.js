// 📌 marketingReportApi.js - API per il Report Marketing
import api from "../api"; // Importa l'istanza API principale

// ✅ Recupera i dati del report marketing
const getMarketingReportData = async () => {
  try {
    const response = await api.get("/reports/marketing");
    return response.data;
  } catch (error) {
    console.error("Errore nel recupero dei dati di marketing", error);
    throw error;
  }
};

// ✅ Genera manualmente un report di marketing
const generateMarketingReportNow = async () => {
  try {
    const response = await api.post("/reports/marketing/generate");
    return response.data;
  } catch (error) {
    console.error("Errore nella generazione del report marketing", error);
    throw error;
  }
};

// ✅ Imposta configurazioni automatiche per il report marketing
const updateMarketingReportSettings = async (settings) => {
  try {
    const response = await api.put("/reports/marketing/settings", settings);
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
