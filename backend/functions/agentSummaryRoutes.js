// ✅ functions/agentSummaryRoutes.js – Versione stabile e pronta al deploy
const express = require("express");
const admin = require("firebase-admin");
const { verifyToken } = require("./middlewares/verifyToken");
const { withCors } = require("./middlewares/withCors");

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

const router = express.Router();

// ✅ Middleware
router.use(withCors);
router.use(verifyToken);
router.use((req, res, next) => {
  console.log(`📊 [GET] /agent-summary – UID: ${req.user.uid}`);
  next();
});

// 📌 GET /agent-summary → Riepilogo IA per l’utente
router.get("/", async (req, res) => {
  try {
    const userId = req.user.uid;
    const today = new Date().toISOString().split("T")[0];

    // ✅ Azioni completate oggi
    const actionsSnap = await db
      .collection("ai_agent_hub")
      .doc(userId)
      .collection("actions")
      .where("status", "==", "completed")
      .get();

    const todayActions = actionsSnap.docs.filter((doc) => {
      const startedAt = doc.data().startedAt?.toDate();
      return startedAt?.toISOString().split("T")[0] === today;
    }).length;

    // ✅ Documenti generati oggi
    const docsSnap = await db
      .collection("ai_agent_hub")
      .doc(userId)
      .collection("documents")
      .get();

    const documentsGenerated = docsSnap.docs.filter((doc) => {
      const createdAt = doc.data().createdAt?.toDate();
      return createdAt?.toISOString().split("T")[0] === today;
    }).length;

    // ✅ Notifiche non lette
    const notifSnap = await db
      .collection("notifications")
      .doc(userId)
      .collection("list")
      .where("read", "==", false)
      .get();

    const notificationsUnread = notifSnap.size;

    // ✅ Ultimo modello IA usato
    const lastModelSnap = await db
      .collection("ia_usage")
      .doc(userId)
      .collection("history")
      .orderBy("timestamp", "desc")
      .limit(1)
      .get();

    const lastModelUsed = lastModelSnap.empty
      ? null
      : lastModelSnap.docs[0].data().model;

    return res.status(200).json({
      todayActions,
      documentsGenerated,
      notificationsUnread,
      lastModelUsed,
    });
  } catch (err) {
    console.error("❌ [agentSummary] Errore:", err);
    return res.status(500).json({ error: "Errore riepilogo IA" });
  }
});

module.exports = router;
