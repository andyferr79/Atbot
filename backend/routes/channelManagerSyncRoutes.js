const express = require("express");
const router = express.Router();
const admin = require("../firebase");
const rateLimit = require("express-rate-limit");
const winston = require("winston");

// ✅ Logging avanzato
const logger = winston.createLogger({
  level: "error",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({
      filename: "logs/channel_manager_errors.log",
    }),
  ],
});

// ✅ Protezione API con rate limit
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: "❌ Troppe richieste. Attendi prima di riprovare.",
});

// ✅ API per sincronizzare StayPro con Booking, Airbnb, Expedia
router.post("/sync", limiter, async (req, res) => {
  try {
    const db = admin.firestore();

    // Simulazione aggiornamento OTA (in produzione, chiamare API OTA reali)
    await db.collection("ChannelManager").doc("sync_status").set({
      status: "syncing",
      lastSync: new Date().toISOString(),
    });

    res.json({ message: "✅ Sincronizzazione avviata con successo!" });
  } catch (error) {
    logger.error("❌ Errore nella sincronizzazione con OTA:", error);
    res.status(500).json({ error: "Errore nella sincronizzazione con OTA" });
  }
});

module.exports = router;
