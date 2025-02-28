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

// 📌 API per ottenere tutte le recensioni degli ospiti
router.get("/", limiter, verifyToken, async (req, res) => {
  try {
    if (!admin.apps.length) {
      throw new Error("Firestore non inizializzato correttamente.");
    }

    const db = admin.firestore();
    const reviewsSnapshot = await db.collection("Reviews").get();

    if (reviewsSnapshot.empty) {
      return res.json({ reviews: [], averageRating: 0 });
    }

    let reviews = [];
    let totalRating = 0;
    let count = 0;

    reviewsSnapshot.forEach((doc) => {
      const review = doc.data();
      totalRating += review.rating || 0;
      count++;

      reviews.push({
        id: doc.id,
        guestName: review.guestName || "Anonimo",
        rating: review.rating || 0,
        comment: review.comment || "",
        date: review.date ? review.date.toDate().toISOString() : "N/A",
        source: review.source || "Diretto",
      });
    });

    const averageRating = count > 0 ? (totalRating / count).toFixed(2) : 0;

    res.json({ reviews, averageRating });
  } catch (error) {
    logger.error("❌ Errore nel recupero delle recensioni:", error);
    res
      .status(500)
      .json({
        error: "Errore nel recupero delle recensioni",
        details: error.message,
      });
  }
});

// 📌 API per aggiungere una nuova recensione
router.post("/add", limiter, verifyToken, async (req, res) => {
  try {
    const { guestName, rating, comment, source } = req.body;

    if (!rating || isNaN(rating) || rating < 0 || rating > 5) {
      return res
        .status(400)
        .json({ error: "❌ Il punteggio deve essere un numero tra 0 e 5." });
    }

    if (comment && comment.length > 500) {
      return res
        .status(400)
        .json({ error: "❌ Il commento non può superare i 500 caratteri." });
    }

    const db = admin.firestore();
    const newReview = {
      guestName: guestName || "Anonimo",
      rating: parseFloat(rating),
      comment: comment || "",
      date: new Date(),
      source: source || "Diretto",
    };

    const docRef = await db.collection("Reviews").add(newReview);
    res.json({
      message: "✅ Recensione aggiunta con successo",
      id: docRef.id,
      date: newReview.date.toISOString(),
    });
  } catch (error) {
    logger.error("❌ Errore nell'aggiunta della recensione:", error);
    res
      .status(500)
      .json({
        error: "Errore nell'aggiunta della recensione",
        details: error.message,
      });
  }
});

module.exports = router;
