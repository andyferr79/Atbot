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
    new winston.transports.File({ filename: "logs/dashboard_errors.log" }),
  ],
});

// ✅ Rate Limiting per evitare abuso della dashboard API
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minuti
  max: 50,
  message: "❌ Troppe richieste. Attendi prima di riprovare.",
});

// ✅ API per ottenere la panoramica della dashboard
router.get("/overview", limiter, async (req, res) => {
  try {
    const db = admin.firestore();

    // Recupera dati da Firestore
    const bookingsSnapshot = await db.collection("Bookings").get();
    const customersSnapshot = await db.collection("Customers").get();
    const financesSnapshot = await db.collection("FinancialReports").get();

    // Calcolo delle statistiche
    const totalBookings = bookingsSnapshot.size;
    const totalRevenue = financesSnapshot.docs.reduce(
      (sum, doc) => sum + (doc.data().amount || 0),
      0
    );
    const avgRevenuePerBooking =
      totalBookings > 0 ? (totalRevenue / totalBookings).toFixed(2) : 0;

    // Tasso di occupazione camere (stima)
    const occupiedRooms = totalBookings * 1.5;
    const totalRooms = 100; // Modificabile dinamicamente
    const occupancyRate = ((occupiedRooms / totalRooms) * 100).toFixed(2);

    // Numero clienti attivi
    const activeCustomers = customersSnapshot.size;

    res.json({
      totalRevenue,
      totalBookings,
      occupancyRate,
      avgRevenuePerBooking,
      activeCustomers,
    });
  } catch (error) {
    logger.error("❌ Errore nel recupero dei dati della dashboard:", error);
    res
      .status(500)
      .json({ error: "Errore nel recupero dei dati della dashboard" });
  }
});

module.exports = router;
