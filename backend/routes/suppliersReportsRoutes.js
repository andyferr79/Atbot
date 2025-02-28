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

// ✅ Endpoint per ottenere i dati dei fornitori
router.get("/", limiter, verifyToken, async (req, res) => {
  try {
    if (!admin.apps.length) {
      throw new Error("Firestore non inizializzato correttamente.");
    }

    const snapshot = await admin
      .firestore()
      .collection("SuppliersReports")
      .get();
    const suppliersReports = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      reportDate: doc.data().reportDate
        ? doc.data().reportDate.toDate().toISOString()
        : "N/A",
      createdAt: doc.data().createdAt
        ? doc.data().createdAt.toDate().toISOString()
        : "N/A",
    }));

    res.json(suppliersReports);
  } catch (error) {
    logger.error("❌ Errore nel recupero dei dati fornitori:", error);
    res
      .status(500)
      .json({
        error: "Errore nel recupero dei dati fornitori",
        details: error.message,
      });
  }
});

// ✅ Endpoint per aggiungere un nuovo report fornitore
router.post("/add", limiter, verifyToken, async (req, res) => {
  try {
    const { supplierName, totalSpent, contractStatus, reportDate } = req.body;

    if (!supplierName || !totalSpent || !contractStatus || !reportDate) {
      return res
        .status(400)
        .json({ error: "❌ Tutti i campi sono obbligatori." });
    }

    // Validazione del totale speso (deve essere un numero positivo)
    const parsedTotalSpent = parseFloat(totalSpent);
    if (isNaN(parsedTotalSpent) || parsedTotalSpent <= 0) {
      return res
        .status(400)
        .json({ error: "❌ Il totale speso deve essere un numero positivo." });
    }

    const newSupplierReport = {
      supplierName,
      totalSpent: parsedTotalSpent,
      contractStatus,
      reportDate: new Date(reportDate),
      createdAt: new Date(),
    };

    const docRef = await admin
      .firestore()
      .collection("SuppliersReports")
      .add(newSupplierReport);

    res.json({
      message: "✅ Report fornitore aggiunto con successo",
      id: docRef.id,
      reportDate: newSupplierReport.reportDate.toISOString(),
      createdAt: newSupplierReport.createdAt.toISOString(),
    });
  } catch (error) {
    logger.error("❌ Errore nell'aggiunta del report fornitore:", error);
    res
      .status(500)
      .json({
        error: "Errore nell'aggiunta del report fornitore",
        details: error.message,
      });
  }
});

module.exports = router;
