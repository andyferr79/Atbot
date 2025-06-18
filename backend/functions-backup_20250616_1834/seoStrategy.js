// 📁 functions/seoStrategy.js
const express = require("express");
const { admin } = require("../firebase");
const { sendNotification } = require("./lib/sendNotification");
const { verifyToken } = require("../middlewares/verifyToken");
const withRateLimit = require("./middlewares/withRateLimit");

const db = admin.firestore();
const router = express.Router();

// 🔐 Sicurezza middleware
router.use(verifyToken);
router.use(withRateLimit(10, 60 * 1000)); // Max 10 al minuto

// 📌 POST /seo-strategy → Genera strategia SEO personalizzata
router.post("/", async (req, res) => {
  try {
    const { websiteUrl, businessType = "hotel" } = req.body;
    const userId = req.userId;

    if (!userId || !websiteUrl) {
      return res
        .status(400)
        .json({ error: "❌ websiteUrl e userId richiesti" });
    }

    const now = new Date();
    const actionRef = db
      .collection("ai_agent_hub")
      .doc(userId)
      .collection("actions")
      .doc();

    const recommendations = [
      "Aggiorna il tag <title> con parole chiave locali.",
      "Aggiungi recensioni recenti sul sito.",
      "Verifica presenza nella Google Search Console.",
      "Ottimizza la velocità di caricamento (GTMetrix consigliato).",
      "Utilizza schema.org per Hotel su homepage.",
    ];

    const action = {
      actionId: actionRef.id,
      type: "seo_strategy",
      status: "completed",
      startedAt: now,
      context: { websiteUrl, businessType },
      output: {
        websiteUrl,
        recommendations,
      },
      priority: "normal",
    };

    await actionRef.set(action);

    await sendNotification({
      userId,
      title: "Analisi SEO completata",
      description: `Sono disponibili ${recommendations.length} suggerimenti per ${websiteUrl}`,
      type: "ai",
    });

    return res.status(200).json({
      message: "✅ Strategia SEO generata",
      actionId: actionRef.id,
      recommendations,
    });
  } catch (err) {
    console.error("❌ Errore seoStrategyHandler:", err);
    return res.status(500).json({ error: "Errore generazione strategia SEO" });
  }
});

module.exports = router;
