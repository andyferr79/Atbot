// 📌 generalReportApi.js - API per il Report Generale
import api from "../api"; // Importa l'istanza API principale

// ✅ Recupera i dati generali del report
const getGeneralReportData = async () => {
  try {
    const response = await api.get("/reports/general");
    return response.data;
  } catch (error) {
    console.error("Errore nel recupero dei dati generali del report", error);
    throw error;
  }
};

// ✅ Genera manualmente un report generale
const generateGeneralReportNow = async () => {
  try {
    const response = await api.post("/reports/general/generate");
    return response.data;
  } catch (error) {
    console.error("Errore nella generazione del report generale", error);
    throw error;
  }
};

// ✅ Imposta configurazioni automatiche per il report generale
const updateGeneralReportSettings = async (settings) => {
  try {
    const response = await api.put("/reports/general/settings", settings);
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
