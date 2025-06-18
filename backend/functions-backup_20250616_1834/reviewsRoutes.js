// 📁 functions/reviewsRoutes.js
const express = require("express");
const { admin } = require("../firebase");
const { verifyToken } = require("../middlewares/verifyToken");
const withRateLimit = require("./middlewares/withRateLimit");

const db = admin.firestore();
const router = express.Router();

// 🔐 Middleware
router.use(verifyToken);
router.use(withRateLimit(50, 10 * 60 * 1000)); // Max 50 richieste ogni 10 min

// 📌 GET /reviews → Recupera tutte le recensioni
router.get("/", async (req, res) => {
  try {
    const snapshot = await db.collection("Reviews").get();
    let totalRating = 0;

    const reviews = snapshot.docs.map((doc) => {
      const data = doc.data();
      totalRating += data.rating || 0;
      return {
        id: doc.id,
        guestName: data.guestName || "Anonimo",
        rating: data.rating || 0,
        comment: data.comment || "",
        date: data.date?.toDate().toISOString() || "N/A",
        source: data.source || "Diretto",
      };
    });

    const averageRating = reviews.length
      ? (totalRating / reviews.length).toFixed(2)
      : "0.00";

    res.json({ averageRating, reviews });
  } catch (error) {
    console.error("❌ Errore GET /reviews:", error);
    res.status(500).json({ error: "Errore nel recupero recensioni." });
  }
});

// 📌 POST /reviews → Aggiungi nuova recensione
router.post("/", async (req, res) => {
  try {
    const { guestName, rating, comment, source } = req.body;

    if (!rating || isNaN(rating) || rating < 0 || rating > 5) {
      return res.status(400).json({ error: "❌ Rating non valido (0-5)." });
    }

    const newReview = {
      guestName: guestName || "Anonimo",
      rating: parseFloat(rating),
      comment: comment?.slice(0, 500) || "",
      source: source || "Diretto",
      date: new Date(),
    };

    const docRef = await db.collection("Reviews").add(newReview);
    res.status(201).json({ id: docRef.id, ...newReview });
  } catch (error) {
    console.error("❌ Errore POST /reviews:", error);
    res.status(500).json({ error: "Errore nell'aggiunta della recensione." });
  }
});

// 📌 PUT /reviews/:id → Aggiorna una recensione
router.put("/:id", async (req, res) => {
  try {
    const updates = req.body;
    const reviewId = req.params.id;

    if (!updates || !reviewId) {
      return res.status(400).json({ error: "❌ Dati mancanti." });
    }

    await db.collection("Reviews").doc(reviewId).update(updates);
    res.json({ message: "✅ Recensione aggiornata." });
  } catch (error) {
    console.error("❌ Errore PUT /reviews/:id:", error);
    res.status(500).json({ error: "Errore nell’aggiornamento recensione." });
  }
});

// 📌 DELETE /reviews/:id → Elimina recensione
router.delete("/:id", async (req, res) => {
  try {
    const reviewId = req.params.id;

    if (!reviewId) {
      return res.status(400).json({ error: "❌ ID recensione richiesto." });
    }

    await db.collection("Reviews").doc(reviewId).delete();
    res.json({ message: "✅ Recensione eliminata." });
  } catch (error) {
    console.error("❌ Errore DELETE /reviews/:id:", error);
    res.status(500).json({ error: "Errore nella cancellazione recensione." });
  }
});

module.exports = router;
