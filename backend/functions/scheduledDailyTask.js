// 📁 functions/scheduledDailyTask.js

const admin = require("firebase-admin");
const moment = require("moment-timezone");
const db = admin.firestore();
const { sendNotification } = require("./lib/sendNotification");

async function runSchedulerNowHandler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "❌ Usa POST" });
  }

  try {
    const usersSnapshot = await db.collection("users").get();
    const now = new Date();

    for (const doc of usersSnapshot.docs) {
      const user = doc.data();
      const userId = doc.id;
      const timezone = user.timezone || "Europe/Rome"; // fallback 🇮🇹

      const userHour = moment.tz(now, timezone).hour();

      if (userHour === 5) {
        console.log(`⏰ Esecuzione automatica per ${userId} (${timezone})`);

        await db
          .collection("ai_agent_hub")
          .doc(userId)
          .collection("actions")
          .add({
            type: "auto_daily_check",
            status: "completed",
            startedAt: now,
            context: { source: "daily_scheduler" },
            output: { message: "Azione schedulata automatica alle 5:00" },
            priority: "normal",
          });

        await sendNotification({
          userId,
          title: "Azione Giornaliera IA",
          description: "L’agente ha eseguito le azioni pianificate per oggi.",
          type: "ai",
        });
      }
    }

    res.status(200).json({
      message: "✅ Scheduler IA eseguito per gli utenti attivi alle 5:00",
    });
  } catch (err) {
    console.error("❌ Errore runSchedulerNowHandler:", err);
    res.status(500).json({ error: "Errore esecuzione scheduler IA" });
  }
}

module.exports = { runSchedulerNowHandler };
