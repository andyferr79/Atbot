// 📁 functions/reportsRoutes.js
const express = require("express");
const { admin } = require("./firebase");
const { verifyToken } = require("./middlewares/verifyToken");
const withRateLimit = require("./middlewares/withRateLimit");

const db = admin.firestore();
const router = express.Router();

// 🔐 Middleware
router.use(verifyToken);
router.use(withRateLimit(60, 10 * 60 * 1000)); // Max 60 ogni 10 minuti

// 📌 GET /reports → Tutti i report dell’utente
router.get("/", async (req, res) => {
  try {
    const snapshot = await db
      .collection("Reports")
      .where("userId", "==", req.userId)
      .get();

    const reports = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString() || null,
      updatedAt: doc.data().updatedAt?.toDate().toISOString() || null,
    }));

    res.json({ reports });
  } catch (error) {
    console.error("❌ Errore getReports:", error);
    res.status(500).json({ error: "Errore nel recupero dei report." });
  }
});

// 📌 POST /reports → Crea nuovo report
router.post("/", async (req, res) => {
  try {
    const { title, type, data } = req.body;
    if (!title || !type || !data) {
      return res.status(400).json({ error: "❌ Campi obbligatori mancanti." });
    }

    const newReport = {
      title,
      type,
      data,
      userId: req.userId,
      createdAt: new Date(),
    };

    const docRef = await db.collection("Reports").add(newReport);
    res.status(201).json({ id: docRef.id, ...newReport });
  } catch (error) {
    console.error("❌ Errore createReport:", error);
    res.status(500).json({ error: "Errore nella creazione del report." });
  }
});

// 📌 PUT /reports/:id → Aggiorna report
router.put("/:id", async (req, res) => {
  try {
    const updates = req.body;
    const docRef = db.collection("Reports").doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists || doc.data().userId !== req.userId) {
      return res.status(404).json({ error: "❌ Report non trovato." });
    }

    await docRef.update({
      ...updates,
      updatedAt: new Date(),
    });

    res.json({ message: "✅ Report aggiornato." });
  } catch (error) {
    console.error("❌ Errore updateReport:", error);
    res.status(500).json({ error: "Errore nell’aggiornamento." });
  }
});

// 📌 DELETE /reports/:id → Elimina report
router.delete("/:id", async (req, res) => {
  try {
    const docRef = db.collection("Reports").doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists || doc.data().userId !== req.userId) {
      return res.status(404).json({ error: "❌ Report non trovato." });
    }

    await docRef.delete();
    res.json({ message: "✅ Report eliminato." });
  } catch (error) {
    console.error("❌ Errore deleteReport:", error);
    res.status(500).json({ error: "Errore nella cancellazione." });
  }
});

module.exports = router;
