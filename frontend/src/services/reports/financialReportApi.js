import axios from "axios";

const API_URL = "http://localhost:3001/api/reports/financial";

// ✅ Funzione per ottenere i dati finanziari (Fix dell'export)
export const getFinancialReportData = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error("Errore nel recupero del report finanziario:", error);
    throw error;
  }
};

// ✅ Funzione per esportare il report finanziario
export const exportFinancialReport = async (format) => {
  try {
    const response = await axios.get(`${API_URL}/export?format=${format}`);
    return response.data;
  } catch (error) {
    console.error("Errore nell'esportazione del report:", error);
    throw error;
  }
};

// ✅ Funzione per importare dati finanziari (Se esiste questa funzione)
export const importFinancialData = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await axios.post(`${API_URL}/import`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    console.error("Errore nell'importazione dei dati:", error);
    throw error;
  }
};
