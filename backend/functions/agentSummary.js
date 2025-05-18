// 📁 functions/agentSummary.js

const admin = require("firebase-admin");
const db = admin.firestore();

async function getAgentSummaryHandler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "❌ Usa GET." });
  }

  try {
    // ✅ Verifica token direttamente
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      return res.status(403).json({ error: "❌ Token mancante" });
    }

    const decoded = await admin.auth().verifyIdToken(token);
    const userId = decoded.uid;

    const today = new Date().toISOString().split("T")[0];

    // 1️⃣ Azioni completate oggi
    const actionsSnap = await db
      .collection("ai_agent_hub")
      .doc(userId)
      .collection("actions")
      .where("status", "==", "completed")
      .get();

    const todayActions = actionsSnap.docs.filter((doc) => {
      const date = doc.data().startedAt?.toDate().toISOString().split("T")[0];
      return date === today;
    }).length;

    // 2️⃣ Documenti generati oggi
    const docsSnap = await db
      .collection("ai_agent_hub")
      .doc(userId)
      .collection("documents")
      .get();

    const documentsGenerated = docsSnap.docs.filter((doc) => {
      const date = doc.data().createdAt?.toDate().toISOString().split("T")[0];
      return date === today;
    }).length;

    // 3️⃣ Notifiche non lette
    const notifSnap = await db
      .collection("Notifications")
      .where("userId", "==", userId)
      .where("status", "==", "unread")
      .get();

    const notificationsUnread = notifSnap.size;

    // 4️⃣ Ultimo modello AI usato
    const lastModelSnap = await db
      .collection("ia_usage")
      .doc(userId)
      .collection("history")
      .orderBy("timestamp", "desc")
      .limit(1)
      .get();

    const lastModelUsed = lastModelSnap.empty
      ? null
      : lastModelSnap.docs[0].data().model;

    return res.status(200).json({
      todayActions,
      documentsGenerated,
      notificationsUnread,
      lastModelUsed,
    });
  } catch (err) {
    console.error("❌ Errore getAgentSummaryHandler:", err);
    return res.status(500).json({ error: "Errore recupero riepilogo IA" });
  }
}

module.exports = { getAgentSummaryHandler };
