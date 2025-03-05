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

// 📌 API per ottenere tutte le notifiche dell'utente
router.get("/", limiter, verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const db = admin.firestore();
    const snapshot = await db
      .collection("Notifications")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    if (snapshot.empty) {
      return res.json({ notifications: [] });
    }

    let notifications = snapshot.docs.map((doc) => ({
      id: doc.id,
      type: doc.data().type || "general",
      message: doc.data().message || "Nessun messaggio",
      createdAt: doc.data().createdAt
        ? doc.data().createdAt.toDate().toISOString()
        : "N/A",
      status: doc.data().status || "unread",
    }));

    res.json({ notifications });
  } catch (error) {
    logger.error("❌ Errore nel recupero delle notifiche:", error);
    res.status(500).json({
      error: "Errore nel recupero delle notifiche",
      details: error.message,
    });
  }
});

// 📌 API per ottenere il numero di notifiche non lette
router.get("/unread-count", limiter, verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const db = admin.firestore();
    const snapshot = await db
      .collection("Notifications")
      .where("userId", "==", userId)
      .where("status", "==", "unread")
      .get();

    res.json({ count: snapshot.size });
  } catch (error) {
    logger.error(
      "❌ Errore nel recupero del numero di notifiche non lette:",
      error
    );
    res.status(500).json({
      error: "Errore nel recupero del numero di notifiche non lette",
      details: error.message,
    });
  }
});

// 📌 API per ottenere il numero di comunicazioni ufficiali non lette
router.get(
  "/announcements/unread-count",
  limiter,
  verifyToken,
  async (req, res) => {
    try {
      const userId = req.user.uid;
      const db = admin.firestore();
      const snapshot = await db
        .collection("Announcements")
        .where("userId", "==", userId)
        .where("status", "==", "unread")
        .get();

      res.json({ count: snapshot.size });
    } catch (error) {
      logger.error(
        "❌ Errore nel recupero delle comunicazioni ufficiali non lette:",
        error
      );
      res.status(500).json({
        error: "Errore nel recupero delle comunicazioni ufficiali non lette",
        details: error.message,
      });
    }
  }
);

// 📌 API per contrassegnare una notifica come letta
router.put("/read/:id", limiter, verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const db = admin.firestore();
    await db.collection("Notifications").doc(id).update({ status: "read" });
    res.json({ message: "✅ Notifica contrassegnata come letta", id });
  } catch (error) {
    logger.error("❌ Errore nell'aggiornamento della notifica:", error);
    res.status(500).json({
      error: "Errore nell'aggiornamento della notifica",
      details: error.message,
    });
  }
});

// 📌 API per contrassegnare tutte le notifiche come lette
router.put("/read-all", limiter, verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const db = admin.firestore();
    const snapshot = await db
      .collection("Notifications")
      .where("userId", "==", userId)
      .where("status", "==", "unread")
      .get();

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { status: "read" });
    });

    await batch.commit();
    res.json({ message: "✅ Tutte le notifiche contrassegnate come lette" });
  } catch (error) {
    logger.error("❌ Errore nell'aggiornamento delle notifiche:", error);
    res.status(500).json({
      error: "Errore nell'aggiornamento delle notifiche",
      details: error.message,
    });
  }
});

module.exports = router;
