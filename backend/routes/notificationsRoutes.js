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

// 📌 API per ottenere le notifiche e gli alert
router.get("/", limiter, verifyToken, async (req, res) => {
  try {
    if (!admin.apps.length) {
      throw new Error("Firestore non inizializzato correttamente.");
    }

    const db = admin.firestore();
    const notificationsSnapshot = await db.collection("Notifications").get();

    if (notificationsSnapshot.empty) {
      return res.json({ notifications: [] });
    }

    let notifications = [];

    notificationsSnapshot.forEach((doc) => {
      const notification = doc.data();
      notifications.push({
        id: doc.id,
        type: notification.type || "general",
        message: notification.message || "Nessun messaggio",
        createdAt: notification.createdAt
          ? notification.createdAt.toDate().toISOString()
          : "N/A",
        status: notification.status || "unread",
      });
    });

    res.json({ notifications });
  } catch (error) {
    logger.error("❌ Errore nel recupero delle notifiche:", error);
    res
      .status(500)
      .json({
        error: "Errore nel recupero delle notifiche",
        details: error.message,
      });
  }
});

// 📌 API per contrassegnare una notifica come letta
router.put("/read/:id", limiter, verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const db = admin.firestore();
    await db.collection("Notifications").doc(id).update({ status: "read" });
    res.json({ message: "✅ Notifica contrassegnata come letta", id });
  } catch (error) {
    logger.error("❌ Errore nell'aggiornamento della notifica:", error);
    res
      .status(500)
      .json({
        error: "Errore nell'aggiornamento della notifica",
        details: error.message,
      });
  }
});

module.exports = router;
