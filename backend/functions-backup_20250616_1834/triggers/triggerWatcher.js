// ✅ FILE: functions/triggers/triggerWatcher.js

const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { HttpsError } = require("firebase-functions/v1/https");

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// ✅ TRIGGER AUTOMATICO GIORNALIERO
exports.dailyAgentTrigger = functions.pubsub
  .schedule("every day 05:00")
  .timeZone("Europe/Rome")
  .onRun(async (context) => {
    const snapshot = await db.collection("users").get();
    const users = snapshot.docs;

    console.log(`📊 Trovati ${users.length} utenti da processare`);

    for (const userDoc of users) {
      const userId = userDoc.id;
      try {
        await triggerAllAutomationsForUser(userId);
        console.log(`✅ Trigger completato per: ${userId}`);
      } catch (e) {
        console.error(`❌ Errore per utente ${userId}:`, e.message);
      }
    }

    return null;
  });

// ✅ Attiva tutti gli agenti IA rilevanti per un utente
async function triggerAllAutomationsForUser(userId) {
  const baseUrl = "http://127.0.0.1:8000/agent/dispatch"; // Cambia con URL produzione se serve
  const fetch = require("node-fetch");

  const intentsToTrigger = [
    {
      intent: "pricing",
      context: {
        property_id: "default",
        current_price: 150,
        occupancy_rate: 0.8,
        competitor_prices: [140, 160, 155],
        seasonality_factor: 1.1,
      },
    },
    {
      intent: "report",
      context: {
        session_id: `auto-${userId}`,
        property_id: "default",
        notes: "Report giornaliero automatico",
      },
    },
    { intent: "insight", context: { note: "Analisi giornaliera automatica" } },
    {
      intent: "event",
      context: {
        trigger: "daily_check",
        next_agent: "followup",
        params: { note: "Check routine mattutino" },
      },
    },
    {
      intent: "cleaning",
      context: { checkouts_today: [], checkins_today: [], staff: [] },
    },
  ];

  for (const item of intentsToTrigger) {
    const body = {
      user_id: userId,
      intent: item.intent,
      context: item.context,
    };

    const res = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error(`⚠️ Fallito ${item.intent} per ${userId}:`, error);
    }
  }
}
