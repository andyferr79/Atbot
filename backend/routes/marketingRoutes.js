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

// ==============================
// 📌 GESTIONE POST SOCIAL
// ==============================

// ✅ Recupera tutti i post social
router.get("/social/posts", limiter, verifyToken, async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection("SocialPosts").get();
    const posts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt
        ? doc.data().createdAt.toDate().toISOString()
        : "N/A",
    }));
    res.json(posts);
  } catch (error) {
    logger.error("❌ Errore nel recupero dei post social:", error);
    res
      .status(500)
      .json({
        message: "Errore nel recupero dei post social",
        details: error.message,
      });
  }
});

// ✅ Aggiunge un nuovo post social
router.post("/social/posts", limiter, verifyToken, async (req, res) => {
  try {
    const newPost = {
      ...req.body,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const docRef = await admin
      .firestore()
      .collection("SocialPosts")
      .add(newPost);
    res.json({ id: docRef.id, ...newPost });
  } catch (error) {
    logger.error("❌ Errore nell'aggiunta del post social:", error);
    res
      .status(500)
      .json({
        message: "Errore nell'aggiunta del post social",
        details: error.message,
      });
  }
});

// ==============================
// 📌 GESTIONE CAMPAGNE MARKETING
// ==============================

// ✅ Recupera tutte le campagne marketing
router.get("/campaigns", limiter, verifyToken, async (req, res) => {
  try {
    const snapshot = await admin
      .firestore()
      .collection("MarketingCampaigns")
      .get();
    const campaigns = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt
        ? doc.data().createdAt.toDate().toISOString()
        : "N/A",
    }));
    res.json(campaigns);
  } catch (error) {
    logger.error("❌ Errore nel recupero delle campagne marketing:", error);
    res
      .status(500)
      .json({
        message: "Errore nel recupero delle campagne marketing",
        details: error.message,
      });
  }
});

// ✅ Aggiunge una nuova campagna marketing
router.post("/campaigns", limiter, verifyToken, async (req, res) => {
  try {
    const { userId, platforms, budget, targetAudience, goal } = req.body;

    if (!userId || !platforms || !budget || !targetAudience || !goal) {
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

    const newCampaign = {
      userId,
      platforms,
      budget: parsedBudget,
      targetAudience,
      goal,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await admin
      .firestore()
      .collection("MarketingCampaigns")
      .add(newCampaign);
    res.json({
      message: "✅ Campagna marketing creata con successo",
      id: docRef.id,
    });
  } catch (error) {
    logger.error("❌ Errore nella creazione della campagna marketing:", error);
    res
      .status(500)
      .json({
        message: "Errore nella creazione della campagna marketing",
        details: error.message,
      });
  }
});

module.exports = router;
