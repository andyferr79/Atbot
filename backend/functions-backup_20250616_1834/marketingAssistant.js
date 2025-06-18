// 📁 functions/marketingAssistant.js

const express = require("express");
const admin = require("firebase-admin");
const { verifyToken } = require("./middlewares/verifyToken");
const withRateLimit = require("./middlewares/withRateLimit");
const { trackIAUsage } = require("./usageTracker");
const { sendNotification } = require("./lib/sendNotification");

const db = admin.firestore();
const router = express.Router();
router.use(express.json());

// 🔐 Middleware
router.use(verifyToken);
router.use(withRateLimit(10, 60 * 1000)); // max 10 richieste al minuto

// 📌 POST /agent/marketing/analyzePresence
router.post("/analyzePresence", async (req, res) => {
  try {
    const userId = req.user.uid;
    const { structureName, links = [] } = req.body || {};

    if (!structureName) {
      return res.status(400).json({ error: "❌ structureName è obbligatorio" });
    }

    // 🔐 Piano GOLD obbligatorio
    const userDoc = await db.collection("users").doc(userId).get();
    const plan = userDoc.data()?.plan || "BASE";
    if (plan !== "GOLD") {
      return res
        .status(403)
        .json({ error: "🔒 Funzione disponibile solo per utenti GOLD" });
    }

    // 🔄 Tracciamento uso IA
    await trackIAUsage({ userId, type: "marketing_analysis", model: "gpt-4" });

    const now = new Date();
    const actionRef = db
      .collection("ai_agent_hub")
      .doc(userId)
      .collection("actions")
      .doc();

    const feedback = `
📊 Analisi Online per ${structureName}:

🔹 Nome brand: ${structureName}
🔹 Link ricevuti: ${links.length}

👉 Suggerimenti IA:
- Inserisci immagini professionali ad alta risoluzione
- Ottimizza la bio su Instagram e Booking
- Aggiungi link a TripAdvisor se mancante
- Migliora la coerenza del nome struttura su tutti i canali

✅ Analisi simulata eseguita da StayPro AI
    `.trim();

    await actionRef.set({
      actionId: actionRef.id,
      type: "marketing_analysis",
      status: "completed",
      startedAt: now,
      context: { structureName, links },
      output: { feedback },
      priority: "normal",
    });

    await sendNotification({
      userId,
      title: `Analisi Marketing completata`,
      description: `L'agente ha analizzato ${structureName} e generato un report online.`,
      type: "ai",
    });

    res.status(200).json({
      message: "✅ Analisi marketing completata",
      feedback,
    });
  } catch (err) {
    console.error("❌ Errore analyzePresence:", err);
    res.status(500).json({ error: "Errore analisi marketing IA" });
  }
});

module.exports = router;
