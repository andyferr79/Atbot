import api from "./api"; // ✅ CORRETTO all’interno di services/

import { db } from "../firebase"; // Firestore per aggiornamenti in tempo reale
import { collection, onSnapshot } from "firebase/firestore";

// ✅ Recupera statistiche generali dei report (chiamata manuale)
export const getReportsStats = async () => {
  try {
    const response = await api.get("/getReportsStats");
    return response.data;
  } catch (error) {
    console.error("❌ Errore nel recupero delle statistiche generali:", error);
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
  subscribeToReportsStats, // 🔄 Aggiornamenti automatici in tempo reale
};

export default reportsStatsApi;
