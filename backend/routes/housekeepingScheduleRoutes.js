const express = require("express");
const router = express.Router();
const admin = require("../firebase");
const rateLimit = require("express-rate-limit");
const winston = require("winston");
const axios = require("axios");

const AI_BACKEND_URL = "http://127.0.0.1:8000"; // Backend AI per ottimizzazione pulizie

// ✅ Logging avanzato
const logger = winston.createLogger({
  level: "error",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "logs/housekeeping_errors.log" }),
  ],
});

// ✅ Protezione API con rate limit
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: "❌ Troppe richieste. Attendi prima di riprovare.",
});

// ✅ API per generare la pianificazione delle pulizie
router.get("/schedule", limiter, async (req, res) => {
  try {
    const db = admin.firestore();

    // Recupera i dati delle prenotazioni attuali
    const bookingsSnapshot = await db.collection("Bookings").get();
    let bookingsData = [];

    bookingsSnapshot.forEach((doc) => {
      bookingsData.push({ id: doc.id, ...doc.data() });
    });

    // Chiede all'AI di generare la pianificazione ottimale delle pulizie
    const aiResponse = await axios.post(
      `${AI_BACKEND_URL}/housekeeping/optimize`,
      {
        bookingsData,
      }
    );

    res.json(aiResponse.data);
  } catch (error) {
    logger.error(
      "❌ Errore nella generazione della pianificazione pulizie:",
      error
    );
    res
      .status(500)
      .json({ error: "Errore nella generazione della pianificazione pulizie" });
  }
});

module.exports = router;
