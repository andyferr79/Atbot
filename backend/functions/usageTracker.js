// 📁 functions/usageTracker.js

const { admin } = require("../firebase"); // ✅ percorso corretto
const db = admin.firestore();

async function trackIAUsage({ userId, type, model = "gpt-3.5" }) {
  if (!userId || !type) return;

  const ref = db.collection("ai_usage_stats").doc(userId);
  const statDoc = await ref.get();
  const now = new Date();

  const data = statDoc.exists
    ? statDoc.data()
    : {
        actions: {},
        chatMessages: 0,
        lastUsed: now,
        modelsUsed: [],
      };

  if (type === "chat") {
    data.chatMessages = (data.chatMessages || 0) + 1;
  } else {
    data.actions[type] = (data.actions[type] || 0) + 1;
  }

  data.lastUsed = now;
  if (!data.modelsUsed.includes(model)) {
    data.modelsUsed.push(model);
  }

  await ref.set(data, { merge: true });
}

module.exports = { trackIAUsage };
