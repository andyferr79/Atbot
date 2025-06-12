// 📁 functions/cleaningReportsRoutes.js – Pulizie IA (Gen 2)

const express = require("express");
const admin = require("firebase-admin");
const { verifyToken } = require("../middlewares/verifyToken");

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();
const router = express.Router();

// ✅ Middleware rate limiting (IP-based, 50 richieste / 10min)
const checkRateLimit = async (req, res, next) => {
  const ip = req.headers["x-forwarded-for"] || req.ip || "unknown_ip";
  const now = Date.now();
  const rateRef = db.collection("RateLimits").doc(`cleaning_${ip}`);
  const doc = await rateRef.get();

  let recentRequests = [];
  if (doc.exists) {
    const timestamps = doc.data().requests || [];
    recentRequests = timestamps.filter((t) => now - t < 10 * 60 * 1000);
    if (recentRequests.length >= 50) {
      return res.status(429).json({ error: "❌ Troppe richieste. Attendi." });
    }
  }

  recentRequests.push(now);
  await rateRef.set({ requests: recentRequests });
  next();
};

// 📥 Log richieste
router.use((req, res, next) => {
  console.log(`[🧽 CleaningReports] ${req.method} ${req.originalUrl}`);
  next();
});

// 🔐 Autenticazione
router.use(verifyToken);

// ✅ GET /cleaning-reports → Lista report pulizie
router.get("/", checkRateLimit, async (req, res) => {
  try {
    const { structureId } = req.query;
    let query = db.collection("CleaningReports");
    if (structureId) query = query.where("structureId", "==", structureId);

    const snapshot = await query.get();
    const reports = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      lastCleaned: doc.data().lastCleaned?.toDate().toISOString() || "N/A",
      createdAt: doc.data().createdAt?.toDate().toISOString() || "N/A",
    }));

    res.status(200).json(reports);
  } catch (error) {
    console.error("❌ getCleaningReports:", error);
    res.status(500).json({ error: "Errore recupero pulizie" });
  }
});

// ✅ POST /cleaning-reports → Nuovo report pulizia
router.post("/", checkRateLimit, async (req, res) => {
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
    res.status(200).json({ id: docRef.id, ...newReport });
  } catch (error) {
    console.error("❌ addCleaningReport:", error);
    res.status(500).json({ error: "Errore creazione report" });
  }
});

// ✅ PUT /cleaning-reports → Aggiorna report
router.put("/", checkRateLimit, async (req, res) => {
  try {
    const { reportId, updates } = req.body;
    if (!reportId || !updates) {
      return res.status(400).json({ error: "❌ reportId e updates richiesti" });
    }

    if (updates.lastCleaned) {
      updates.lastCleaned = new Date(updates.lastCleaned);
    }

    await db.collection("CleaningReports").doc(reportId).update(updates);
    res.status(200).json({ message: "✅ Report aggiornato." });
  } catch (error) {
    console.error("❌ updateCleaningReport:", error);
    res.status(500).json({ error: "Errore aggiornamento report" });
  }
});

// ✅ DELETE /cleaning-reports → Elimina report
router.delete("/", checkRateLimit, async (req, res) => {
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
