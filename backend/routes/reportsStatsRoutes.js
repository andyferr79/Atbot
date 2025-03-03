const express = require("express");
const router = express.Router();
const admin = require("../firebase");
const rateLimit = require("express-rate-limit");
const winston = require("winston");

// ✅ Configurazione logging avanzato
const logger = winston.createLogger({
  level: "error",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "logs/reports_stats_errors.log" }),
  ],
});

// ✅ Rate Limiting per evitare abuso delle API
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 50,
  message: "❌ Troppe richieste. Attendi prima di riprovare.",
});

// ✅ Funzione per aggiornare Firestore in tempo reale
const updateFirestoreStats = async (stats) => {
  const db = admin.firestore();
  await db.collection("Reports").doc("stats").set(stats, { merge: true });
};

// ✅ API per ottenere le statistiche generali dei report
router.get("/stats", limiter, async (req, res) => {
  try {
    const db = admin.firestore();

    // Recupera dati prenotazioni
    const bookingsSnapshot = await db.collection("Bookings").get();
    const totalBookings = bookingsSnapshot.size;

    // Recupera dati finanziari
    const financesSnapshot = await db.collection("FinancialReports").get();
    const totalRevenue = financesSnapshot.docs.reduce(
      (sum, doc) => sum + (doc.data().amount || 0),
      0
    );

    // Recupera dati campagne marketing
    const marketingSnapshot = await db.collection("MarketingReports").get();
    const totalConversions = marketingSnapshot.docs.reduce(
      (sum, doc) => sum + (doc.data().conversions || 0),
      0
    );

    // ✅ Salva i dati aggiornati in Firestore
    const stats = {
      totalBookings,
      totalRevenue,
      totalConversions,
      avgRevenuePerBooking:
        totalBookings > 0 ? (totalRevenue / totalBookings).toFixed(2) : 0,
      updatedAt: new Date().toISOString(), // 🔥 Timestamp ultimo aggiornamento
    };

    await updateFirestoreStats(stats); // 🔥 Scrive su Firestore

    res.json(stats);
  } catch (error) {
    logger.error("❌ Errore nel recupero delle statistiche:", error);
    res.status(500).json({ error: "Errore nel recupero delle statistiche" });
  }
});

module.exports = router;
