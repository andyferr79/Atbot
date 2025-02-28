const express = require("express");
const router = express.Router();
const admin = require("../firebase"); // Connessione a Firestore
const rateLimit = require("express-rate-limit");
const winston = require("winston");

// ✅ Configurazione del logging avanzato
const logger = winston.createLogger({
  level: "error",
  format: winston.format.json(),
  transports: [new winston.transports.File({ filename: "logs/errors.log" })],
});

// ✅ Middleware per limitare le richieste API (Max 100 richieste per IP ogni 15 minuti)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
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

// 📌 API per ottenere le prenotazioni
router.get("/", limiter, verifyToken, async (req, res) => {
  try {
    if (!admin.apps.length) {
      throw new Error("Firestore non inizializzato correttamente.");
    }

    const db = admin.firestore();
    const bookingsSnapshot = await db.collection("Bookings").get();

    if (bookingsSnapshot.empty) {
      return res.json({
        totalBookings: 0,
        activeBookings: 0,
        confirmedBookings: 0,
        cancelledBookings: 0,
        recentBookings: [],
      });
    }

    let totalBookings = 0;
    let activeBookings = 0;
    let confirmedBookings = 0;
    let cancelledBookings = 0;
    let recentBookings = [];

    bookingsSnapshot.forEach((doc) => {
      const booking = doc.data();
      totalBookings++;

      if (booking.status === "active") activeBookings++;
      if (booking.status === "confirmed") confirmedBookings++;
      if (booking.status === "cancelled") cancelledBookings++;

      recentBookings.push({
        id: doc.id,
        customerName: booking.customerName || "N/A",
        checkInDate: booking.checkInDate
          ? booking.checkInDate.toDate().toISOString()
          : "N/A",
        checkOutDate: booking.checkOutDate
          ? booking.checkOutDate.toDate().toISOString()
          : "N/A",
        amount: booking.amount || 0,
        status: booking.status || "unknown",
      });
    });

    // Mantiene solo le ultime 5 prenotazioni
    recentBookings = recentBookings
      .filter((b) => b.checkInDate !== "N/A") // Filtriamo solo date valide
      .sort((a, b) => new Date(b.checkInDate) - new Date(a.checkInDate))
      .slice(0, 5);

    res.json({
      totalBookings,
      activeBookings,
      confirmedBookings,
      cancelledBookings,
      recentBookings,
    });
  } catch (error) {
    logger.error("❌ Errore nel recupero delle prenotazioni:", error);
    res
      .status(500)
      .json({
        error: "Errore nel recupero delle prenotazioni",
        details: error.message,
      });
  }
});

module.exports = router;
