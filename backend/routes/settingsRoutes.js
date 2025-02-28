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

// 📌 API per ottenere le preferenze generali
router.get("/preferences", limiter, verifyToken, async (req, res) => {
  try {
    const doc = await admin
      .firestore()
      .collection("Settings")
      .doc("preferences")
      .get();
    if (!doc.exists) {
      return res.status(404).json({ message: "Preferenze non trovate" });
    }
    res.json(doc.data());
  } catch (error) {
    logger.error("❌ Errore nel recupero delle preferenze:", error);
    res
      .status(500)
      .json({
        message: "Errore nel recupero delle preferenze",
        details: error.message,
      });
  }
});

// 📌 API per aggiornare le preferenze generali
router.put("/preferences", limiter, verifyToken, async (req, res) => {
  try {
    const preferences = req.body;
    if (!preferences || typeof preferences !== "object") {
      return res
        .status(400)
        .json({ error: "❌ Dati di preferenze non validi." });
    }

    await admin
      .firestore()
      .collection("Settings")
      .doc("preferences")
      .set(preferences, { merge: true });
    res.json({ message: "✅ Preferenze aggiornate con successo" });
  } catch (error) {
    logger.error("❌ Errore nell'aggiornamento delle preferenze:", error);
    res
      .status(500)
      .json({
        message: "Errore nell'aggiornamento delle preferenze",
        details: error.message,
      });
  }
});

// 📌 API per ottenere la configurazione della struttura
router.get("/structure", limiter, verifyToken, async (req, res) => {
  try {
    const doc = await admin
      .firestore()
      .collection("Settings")
      .doc("structure")
      .get();
    if (!doc.exists) {
      return res
        .status(404)
        .json({ message: "Configurazioni della struttura non trovate" });
    }
    res.json(doc.data());
  } catch (error) {
    logger.error(
      "❌ Errore nel recupero delle configurazioni della struttura:",
      error
    );
    res
      .status(500)
      .json({
        message: "Errore nel recupero delle configurazioni della struttura",
        details: error.message,
      });
  }
});

// 📌 API per aggiornare la configurazione della struttura
router.put("/structure", limiter, verifyToken, async (req, res) => {
  try {
    const structure = req.body;
    if (!structure || typeof structure !== "object") {
      return res
        .status(400)
        .json({ error: "❌ Dati di struttura non validi." });
    }

    await admin
      .firestore()
      .collection("Settings")
      .doc("structure")
      .set(structure, { merge: true });
    res.json({
      message: "✅ Configurazioni della struttura aggiornate con successo",
    });
  } catch (error) {
    logger.error(
      "❌ Errore nell'aggiornamento delle configurazioni della struttura:",
      error
    );
    res
      .status(500)
      .json({
        message:
          "Errore nell'aggiornamento delle configurazioni della struttura",
        details: error.message,
      });
  }
});

// 📌 API per ottenere le impostazioni di sicurezza
router.get("/security", limiter, verifyToken, async (req, res) => {
  try {
    const doc = await admin
      .firestore()
      .collection("Settings")
      .doc("security")
      .get();
    if (!doc.exists) {
      return res
        .status(404)
        .json({ message: "Impostazioni di sicurezza non trovate" });
    }
    res.json(doc.data());
  } catch (error) {
    logger.error(
      "❌ Errore nel recupero delle impostazioni di sicurezza:",
      error
    );
    res
      .status(500)
      .json({
        message: "Errore nel recupero delle impostazioni di sicurezza",
        details: error.message,
      });
  }
});

// 📌 API per aggiornare le impostazioni di sicurezza
router.put("/security", limiter, verifyToken, async (req, res) => {
  try {
    const security = req.body;
    if (!security || typeof security !== "object") {
      return res
        .status(400)
        .json({ error: "❌ Dati di sicurezza non validi." });
    }

    await admin
      .firestore()
      .collection("Settings")
      .doc("security")
      .set(security, { merge: true });
    res.json({
      message: "✅ Impostazioni di sicurezza aggiornate con successo",
    });
  } catch (error) {
    logger.error(
      "❌ Errore nell'aggiornamento delle impostazioni di sicurezza:",
      error
    );
    res
      .status(500)
      .json({
        message: "Errore nell'aggiornamento delle impostazioni di sicurezza",
        details: error.message,
      });
  }
});

module.exports = router;
