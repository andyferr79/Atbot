// 📁 functions/aiReminders.js
const admin = require("firebase-admin");
const { sendNotification } = require("./lib/sendNotification");

const db = admin.firestore();

async function sendAutoReminders() {
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  const usersSnap = await db.collection("Users").get();

  for (const userDoc of usersSnap.docs) {
    const userId = userDoc.id;
    const userData = userDoc.data();

    let actionsGenerated = 0;
    const userTimezone = userData.timezone || "Europe/Rome";

    // 1️⃣ Reminder post-checkout → prenotazioni con checkout ieri
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

    // 2️⃣ Servizi in scadenza (es. automazioni, abbonamenti)
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
        description: `Hai ${automationsSnap.size} automazioni o attività non completate in scadenza.`,
        type: "ai",
      });

      actionsGenerated += automationsSnap.size;
    }

    // 3️⃣ Utente inattivo da oltre 14 giorni
    const lastLogin = userData.lastLoginAt
      ? new Date(userData.lastLoginAt)
      : null;

    if (lastLogin) {
      const diffDays = Math.floor((now - lastLogin) / (1000 * 60 * 60 * 24));
      if (diffDays > 14) {
        await sendNotification({
          userId,
          title: "Bentornato su StayPro",
          description: `Non accedi da ${diffDays} giorni. Vuoi un riepilogo automatico delle attività?`,
          type: "ai",
        });

        actionsGenerated++;
      }
    }

    // 🧠 Log su Firestore
    await db.collection("logs_scheduler").add({
      userId,
      type: "auto_reminder",
      timestamp: new Date(),
      timezone: userTimezone,
      generatedActions: actionsGenerated,
    });
  }

  console.log("✅ Promemoria IA inviati");
}

module.exports = { sendAutoReminders };
