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

// 📌 API per ottenere i dati della reportistica
router.get("/", limiter, verifyToken, async (req, res) => {
  try {
    if (!admin.apps.length) {
      throw new Error("Firestore non inizializzato correttamente.");
    }

    const db = admin.firestore();
    const reportsSnapshot = await db.collection("Reports").get();

    if (reportsSnapshot.empty) {
      return res.json({ reports: [] });
    }

    let reports = [];

    reportsSnapshot.forEach((doc) => {
      const report = doc.data();
      reports.push({
        id: doc.id,
        type: report.type || "general",
        title: report.title || "Nessun titolo",
        createdAt: report.createdAt
          ? report.createdAt.toDate().toISOString()
          : "N/A",
        data: report.data || {},
      });
    });

    res.json({ reports });
  } catch (error) {
    logger.error("❌ Errore nel recupero dei report:", error);
    res
      .status(500)
      .json({
        error: "Errore nel recupero dei report",
        details: error.message,
      });
  }
});

// 📌 API per generare un report personalizzato
router.post("/generate", limiter, verifyToken, async (req, res) => {
  try {
    const { title, type, data } = req.body;

    if (!title || !type || !data) {
      return res
        .status(400)
        .json({ error: "❌ Tutti i campi sono obbligatori." });
    }

    if (typeof title !== "string" || typeof type !== "string") {
      return res
        .status(400)
        .json({
          error: "❌ Il titolo e il tipo devono essere stringhe valide.",
        });
    }

    if (typeof data !== "object") {
      return res
        .status(400)
        .json({
          error: "❌ I dati del report devono essere in formato JSON valido.",
        });
    }

    const db = admin.firestore();
    const newReport = {
      title,
      type,
      data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("Reports").add(newReport);
    res.json({ message: "✅ Report generato con successo", id: docRef.id });
  } catch (error) {
    logger.error("❌ Errore nella generazione del report:", error);
    res
      .status(500)
      .json({
        error: "Errore nella generazione del report",
        details: error.message,
      });
  }
});

module.exports = router;
