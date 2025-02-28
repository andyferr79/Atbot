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

// ✅ Recupera tutti i report delle pulizie filtrando per structureId
router.get("/", limiter, verifyToken, async (req, res) => {
  try {
    if (!admin.apps.length) {
      throw new Error("Firestore non inizializzato correttamente.");
    }

    const { structureId } = req.query;
    let query = admin.firestore().collection("CleaningReports");

    if (structureId) {
      query = query.where("structureId", "==", structureId);
    }

    const snapshot = await query.get();
    const reports = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      lastCleaned: doc.data().lastCleaned
        ? doc.data().lastCleaned.toDate().toISOString()
        : "N/A",
      createdAt: doc.data().createdAt
        ? doc.data().createdAt.toDate().toISOString()
        : "N/A",
    }));

    res.json(reports);
  } catch (error) {
    logger.error("❌ Errore nel recupero dei dati sulle pulizie:", error);
    res
      .status(500)
      .json({
        error: "Errore nel recupero dei dati sulle pulizie",
        details: error.message,
      });
  }
});

// ✅ Aggiunge un nuovo report di pulizia per qualsiasi tipo di struttura
router.post("/add", limiter, verifyToken, async (req, res) => {
  try {
    const {
      structureId,
      structureType,
      roomNumber,
      address,
      status,
      lastCleaned,
      assignedTo,
    } = req.body;

    if (
      !structureId ||
      !structureType ||
      !roomNumber ||
      !status ||
      !lastCleaned ||
      !assignedTo
    ) {
      return res
        .status(400)
        .json({ error: "Tutti i campi obbligatori devono essere compilati" });
    }

    const newReport = {
      structureId,
      structureType,
      roomNumber,
      address:
        structureType === "appartamento" || structureType === "villa"
          ? address
          : null,
      status,
      lastCleaned: new Date(lastCleaned),
      assignedTo,
      createdAt: new Date(),
    };

    const docRef = await admin
      .firestore()
      .collection("CleaningReports")
      .add(newReport);
    res.json({
      id: docRef.id,
      ...newReport,
      lastCleaned: newReport.lastCleaned.toISOString(),
      createdAt: newReport.createdAt.toISOString(),
    });
  } catch (error) {
    logger.error("❌ Errore nell'aggiunta del report di pulizia:", error);
    res
      .status(500)
      .json({
        error: "Errore nell'aggiunta del report di pulizia",
        details: error.message,
      });
  }
});

module.exports = router;
