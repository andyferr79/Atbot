import api from "./api"; // ✅ CORRETTO all’interno di services/

// ✅ Recupera i dati del report prenotazioni
export const getBookingsReportData = async () => {
  try {
    const response = await api.get("/getBookingsReports"); // 🔹 Nome API aggiornato per Firebase
    return response.data;
  } catch (error) {
    console.error("❌ Errore nel recupero del report prenotazioni:", error);
    throw error;
  }
};

// ✅ Genera manualmente un report delle prenotazioni
export const generateBookingsReportNow = async () => {
  try {
    const response = await api.post("/generateBookingsReport"); // 🔹 API Firebase
    return response.data;
  } catch (error) {
    console.error(
      "❌ Errore nella generazione del report prenotazioni:",
      error
    );
    throw error;
  }
};

// ✅ Imposta configurazioni per il report prenotazioni
export const updateBookingsReportSettings = async (settings) => {
  try {
    const response = await api.put("/updateBookingsReportSettings", settings);
    return response.data;
  } catch (error) {
    console.error(
      "❌ Errore nell'aggiornamento delle impostazioni del report prenotazioni:",
      error
    );
    throw error;
  }
};

// ✅ Esportazione sicura
const bookingsReportApi = {
  getBookingsReportData,
  generateBookingsReportNow,
  updateBookingsReportSettings,
};

export default bookingsReportApi;
