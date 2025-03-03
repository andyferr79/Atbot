const express = require("express");
const router = express.Router();
const admin = require("../firebase");
const rateLimit = require("express-rate-limit");
const winston = require("winston");
const axios = require("axios");

const AI_BACKEND_URL = "http://127.0.0.1:8000"; // Backend AI per raccomandazioni prezzo

// ✅ Configurazione logging avanzato
const logger = winston.createLogger({
  level: "error",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "logs/pricing_errors.log" }),
  ],
});

// ✅ Rate Limiting per evitare abuso delle API
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minuti
  max: 30,
  message: "❌ Troppe richieste. Attendi prima di riprovare.",
});

// ✅ API per ottenere suggerimenti di pricing con AI
router.get("/recommendations", limiter, async (req, res) => {
  try {
    const db = admin.firestore();

    // Recupera i dati delle tariffe esistenti
    const pricingSnapshot = await db.collection("RoomPricing").get();
    let pricingData = [];

    pricingSnapshot.forEach((doc) => {
      pricingData.push({ id: doc.id, ...doc.data() });
    });

    // Chiede all'AI una strategia di pricing basata sui dati Firestore
    const aiResponse = await axios.post(`${AI_BACKEND_URL}/pricing/optimize`, {
      pricingData,
    });

    res.json(aiResponse.data);
  } catch (error) {
    logger.error(
      "❌ Errore nel recupero delle raccomandazioni di prezzo:",
      error
    );
    res
      .status(500)
      .json({ error: "Errore nel recupero delle raccomandazioni di prezzo" });
  }
});

module.exports = router;
