const express = require("express");
const router = express.Router();
const admin = require("../firebase");
const fileUpload = require("express-fileupload");
const rateLimit = require("express-rate-limit");
const winston = require("winston");

router.use(fileUpload());

// ✅ Configurazione del logging avanzato
const logger = winston.createLogger({
  level: "error",
  format: winston.format.json(),
  transports: [new winston.transports.File({ filename: "logs/errors.log" })],
});

// ✅ Middleware per limitare le richieste API (Max 20 upload per IP ogni 15 minuti)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "❌ Troppe richieste di upload. Riprova più tardi.",
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

// ✅ Endpoint per importare dati finanziari e aggiornarli come "processed"
router.post("/import", limiter, verifyToken, async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: "❌ Nessun file caricato." });
    }

    const file = req.files.file;
    console.log(`✅ File ricevuto: ${file.name}`);

    // Validazione del formato del file (accettiamo solo CSV e Excel)
    const allowedTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    if (!allowedTypes.includes(file.mimetype)) {
      return res
        .status(400)
        .json({
          error:
            "❌ Formato file non supportato. Carica un CSV o un file Excel.",
        });
    }

    const financialData = {
      fileName: file.name,
      uploadedAt: new Date(),
      status: "pending",
      processedAt: null, // 🔥 Quando il file viene elaborato, aggiorniamo questo valore
    };

    const docRef = await admin
      .firestore()
      .collection("FinancialReports")
      .add(financialData);

    // ✅ Simuliamo l'elaborazione dopo pochi secondi (reale logica di parsing da aggiungere)
    setTimeout(async () => {
      await admin
        .firestore()
        .collection("FinancialReports")
        .doc(docRef.id)
        .update({
          status: "processed",
          processedAt: new Date(),
        });
      console.log(`✅ File ${file.name} elaborato correttamente.`);
    }, 5000);

    res.json({
      message: "✅ Dati finanziari importati con successo",
      reportId: docRef.id,
      uploadedAt: financialData.uploadedAt.toISOString(),
    });
  } catch (error) {
    logger.error("❌ Errore nell'importazione dei dati:", error);
    res
      .status(500)
      .json({
        error: "Errore nell'importazione dei dati",
        details: error.message,
      });
  }
});

module.exports = router;
