// 📌 customersReportApi.js - API per il Report Clienti con Firebase Functions
import api from "./api"; // ✅ CORRETTO all’interno di services/

// ✅ Recupera i dati dei clienti per il report
export const getCustomersReportData = async () => {
  try {
    const response = await api.get("/getCustomersReports");
    return response.data;
  } catch (error) {
    console.error("Errore nel recupero dei dati dei clienti", error);
    throw error;
  }
};

// ✅ Genera manualmente un report dei clienti
export const generateCustomersReportNow = async () => {
  try {
    const response = await api.post("/generateCustomersReport");
    return response.data;
  } catch (error) {
    console.error("Errore nella generazione del report clienti", error);
    throw error;
  }
};

// ✅ Imposta configurazioni automatiche per il report clienti
export const updateCustomersReportSettings = async (settings) => {
  try {
    const response = await api.put("/updateCustomersReportSettings", settings);
    return response.data;
  } catch (error) {
    console.error("Errore nel salvataggio delle impostazioni", error);
    throw error;
  }
};

// ✅ Recupera lo storico dei report generati
export const getCustomersReportHistory = async () => {
  try {
    const response = await api.get("/getCustomersReportHistory");
    return response.data;
  } catch (error) {
    console.error(
      "Errore nel recupero dello storico dei report clienti",
      error
    );
    throw error;
  }
};

// ✅ Esporta i dati del report clienti (PDF, Excel, CSV)
export const exportCustomersReport = async (format) => {
  try {
    const response = await api.get(`/exportCustomersReport?format=${format}`, {
      responseType: "blob", // Permette di scaricare il file
    });
    return response.data;
  } catch (error) {
    console.error("Errore nell'esportazione del report clienti", error);
    throw error;
  }
};

// 🚀 ✅ FIX: Assegna l'oggetto a una variabile prima di esportarlo
const customersReportApi = {
  getCustomersReportData,
  generateCustomersReportNow,
  updateCustomersReportSettings,
  getCustomersReportHistory,
  exportCustomersReport,
};

export default customersReportApi;
