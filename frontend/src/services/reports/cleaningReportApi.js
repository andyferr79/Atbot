import api from "./api"; // ✅ CORRETTO all’interno di services/

// ✅ Recupera i dati del report pulizia
const getCleaningReportData = async () => {
  try {
    const response = await api.get("/getCleaningReports");
    return response.data;
  } catch (error) {
    console.error("❌ Errore nel recupero dei dati della pulizia", error);
    throw error;
  }
};

// ✅ Genera manualmente un report sulla pulizia
const generateCleaningReportNow = async () => {
  try {
    const response = await api.post("/generateCleaningReport");
    return response.data;
  } catch (error) {
    console.error("❌ Errore nella generazione del report pulizia", error);
    throw error;
  }
};

// ✅ Imposta configurazioni automatiche per il report pulizia
const updateCleaningReportSettings = async (settings) => {
  try {
    const response = await api.put("/updateCleaningReportSettings", settings);
    return response.data;
  } catch (error) {
    console.error(
      "❌ Errore nel salvataggio delle impostazioni del report pulizia",
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
