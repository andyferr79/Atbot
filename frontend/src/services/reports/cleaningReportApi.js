// 📌 cleaningReportApi.js - API per il Report Pulizia Camere
import api from "../api"; // Importa l'istanza API principale

// ✅ Recupera i dati del report pulizia
const getCleaningReportData = async () => {
  try {
    const response = await api.get("/reports/cleaning");
    return response.data;
  } catch (error) {
    console.error("Errore nel recupero dei dati della pulizia", error);
    throw error;
  }
};

// ✅ Genera manualmente un report sulla pulizia
const generateCleaningReportNow = async () => {
  try {
    const response = await api.post("/reports/cleaning/generate");
    return response.data;
  } catch (error) {
    console.error("Errore nella generazione del report pulizia", error);
    throw error;
  }
};

// ✅ Imposta configurazioni automatiche per il report pulizia
const updateCleaningReportSettings = async (settings) => {
  try {
    const response = await api.put("/reports/cleaning/settings", settings);
    return response.data;
  } catch (error) {
    console.error(
      "Errore nel salvataggio delle impostazioni del report pulizia",
      error
    );
    throw error;
  }
};

// ✅ 🔥 FIX EXPORT - Assegniamo a una variabile prima di esportare
const cleaningReportApi = {
  getCleaningReportData,
  generateCleaningReportNow,
  updateCleaningReportSettings,
};

export default cleaningReportApi;
