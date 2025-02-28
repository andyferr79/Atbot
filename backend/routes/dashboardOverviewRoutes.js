const express = require("express");
const router = express.Router();
const admin = require("../firebase");
const rateLimit = require("express-rate-limit");
const winston = require("winston");

// ✅ Configurazione del logging avanzato
const logger = winston.createLogger({
  level: "error",
  format: winston.format.json(),
  transports: [new winston.transports.File({ filename: "logs/errors.log" })],
});

// ✅ Middleware per limitare le richieste API (Max 50 richieste per IP ogni 10 minuti)
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 50,
  message: "❌ Troppe richieste. Riprova più tardi.",
});

// ✅ Middleware di autenticazione Firebase
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(403).json({ error: "❌ Token mancante" });

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    logger.error("❌ Token non valido:", error);
    return res.status(401).json({ error: "❌ Token non valido" });
  }
};

// 📌 API per ottenere la panoramica generale della dashboard
router.get("/overview", limiter, verifyToken, async (req, res) => {
  try {
    if (!admin.apps.length) {
      throw new Error("Firestore non inizializzato correttamente.");
    }

    const db = admin.firestore();

    // Recupera dati da Firestore
    const bookingsSnapshot = await db.collection("Bookings").get();
    const financesSnapshot = await db.collection("FinancialReports").get();

    if (bookingsSnapshot.empty && financesSnapshot.empty) {
      return res.json({
        totalRevenue: 0,
        totalBookings: 0,
        occupancyRate: "0.00%",
        avgRevenuePerBooking: "0.00",
      });
    }

    // Calcolo delle statistiche
    const totalBookings = bookingsSnapshot.size;
    const totalRevenue = financesSnapshot.docs.reduce(
      (sum, doc) => sum + (doc.data().amount || 0),
      0
    );
    const avgRevenuePerBooking =
      totalBookings > 0 ? (totalRevenue / totalBookings).toFixed(2) : "0.00";

    // Simulazione tasso di occupazione (da migliorare con dati reali)
    const occupiedRooms = totalBookings * 1.5; // Stima basata sulle prenotazioni
    const totalRooms = 100; // Valore statico, può essere migliorato
    const occupancyRate =
      totalRooms > 0
        ? ((occupiedRooms / totalRooms) * 100).toFixed(2) + "%"
        : "0.00%";

    res.json({
      totalRevenue,
      totalBookings,
      occupancyRate,
      avgRevenuePerBooking,
    });
  } catch (error) {
    logger.error("❌ Errore nel recupero dei dati della dashboard:", error);
    res
      .status(500)
      .json({
        error: "Errore nel recupero dei dati della dashboard",
        details: error.message,
      });
  }
});

module.exports = router;
