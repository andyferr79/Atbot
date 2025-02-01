// 📌 bookingsReportApi.js - API per il Report delle Prenotazioni
import api from "../api"; // Assicuriamoci di importare l'istanza API principale

// ✅ Recupera i dati delle prenotazioni per il report
export const getBookingsReportData = async () => {
  try {
    const response = await api.get("/reports/bookings");
    return response.data;
  } catch (error) {
    console.error("Errore nel recupero dei dati delle prenotazioni", error);
    throw error;
  }
};

// ✅ Genera manualmente un report delle prenotazioni
export const generateBookingsReportNow = async () => {
  try {
    const response = await api.post("/reports/bookings/generate");
    return response.data;
  } catch (error) {
    console.error("Errore nella generazione del report prenotazioni", error);
    throw error;
  }
};

// ✅ Imposta configurazioni automatiche per il report
export const updateBookingsReportSettings = async (settings) => {
  try {
    const response = await api.put("/reports/bookings/settings", settings);
    return response.data;
  } catch (error) {
    console.error("Errore nel salvataggio delle impostazioni", error);
    throw error;
  }
};

// 🔥 **Assegna a una variabile e poi esporta**
const bookingsReportApi = {
  getBookingsReportData,
  generateBookingsReportNow,
  updateBookingsReportSettings,
};

export default bookingsReportApi;
