const express = require("express");
const router = express.Router();
const admin = require("../firebase"); // Connessione a Firestore

// 📌 API per ottenere tutte le recensioni degli ospiti
router.get("/", async (req, res) => {
  try {
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
        date: review.date || "N/A",
        source: review.source || "Diretto",
      });
    });

    const averageRating = count > 0 ? (totalRating / count).toFixed(2) : 0;

    res.json({ reviews, averageRating });
  } catch (error) {
    console.error("❌ Errore nel recupero delle recensioni:", error);
    res.status(500).json({ error: "Errore nel recupero delle recensioni" });
  }
});

// 📌 API per aggiungere una nuova recensione
router.post("/add", async (req, res) => {
  try {
    const { guestName, rating, comment, source } = req.body;
    if (!rating) {
      return res.status(400).json({ error: "❌ Il punteggio è obbligatorio." });
    }

    const db = admin.firestore();
    const newReview = {
      guestName: guestName || "Anonimo",
      rating,
      comment: comment || "",
      date: new Date().toISOString(),
      source: source || "Diretto",
    };
    const docRef = await db.collection("Reviews").add(newReview);

    res.json({ message: "✅ Recensione aggiunta con successo", id: docRef.id });
  } catch (error) {
    console.error("❌ Errore nell'aggiunta della recensione:", error);
    res.status(500).json({ error: "Errore nell'aggiunta della recensione" });
  }
});

module.exports = router;
