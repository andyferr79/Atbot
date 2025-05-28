// ✅ FILE: schedulers/dailyAgentTrigger.js

const { logger } = require("firebase-functions");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

/**
 * 🔁 Funzione Cloud pianificata: Esegue tutti i task IA giornalieri per ogni utente
 */
exports.dailyAgentTrigger = onSchedule("every day 05:00", async () => {
  logger.info("⏰ Trigger giornaliero IA avviato");

  const snapshot = await db.collection("users").get();

  const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  logger.info(`👥 Trovati ${users.length} utenti`);

  const timestamp = admin.firestore.Timestamp.now();

  const batch = db.batch();

  for (const user of users) {
    const taskRef = db
      .collection("ai_agent_hub")
      .doc(user.id)
      .collection("automated_tasks")
      .doc();

    batch.set(taskRef, {
      taskType: "daily_check",
      status: "pending",
      triggeredBy: "scheduled",
      createdAt: timestamp,
      scheduledFor: "05:00",
    });

    logger.info(`✅ Task creato per utente: ${user.id}`);
  }

  await batch.commit();
  logger.info("🎉 Trigger giornaliero completato con successo.");
});
