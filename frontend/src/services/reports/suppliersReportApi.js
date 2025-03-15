// 📌 suppliersReportApi.js - API per il Report Fornitori con Firebase Functions
import api from "../api"; // Importa l'istanza API principale

// ✅ Recupera i dati del report fornitori
export const getSuppliersReportData = async () => {
  try {
    const response = await api.get("/getSuppliersReports");
    return response.data;
  } catch (error) {
    console.error("Errore nel recupero del report fornitori:", error);
    throw error;
  }
};

// ✅ Genera manualmente un report fornitori
export const generateSuppliersReportNow = async () => {
  try {
    const response = await api.post("/generateSuppliersReport");
    return response.data;
  } catch (error) {
    console.error("Errore nella generazione del report fornitori:", error);
    throw error;
  }
};

// ✅ Imposta configurazioni automatiche per il report fornitori
export const updateSuppliersReportSettings = async (settings) => {
  try {
    const response = await api.put("/updateSuppliersReportSettings", settings);
    return response.data;
  } catch (error) {
    console.error(
      "Errore nel salvataggio delle impostazioni del report fornitori",
      error
    );
    throw error;
  }
};

// ✅ 🔥 FIX EXPORT - Assegniamo a una variabile prima di esportare
const suppliersReportApi = {
  getSuppliersReportData,
  generateSuppliersReportNow,
  updateSuppliersReportSettings,
};

export default suppliersReportApi;
