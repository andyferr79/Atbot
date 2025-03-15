// 📌 financialReportApi.js - API per il Report Finanziario con Firebase Functions
import api from "../api"; // Importa l'istanza API principale

// ✅ Recupera i dati finanziari del report
export const getFinancialReportData = async () => {
  try {
    const response = await api.get("/getFinancialReports");
    return response.data;
  } catch (error) {
    console.error("Errore nel recupero del report finanziario:", error);
    throw error;
  }
};

// ✅ Esporta il report finanziario (PDF, Excel, CSV)
export const exportFinancialReport = async (format) => {
  try {
    const response = await api.get(`/exportFinancialReport?format=${format}`, {
      responseType: "blob", // Permette di scaricare il file
    });
    return response.data;
  } catch (error) {
    console.error("Errore nell'esportazione del report:", error);
    throw error;
  }
};

// ✅ Importa dati finanziari (Se supportato nel backend)
export const importFinancialData = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await api.post("/importFinancialData", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    console.error("Errore nell'importazione dei dati finanziari:", error);
    throw error;
  }
};

// 🚀 ✅ FIX EXPORT - Assegniamo a una variabile prima di esportare
const financialReportApi = {
  getFinancialReportData,
  exportFinancialReport,
  importFinancialData,
};

export default financialReportApi;
