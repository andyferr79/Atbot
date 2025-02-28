const express = require("express");
const router = express.Router();
const admin = require("../firebase"); // ✅ Importa Firebase correttamente
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

// ✅ Endpoint per ottenere i dati delle prenotazioni per il report
router.get("/", limiter, verifyToken, async (req, res) => {
  try {
    if (!admin.apps.length) {
      throw new Error("Firestore non inizializzato correttamente.");
    }

    const snapshot = await admin.firestore().collection("Bookings").get();

    if (snapshot.empty) {
      console.log("⚠️ Nessuna prenotazione trovata.");
      return res.json([]);
    }

    const bookingsReports = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt
        ? doc.data().createdAt.toDate().toISOString()
        : null,
      checkInDate: doc.data().checkInDate
        ? doc.data().checkInDate.toDate().toISOString()
        : null,
      checkOutDate: doc.data().checkOutDate
        ? doc.data().checkOutDate.toDate().toISOString()
        : null,
    }));

    console.log(`✅ Recuperate ${bookingsReports.length} prenotazioni.`);
    res.json(bookingsReports);
  } catch (error) {
    logger.error("❌ Errore nel recupero del report prenotazioni:", error);
    res
      .status(500)
      .json({
        error: "Errore nel recupero del report prenotazioni",
        details: error.message,
      });
  }
});

module.exports = router;

module.exports = router;
