// 📁 functions/seoStrategy.js
const admin = require("firebase-admin");
const { sendNotification } = require("./lib/sendNotification");

const db = admin.firestore();

async function seoStrategyHandler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "❌ Usa POST." });
  }

  try {
    const body = req.body || req.rawBody.toString();
    const data = typeof body === "string" ? JSON.parse(body) : body;
    const { userId, websiteUrl, businessType = "hotel" } = data;

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
}

module.exports = { seoStrategyHandler };
