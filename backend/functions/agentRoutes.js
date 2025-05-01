// 📁 functions/agentRoutes.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { onRequest } = functions.https;

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

// ✅ Recupera tutte le azioni dell'agente IA
exports.getAgentActions = onRequest(async (req, res) => {
  const userId = req.path.split("/").pop();
  if (req.method !== "GET") return res.status(405).send("Method Not Allowed");

  try {
    const snapshot = await db
      .collection("ai_agent_hub")
      .doc(userId)
      .collection("actions")
      .orderBy("startedAt", "desc")
      .get();

    const actions = snapshot.docs.map((doc) => doc.data());
    return res.status(200).json(actions);
  } catch (err) {
    console.error("❌ Errore getAgentActions:", err);
    return res.status(500).json({ error: "Errore recupero azioni IA" });
  }
});

// ✅ Elimina una singola azione
exports.deleteAgentAction = onRequest(async (req, res) => {
  const [userId, actionId] = req.path.split("/").slice(-2);
  if (req.method !== "DELETE")
    return res.status(405).send("Method Not Allowed");

  try {
    await db
      .collection("ai_agent_hub")
      .doc(userId)
      .collection("actions")
      .doc(actionId)
      .delete();

    return res.status(200).json({ message: "✅ Azione eliminata" });
  } catch (err) {
    console.error("❌ Errore deleteAgentAction:", err);
    return res.status(500).json({ error: "Errore eliminazione azione" });
  }
});

// ✅ Aggiorna una azione (status/output)
exports.updateAgentAction = onRequest(async (req, res) => {
  const [userId, actionId] = req.path.split("/").slice(-2);
  if (req.method !== "PATCH") return res.status(405).send("Method Not Allowed");

  try {
    const body = req.body || req.rawBody.toString();
    const data = typeof body === "string" ? JSON.parse(body) : body;

    const updates = {};
    if (data.status) updates.status = data.status;
    if (data.output) updates.output = data.output;

    const actionRef = db
      .collection("ai_agent_hub")
      .doc(userId)
      .collection("actions")
      .doc(actionId);

    await actionRef.update(updates);
    return res.status(200).json({ message: "✅ Azione aggiornata" });
  } catch (err) {
    console.error("❌ Errore updateAgentAction:", err);
    return res.status(500).json({ error: "Errore aggiornamento azione" });
  }
});

// ✅ Recupera i documenti generati dall'agente
exports.getAgentDocuments = onRequest(async (req, res) => {
  const userId = req.path.split("/").pop();
  if (req.method !== "GET") return res.status(405).send("Method Not Allowed");

  try {
    const snapshot = await db
      .collection("ai_agent_hub")
      .doc(userId)
      .collection("documents")
      .orderBy("createdAt", "desc")
      .get();

    const docs = snapshot.docs.map((doc) => doc.data());
    return res.status(200).json(docs);
  } catch (err) {
    console.error("❌ Errore getAgentDocuments:", err);
    return res.status(500).json({ error: "Errore recupero documenti IA" });
  }
});

// ✅ Recupera configurazione utente (autonomia e automazioni)
exports.getAgentConfig = onRequest(async (req, res) => {
  const userId = req.path.split("/").pop();
  if (req.method !== "GET") return res.status(405).send("Method Not Allowed");

  try {
    const doc = await db.collection("ai_agent_hub_config").doc(userId).get();
    if (!doc.exists)
      return res
        .status(200)
        .json({ autonomyLevel: "base", enabledAutomations: {} });
    return res.status(200).json(doc.data());
  } catch (err) {
    console.error("❌ Errore getAgentConfig:", err);
    return res.status(500).json({ error: "Errore recupero config" });
  }
});

// ✅ Salva configurazione utente
exports.saveAgentConfig = onRequest(async (req, res) => {
  const userId = req.path.split("/").pop();
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    const body = req.body || req.rawBody.toString();
    const data = typeof body === "string" ? JSON.parse(body) : body;
    await db
      .collection("ai_agent_hub_config")
      .doc(userId)
      .set(data, { merge: true });
    return res.status(200).json({ message: "✅ Config salvata" });
  } catch (err) {
    console.error("❌ Errore saveAgentConfig:", err);
    return res.status(500).json({ error: "Errore salvataggio config" });
  }
});
