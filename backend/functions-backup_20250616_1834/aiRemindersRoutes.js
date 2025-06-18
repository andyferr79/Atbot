// 📁 functions/aiRemindersRoutes.js – Gen 2 + Sicurezza + Logging

const express = require("express");
const admin = require("firebase-admin");
const rateLimit = require("express-rate-limit");
const { verifyToken } = require("../middlewares/verifyToken");
const { sendNotification } = require("./lib/sendNotification");

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

const router = express.Router();

// 🔐 Protezione trigger esterno
router.use(verifyToken);

// 📊 Logging + Rate Limiter
router.use((req, res, next) => {
  console.log(
    `📨 [POST] /ai-reminders/send – UID: ${req.user?.uid}, IP: ${req.ip}`
  );
  next();
});

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: "Troppe richieste. Riprova tra un minuto.",
  keyGenerator: (req) => req.user?.uid || req.ip,
});

// ✅ Trigger: Invio promemoria automatici IA
router.post("/send", limiter, async (req, res) => {
  try {
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    const usersSnap = await db.collection("users").get();

    for (const userDoc of usersSnap.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();

      let actionsGenerated = 0;
      const userTimezone = userData.timezone || "Europe/Rome";

      // 1️⃣ Reminder recensione post-checkout
      const bookingsSnap = await db
        .collection("Bookings")
        .where("userId", "==", userId)
        .where("checkoutDate", "==", today)
        .get();

      for (const booking of bookingsSnap.docs) {
        const { clientName = "Cliente" } = booking.data();

        await sendNotification({
          userId,
          title: "Richiesta Recensione",
          description: `Chiedi una recensione a ${clientName} dopo il soggiorno.`,
          type: "ai",
        });

        actionsGenerated++;
      }

      // 2️⃣ Automazioni in scadenza
      const automationsSnap = await db
        .collection("AutomationTasks")
        .where("userId", "==", userId)
        .where("dueDate", "<=", today)
        .where("status", "!=", "completed")
        .get();

      if (!automationsSnap.empty) {
        await sendNotification({
          userId,
          title: "🔔 Servizi in scadenza",
          description: `Hai ${automationsSnap.size} attività in scadenza.`,
          type: "ai",
        });

        actionsGenerated += automationsSnap.size;
      }

      // 3️⃣ Utente inattivo > 14 giorni
      const lastLogin = userData.lastLoginAt
        ? new Date(userData.lastLoginAt)
        : null;
      if (lastLogin) {
        const diffDays = Math.floor((now - lastLogin) / (1000 * 60 * 60 * 24));
        if (diffDays > 14) {
          await sendNotification({
            userId,
            title: "Bentornato su StayPro",
            description: `Non accedi da ${diffDays} giorni. Vuoi un riepilogo IA?`,
            type: "ai",
          });

          actionsGenerated++;
        }
      }

      // 📌 Log Firestore
      await db.collection("logs_scheduler").add({
        userId,
        type: "auto_reminder",
        timestamp: now,
        timezone: userTimezone,
        generatedActions: actionsGenerated,
      });
    }

    console.log("✅ [aiReminders] Tutti i promemoria IA inviati");
    return res.status(200).json({ message: "Promemoria IA inviati" });
  } catch (err) {
    console.error("❌ [aiReminders] Errore:", err);
    return res.status(500).json({ error: "Errore invio promemoria IA" });
  }
});

module.exports = router;
