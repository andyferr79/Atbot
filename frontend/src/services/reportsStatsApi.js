import api from "../api"; // Importa l'istanza API principale
import { db } from "../firebase"; // Importa Firestore per il tempo reale
import { collection, onSnapshot } from "firebase/firestore";

// ✅ Recupera statistiche generali dei report (chiamata manuale)
export const getReportsStats = async () => {
  try {
    const response = await api.get("/reports/stats");
    return response.data;
  } catch (error) {
    console.error("Errore nel recupero delle statistiche generali:", error);
    throw error;
  }
};

// ✅ Attiva aggiornamenti in tempo reale con Firestore
export const subscribeToReportsStats = (callback) => {
  const statsRef = collection(db, "ReportsStats"); // Firestore Realtime
  return onSnapshot(statsRef, (snapshot) => {
    const stats = snapshot.docs.map((doc) => doc.data());
    callback(stats);
  });
};

// ✅ Esportazione sicura dell'API
const reportsStatsApi = {
  getReportsStats,
  subscribeToReportsStats, // Aggiornamenti automatici
};

export default reportsStatsApi;
