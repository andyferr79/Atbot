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

// ✅ Recupera tutti i report di marketing
router.get("/", limiter, verifyToken, async (req, res) => {
  try {
    if (!admin.apps.length) {
      throw new Error("Firestore non inizializzato correttamente.");
    }

    const snapshot = await admin
      .firestore()
      .collection("MarketingReports")
      .get();

    if (snapshot.empty) {
      return res.json([]);
    }

    const reports = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt
        ? doc.data().createdAt.toDate().toISOString()
        : "N/A",
    }));

    res.json(reports);
  } catch (error) {
    logger.error("❌ Errore nel recupero dei dati di marketing:", error);
    res
      .status(500)
      .json({
        error: "Errore nel recupero dei dati di marketing",
        details: error.message,
      });
  }
});

// ✅ Aggiunge un nuovo report di marketing
router.post("/add", limiter, verifyToken, async (req, res) => {
  try {
    const { name, channel, budget, conversions } = req.body;

    if (!name || !channel || !budget || !conversions) {
      return res
        .status(400)
        .json({ error: "❌ Tutti i campi sono obbligatori." });
    }

    // Validazione del budget (deve essere un numero positivo)
    const parsedBudget = parseFloat(budget);
    if (isNaN(parsedBudget) || parsedBudget <= 0) {
      return res
        .status(400)
        .json({ error: "❌ Il budget deve essere un numero positivo." });
    }

    // Validazione delle conversioni (deve essere un numero intero positivo)
    const parsedConversions = parseInt(conversions);
    if (isNaN(parsedConversions) || parsedConversions < 0) {
      return res
        .status(400)
        .json({
          error: "❌ Le conversioni devono essere un numero intero positivo.",
        });
    }

    const newReport = {
      name,
      channel,
      budget: parsedBudget,
      conversions: parsedConversions,
      createdAt: new Date(),
    };

    const docRef = await admin
      .firestore()
      .collection("MarketingReports")
      .add(newReport);
    res.json({
      id: docRef.id,
      ...newReport,
      createdAt: newReport.createdAt.toISOString(),
    });
  } catch (error) {
    logger.error("❌ Errore nell'aggiunta del report di marketing:", error);
    res
      .status(500)
      .json({
        error: "Errore nell'aggiunta del report di marketing",
        details: error.message,
      });
  }
});

module.exports = router;
