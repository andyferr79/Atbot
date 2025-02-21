const express = require("express");
const router = express.Router();
const admin = require("../firebase"); // Connessione a Firestore

// 📌 API per ottenere le tariffe attuali delle camere
router.get("/", async (req, res) => {
  try {
    const db = admin.firestore();
    const pricingSnapshot = await db.collection("RoomPricing").get();

    if (pricingSnapshot.empty) {
      return res.json({ prices: [] });
    }

    let prices = [];

    pricingSnapshot.forEach((doc) => {
      const price = doc.data();
      prices.push({
        id: doc.id,
        roomType: price.roomType || "N/A",
        currentPrice: price.currentPrice || 0,
        suggestedPrice: price.suggestedPrice || 0,
        lastUpdated: price.lastUpdated || "N/A",
      });
    });

    res.json({ prices });
  } catch (error) {
    console.error("❌ Errore nel recupero delle tariffe:", error);
    res.status(500).json({ error: "Errore nel recupero delle tariffe" });
  }
});

// 📌 API per aggiornare una tariffa manualmente
router.put("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { newPrice } = req.body;
    if (!newPrice) {
      return res
        .status(400)
        .json({ error: "❌ Il nuovo prezzo è obbligatorio." });
    }

    const db = admin.firestore();
    await db.collection("RoomPricing").doc(id).update({
      currentPrice: newPrice,
      lastUpdated: new Date().toISOString(),
    });

    res.json({ message: "✅ Tariffa aggiornata con successo", id });
  } catch (error) {
    console.error("❌ Errore nell'aggiornamento della tariffa:", error);
    res.status(500).json({ error: "Errore nell'aggiornamento della tariffa" });
  }
});

module.exports = router;
