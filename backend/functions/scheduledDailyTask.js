// 📁 functions/scheduledDailyTask.js
const express = require("express");
const moment = require("moment-timezone");
const { admin } = require("./firebase");
const { verifyToken } = require("../middlewares/verifyToken");
const withRateLimit = require("../middlewares/withRateLimit");
const { sendNotification } = require("./lib/sendNotification");

const db = admin.firestore();
const router = express.Router();

// 🔐 Middleware per sicurezza
router.use(verifyToken);
router.use(withRateLimit(10, 60 * 1000)); // Max 10 al minuto

// 📌 POST /scheduler/run-now → triggera scheduler giornaliero IA
router.post("/run-now", async (req, res) => {
  try {
    const now = new Date();
    const usersSnapshot = await db.collection("users").get();

    for (const doc of usersSnapshot.docs) {
      const user = doc.data();
      const userId = doc.id;
      const timezone = user.timezone || "Europe/Rome";

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
  } catch (error) {
    console.error("❌ Errore runSchedulerNowHandler:", error);
    res.status(500).json({ error: "Errore esecuzione scheduler IA" });
  }
});

module.exports = router;
