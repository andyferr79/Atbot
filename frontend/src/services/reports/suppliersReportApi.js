// 📌 suppliersReportApi.js - API per il Report Fornitori
import api from "../api"; // Importa l'istanza API principale

// ✅ Recupera i dati del report fornitori
const getSuppliersReportData = async () => {
  try {
    const response = await api.get("/reports/suppliers");
    return response.data;
  } catch (error) {
    console.error("Errore nel recupero dei dati fornitori del report", error);
    throw error;
  }
};

// ✅ Genera manualmente un report fornitori
const generateSuppliersReportNow = async () => {
  try {
    const response = await api.post("/reports/suppliers/generate");
    return response.data;
  } catch (error) {
    console.error("Errore nella generazione del report fornitori", error);
    throw error;
  }
};

// ✅ Imposta configurazioni automatiche per il report fornitori
const updateSuppliersReportSettings = async (settings) => {
  try {
    const response = await api.put("/reports/suppliers/settings", settings);
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
