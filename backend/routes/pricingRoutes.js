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

// 📌 API per ottenere le tariffe attuali delle camere
router.get("/", limiter, verifyToken, async (req, res) => {
  try {
    if (!admin.apps.length) {
      throw new Error("Firestore non inizializzato correttamente.");
    }

    const db = admin.firestore();
    const pricingSnapshot = await db.collection("RoomPricing").get();

    if (pricingSnapshot.empty) {
      return res.json({ prices: [] });
    }

    let prices = [];

    pricingSnapshot.forEach((doc) => {
      const price = doc.data();
      prices.push({
        id: doc.id,
        roomType: price.roomType || "N/A",
        currentPrice: price.currentPrice || 0,
        suggestedPrice: price.suggestedPrice || 0,
        lastUpdated: price.lastUpdated
          ? price.lastUpdated.toDate().toISOString()
          : "N/A",
      });
    });

    res.json({ prices });
  } catch (error) {
    logger.error("❌ Errore nel recupero delle tariffe:", error);
    res
      .status(500)
      .json({
        error: "Errore nel recupero delle tariffe",
        details: error.message,
      });
  }
});

// 📌 API per aggiornare una tariffa manualmente
router.put("/update/:id", limiter, verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { newPrice } = req.body;

    if (!newPrice || isNaN(newPrice) || newPrice <= 0) {
      return res
        .status(400)
        .json({ error: "❌ Il nuovo prezzo deve essere un numero positivo." });
    }

    const db = admin.firestore();
    await db
      .collection("RoomPricing")
      .doc(id)
      .update({
        currentPrice: parseFloat(newPrice),
        lastUpdated: new Date(),
      });

    res.json({ message: "✅ Tariffa aggiornata con successo", id });
  } catch (error) {
    logger.error("❌ Errore nell'aggiornamento della tariffa:", error);
    res
      .status(500)
      .json({
        error: "Errore nell'aggiornamento della tariffa",
        details: error.message,
      });
  }
});

module.exports = router;
