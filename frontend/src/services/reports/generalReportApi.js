// 📌 generalReportApi.js - API per il Report Generale con Firebase Functions
import api from "../api"; // Importa l'istanza API principale

// ✅ Recupera i dati generali del report
export const getGeneralReportData = async () => {
  try {
    const response = await api.get("/getGeneralReports");
    return response.data;
  } catch (error) {
    console.error("Errore nel recupero del report generale:", error);
    throw error;
  }
};

// ✅ Genera manualmente un report generale
export const generateGeneralReportNow = async () => {
  try {
    const response = await api.post("/generateGeneralReport");
    return response.data;
  } catch (error) {
    console.error("Errore nella generazione del report generale:", error);
    throw error;
  }
};

// ✅ Imposta configurazioni automatiche per il report generale
export const updateGeneralReportSettings = async (settings) => {
  try {
    const response = await api.put("/updateGeneralReportSettings", settings);
    return response.data;
  } catch (error) {
    console.error(
      "Errore nel salvataggio delle impostazioni del report generale",
      error
    );
    throw error;
  }
};

// ✅ 🔥 FIX EXPORT - Assegniamo a una variabile prima di esportare
const generalReportApi = {
  getGeneralReportData,
  generateGeneralReportNow,
  updateGeneralReportSettings,
};

export default generalReportApi;
