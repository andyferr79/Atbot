// 📁 functions/marketingAssistant.js

const admin = require("firebase-admin");
const { onRequest } = require("firebase-functions/v1").https;
const { trackIAUsage } = require("./usageTracker");
const { sendNotification } = require("./lib/sendNotification");
const db = admin.firestore();

// ✅ POST /agent/marketing/analyzePresence
exports.analyzePresence = onRequest(async (req, res) => {
  if (req.method !== "POST") return res.status(405).send("Usa POST");

  try {
    const body = req.body || req.rawBody.toString();
    const data = typeof body === "string" ? JSON.parse(body) : body;
    const { userId, structureName, links = [] } = data;

    if (!userId || !structureName) {
      return res
        .status(400)
        .json({ error: "❌ userId e structureName obbligatori" });
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

    res
      .status(200)
      .json({ message: "✅ Analisi marketing completata", feedback });
  } catch (err) {
    console.error("❌ Errore analyzePresence:", err);
    res.status(500).json({ error: "Errore analisi marketing IA" });
  }
});
