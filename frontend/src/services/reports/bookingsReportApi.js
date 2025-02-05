import axios from "axios";

const API_URL = "http://localhost:3001/api/reports/bookings";

// ✅ Ottenere i dati delle prenotazioni (basta solo questa API)
export const getBookingsReportData = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error("❌ Errore nel recupero del report prenotazioni:", error);
    throw error;
  }
};
