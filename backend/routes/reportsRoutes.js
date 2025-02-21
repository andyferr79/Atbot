const express = require("express");
const router = express.Router();
const admin = require("../firebase"); // Connessione a Firestore

// 📌 API per ottenere i dati della reportistica
router.get("/", async (req, res) => {
  try {
    const db = admin.firestore();
    const reportsSnapshot = await db.collection("Reports").get();

    if (reportsSnapshot.empty) {
      return res.json({ reports: [] });
    }

    let reports = [];

    reportsSnapshot.forEach((doc) => {
      const report = doc.data();
      reports.push({
        id: doc.id,
        type: report.type || "general",
        title: report.title || "Nessun titolo",
        createdAt: report.createdAt || "N/A",
        data: report.data || {},
      });
    });

    res.json({ reports });
  } catch (error) {
    console.error("❌ Errore nel recupero dei report:", error);
    res.status(500).json({ error: "Errore nel recupero dei report" });
  }
});

// 📌 API per generare un report personalizzato
router.post("/generate", async (req, res) => {
  try {
    const { title, type, data } = req.body;
    if (!title || !type || !data) {
      return res
        .status(400)
        .json({ error: "❌ Tutti i campi sono obbligatori." });
    }

    const db = admin.firestore();
    const newReport = {
      title,
      type,
      data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const docRef = await db.collection("Reports").add(newReport);

    res.json({ message: "✅ Report generato con successo", id: docRef.id });
  } catch (error) {
    console.error("❌ Errore nella generazione del report:", error);
    res.status(500).json({ error: "Errore nella generazione del report" });
  }
});

module.exports = router;
