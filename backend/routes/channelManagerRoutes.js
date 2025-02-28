const express = require("express");
const router = express.Router();
const admin = require("../firebase"); // Connessione a Firestore
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

// 📌 API per ottenere lo stato della sincronizzazione con i portali OTA
router.get("/", limiter, verifyToken, async (req, res) => {
  try {
    if (!admin.apps.length) {
      throw new Error("Firestore non inizializzato correttamente.");
    }

    const db = admin.firestore();
    const channelSyncSnapshot = await db.collection("ChannelManager").get();

    if (channelSyncSnapshot.empty) {
      return res.json({ channels: [] });
    }

    let channels = [];

    channelSyncSnapshot.forEach((doc) => {
      const channel = doc.data();
      channels.push({
        id: doc.id,
        name: channel.name || "N/A",
        status: channel.status || "unknown",
        lastSync: channel.lastSync
          ? channel.lastSync.toDate().toISOString()
          : "N/A",
      });
    });

    res.json({ channels });
  } catch (error) {
    logger.error("❌ Errore nel recupero dei dati del Channel Manager:", error);
    res
      .status(500)
      .json({
        error: "Errore nel recupero dei dati del Channel Manager",
        details: error.message,
      });
  }
});

// 📌 API per sincronizzare manualmente con le OTA
router.post("/sync", limiter, verifyToken, async (req, res) => {
  try {
    const { channelName } = req.body;
    if (!channelName) {
      return res
        .status(400)
        .json({ error: "❌ Il nome del canale è obbligatorio." });
    }

    const db = admin.firestore();
    const newSync = {
      name: channelName,
      status: "syncing",
      lastSync: new Date().toISOString(),
    };
    const docRef = await db.collection("ChannelManager").add(newSync);

    res.json({
      message: "✅ Sincronizzazione avviata con successo",
      id: docRef.id,
    });
  } catch (error) {
    logger.error("❌ Errore nella sincronizzazione con le OTA:", error);
    res
      .status(500)
      .json({
        error: "Errore nella sincronizzazione con le OTA",
        details: error.message,
      });
  }
});

module.exports = router;
