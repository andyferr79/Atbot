// 📁 functions/cleaningReportsRoutes.js – Pulizie IA (Gen 2)

const express = require("express");
const { admin } = require("../firebase");
const { verifyToken } = require("../middlewares/verifyToken");
const withRateLimit = require("../middlewares/withRateLimit");

const db = admin.firestore();
const router = express.Router();

// 📥 Log richieste
router.use((req, res, next) => {
  console.log(`[🧽 CleaningReports] ${req.method} ${req.originalUrl}`);
  next();
});

// 🔐 Autenticazione + Limite globale
router.use(verifyToken);
router.use(withRateLimit(50, 10 * 60 * 1000)); // 50 richieste / 10 min

// 📌 GET /cleaning-reports → Lista report pulizie
router.get("/", async (req, res) => {
  try {
    const { structureId } = req.query;
    let query = db.collection("CleaningReports");
    if (structureId) {
      query = query.where("structureId", "==", structureId);
    }

    const snapshot = await query.get();
    const reports = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        lastCleaned: data.lastCleaned?.toDate?.().toISOString() || null,
        createdAt: data.createdAt?.toDate?.().toISOString() || null,
      };
    });

    res.status(200).json(reports);
  } catch (error) {
    console.error("❌ getCleaningReports:", error);
    res.status(500).json({ error: "Errore recupero pulizie" });
  }
});

// 📌 POST /cleaning-reports → Nuovo report pulizia
router.post("/", async (req, res) => {
  try {
    const {
      structureId,
      structureType,
      roomNumber,
      address,
      status,
      lastCleaned,
      assignedTo,
    } = req.body;

    if (
      !structureId ||
      !structureType ||
      !roomNumber ||
      !status ||
      !lastCleaned ||
      !assignedTo
    ) {
      return res.status(400).json({ error: "❌ Campi obbligatori mancanti" });
    }

    const newReport = {
      structureId,
      structureType,
      roomNumber,
      address: ["villa", "appartamento"].includes(structureType)
        ? address
        : null,
      status,
      lastCleaned: new Date(lastCleaned),
      assignedTo,
      createdAt: new Date(),
    };

    const docRef = await db.collection("CleaningReports").add(newReport);
    res.status(201).json({ id: docRef.id, ...newReport });
  } catch (error) {
    console.error("❌ addCleaningReport:", error);
    res.status(500).json({ error: "Errore creazione report" });
  }
});

// 📌 PUT /cleaning-reports → Aggiorna report
router.put("/", async (req, res) => {
  try {
    const { reportId, updates } = req.body;

    if (!reportId || !updates || typeof updates !== "object") {
      return res.status(400).json({ error: "❌ reportId e updates richiesti" });
    }

    if (updates.lastCleaned) {
      updates.lastCleaned = new Date(updates.lastCleaned);
    }

    updates.updatedAt = new Date();

    await db.collection("CleaningReports").doc(reportId).update(updates);
    res.status(200).json({ message: "✅ Report aggiornato." });
  } catch (error) {
    console.error("❌ updateCleaningReport:", error);
    res.status(500).json({ error: "Errore aggiornamento report" });
  }
});

// 📌 DELETE /cleaning-reports → Elimina report
router.delete("/", async (req, res) => {
  try {
    const { reportId } = req.query;

    if (!reportId) {
      return res.status(400).json({ error: "❌ reportId richiesto." });
    }

    await db.collection("CleaningReports").doc(reportId).delete();
    res.status(200).json({ message: "✅ Report cancellato." });
  } catch (error) {
    console.error("❌ deleteCleaningReport:", error);
    res.status(500).json({ error: "Errore eliminazione report" });
  }
});

module.exports = router;
