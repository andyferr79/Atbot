const express = require("express");
const router = express.Router();
const admin = require("../firebase");

// ✅ Recupera tutti i report di marketing
router.get("/", async (req, res) => {
  try {
    const snapshot = await admin
      .firestore()
      .collection("MarketingReports")
      .get();
    const reports = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(reports);
  } catch (error) {
    console.error("❌ Errore nel recupero dei dati di marketing:", error);
    res
      .status(500)
      .json({ error: "Errore nel recupero dei dati di marketing" });
  }
});

// ✅ Aggiunge un nuovo report di marketing
router.post("/add", async (req, res) => {
  try {
    const { name, channel, budget, conversions } = req.body;
    if (!name || !channel || !budget || !conversions) {
      return res.status(400).json({ error: "Tutti i campi sono obbligatori" });
    }

    const newReport = {
      name,
      channel,
      budget: parseFloat(budget),
      conversions: parseInt(conversions),
      createdAt: new Date(),
    };

    const docRef = await admin
      .firestore()
      .collection("MarketingReports")
      .add(newReport);
    res.json({ id: docRef.id, ...newReport });
  } catch (error) {
    console.error("❌ Errore nell'aggiunta del report di marketing:", error);
    res
      .status(500)
      .json({ error: "Errore nell'aggiunta del report di marketing" });
  }
});

module.exports = router;
