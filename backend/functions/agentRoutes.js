// 📁 functions/agentRoutes.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { onRequest } = functions.https;
const { trackIAUsage } = require("./usageTracker");
const { sendNotification } = require("./lib/sendNotification");
const { generateDocumentTags } = require("./lib/generateDocumentTags");

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

    await db
      .collection("ai_agent_hub")
      .doc(userId)
      .collection("actions")
      .doc(actionId)
      .update(updates);

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

// ✅ Dispatch da trigger esterno – /agent/dispatch (con notifica + priorità)
exports.dispatchAgentAction = onRequest(async (req, res) => {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    const body = req.body || req.rawBody.toString();
    const data = typeof body === "string" ? JSON.parse(body) : body;

    const {
      userId,
      taskType = "generic",
      model = "gpt-4",
      context = {},
      priority = "normal", // 👈 NUOVO campo opzionale
    } = data;

    if (!userId || !taskType) {
      return res
        .status(400)
        .json({ error: "userId e taskType sono obbligatori" });
    }

    await trackIAUsage({ userId, type: taskType, model });

    const now = new Date();
    const actionRef = db
      .collection("ai_agent_hub")
      .doc(userId)
      .collection("actions")
      .doc();

    const action = {
      actionId: actionRef.id,
      type: taskType,
      status: "pending",
      startedAt: now,
      context,
      output: null,
      priority, // 👈 Salviamo anche la priorità
    };

    await actionRef.set(action);

    // ✅ Notifica automatica
    await sendNotification({
      userId,
      title: `Nuova azione IA: ${taskType}`,
      description: `È stata avviata un’azione "${taskType}" per l’agente IA.`,
      type: "ai",
    });

    return res.status(200).json({
      message: `✅ Azione ${taskType} salvata con priorità "${priority}"`,
      actionId: actionRef.id,
    });
  } catch (err) {
    console.error("❌ Errore dispatchAgentAction:", err);
    return res
      .status(500)
      .json({ error: "Errore durante il salvataggio dell'azione IA" });
  }
});

// ✅ Feedback IA – /agent/feedback
exports.sendAgentFeedback = onRequest(async (req, res) => {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    const body = req.body || req.rawBody.toString();
    const data = typeof body === "string" ? JSON.parse(body) : body;

    const { userId, actionId, rating, comment = "" } = data;

    if (!userId || !actionId || !["up", "down"].includes(rating)) {
      return res.status(400).json({ error: "Dati feedback non validi" });
    }

    const now = new Date();
    const expireAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // +1 anno

    const feedbackRef = db
      .collection("ai_agent_hub")
      .doc(userId)
      .collection("feedback")
      .doc();

    await feedbackRef.set({
      actionId,
      userId,
      rating,
      comment,
      timestamp: now,
      expireAt,
    });

    return res.status(200).json({ message: "✅ Feedback salvato" });
  } catch (err) {
    console.error("❌ Errore sendAgentFeedback:", err);
    return res.status(500).json({ error: "Errore salvataggio feedback" });
  }
});

// ✅ Check-in automatico IA – /agent/checkin/send-welcome (con messaggio cliente simulato)
exports.sendWelcomeCheckin = onRequest(async (req, res) => {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    const body = req.body || req.rawBody.toString();
    const data = typeof body === "string" ? JSON.parse(body) : body;

    const { userId, bookingId, clientName, checkinDate, checkoutDate } = data;

    if (!userId || !bookingId || !clientName || !checkinDate || !checkoutDate) {
      return res
        .status(400)
        .json({ error: "Dati mancanti per il check-in IA" });
    }

    const now = new Date();

    const actionRef = db
      .collection("ai_agent_hub")
      .doc(userId)
      .collection("actions")
      .doc();

    // 📤 Messaggio automatico simulato al cliente
    const clientMessage = `
👋 Ciao ${clientName}!

La tua registrazione per il soggiorno dal ${checkinDate} al ${checkoutDate} è stata ricevuta ✅

📌 Check-in disponibile dalle 15:00
📌 Check-out entro le 11:00

🔐 Il codice di accesso ti verrà fornito il giorno dell’arrivo.

✨ Servizi disponibili:
- Colazione + €9,90 al giorno
- Late check-out + €19,00 (fino alle 14:00)
- Noleggio e-bike e SPA convenzionata

Scrivici se vuoi prenotare uno di questi extra 💬

Grazie per aver scelto StayPro! 🏡
`;

    const action = {
      actionId: actionRef.id,
      type: "checkin",
      status: "completed",
      startedAt: now,
      context: {
        bookingId,
        clientName,
        checkinDate,
        checkoutDate,
      },
      output: {
        clientMessage,
      },
    };

    await actionRef.set(action);

    console.log("📤 Messaggio simulato al cliente:\n", clientMessage);

    return res.status(200).json({
      message: "✅ Check-in IA completato + messaggio cliente generato",
      actionId: actionRef.id,
    });
  } catch (err) {
    console.error("❌ Errore sendWelcomeCheckin:", err);
    return res.status(500).json({ error: "Errore registrazione check-in IA" });
  }
});

// ✅ Generazione mock PDF riepilogativo check-in
exports.generateCheckinPdfMock = onRequest(async (req, res) => {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    const body = req.body || req.rawBody.toString();
    const data = typeof body === "string" ? JSON.parse(body) : body;

    const { userId, bookingId, clientName, checkinDate, checkoutDate } = data;

    if (!userId || !bookingId || !clientName || !checkinDate || !checkoutDate) {
      return res.status(400).json({ error: "Dati incompleti" });
    }

    const now = new Date();
    const reportId = `checkin_${bookingId}`;

    const content = `
📝 CHECK-IN SUMMARY (Simulato)
Cliente: ${clientName}
Booking ID: ${bookingId}
Check-in: ${checkinDate}
Check-out: ${checkoutDate}

Servizi suggeriti:
✔ Colazione
✔ Late check-out
✔ SPA e noleggio e-bike

Generato automaticamente da StayPro AI.
`;

    const tags = generateDocumentTags({
      type: "checkin",
      content,
      clientName,
    });

    const docRef = db
      .collection("ai_agent_hub")
      .doc(userId)
      .collection("documents")
      .doc(reportId);

    await docRef.set({
      reportId,
      title: `Riepilogo Check-in ${clientName}`,
      content,
      tags,
      createdAt: now,
    });

    console.log("📄 Documento simulato creato:\n", content);

    return res.status(200).json({
      message: "✅ Documento riepilogativo mock salvato",
      reportId,
    });
  } catch (err) {
    console.error("❌ Errore generateCheckinPdfMock:", err);
    return res
      .status(500)
      .json({ error: "Errore generazione documento check-in" });
  }
});

// ✅ Notifica IA – POST /notifications/ai
exports.createAINotificationHandler = onRequest(async (req, res) => {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    const body = req.body || req.rawBody.toString();
    const data = typeof body === "string" ? JSON.parse(body) : body;

    const { userId, title, description } = data;

    if (!userId || !title || !description) {
      return res.status(400).json({
        error: "userId, title e description sono obbligatori",
      });
    }

    const now = new Date();
    const notificationRef = db
      .collection("notifications")
      .doc(userId)
      .collection("list")
      .doc();

    const notification = {
      id: notificationRef.id,
      type: "ai",
      title,
      description,
      timestamp: now,
      read: false,
    };

    await notificationRef.set(notification);

    return res.status(200).json({
      message: "✅ Notifica AI salvata correttamente",
      notificationId: notification.id,
    });
  } catch (err) {
    console.error("❌ Errore createAINotificationHandler:", err);
    return res.status(500).json({
      error: "Errore durante il salvataggio della notifica AI",
    });
  }
});

// ✅ Suggerimento Upsell – /agent/upsell/suggest
exports.suggestUpsell = onRequest(async (req, res) => {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    const body = req.body || req.rawBody.toString();
    const data = typeof body === "string" ? JSON.parse(body) : body;

    const { userId, propertyId, bookingId, clientName } = data;
    if (!userId || !propertyId || !bookingId || !clientName) {
      return res.status(400).json({ error: "Dati obbligatori mancanti" });
    }

    const propSnap = await db.collection("properties").doc(propertyId).get();
    if (!propSnap.exists) {
      return res.status(404).json({ error: "Struttura non trovata" });
    }

    const propertyData = propSnap.data();
    const extraServices = propertyData.extraServices || [];
    const suggestedExtras = extraServices.map((s) => s.name || s);

    const now = new Date();
    const actionRef = db
      .collection("ai_agent_hub")
      .doc(userId)
      .collection("actions")
      .doc();

    const action = {
      actionId: actionRef.id,
      type: "upsell",
      status: "completed",
      startedAt: now,
      context: { bookingId, clientName, propertyId },
      output: { suggestedExtras },
    };

    await actionRef.set(action);

    await sendNotification({
      userId,
      title: "Suggerimento Up-Sell IA",
      description: `Sono stati suggeriti ${suggestedExtras.length} servizi extra per ${clientName}`,
      type: "ai",
    });

    return res.status(200).json({
      message: "✅ Upsell IA generato con successo",
      actionId: actionRef.id,
      suggestedExtras,
    });
  } catch (err) {
    console.error("❌ Errore suggestUpsell:", err);
    return res
      .status(500)
      .json({ error: "Errore durante suggerimento upsell" });
  }
});

// ✅ Generazione PDF Mock Upsell – /agent/upsell/generate-pdf
exports.generateUpsellPdfMock = onRequest(async (req, res) => {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    const body = req.body || req.rawBody.toString();
    const data = typeof body === "string" ? JSON.parse(body) : body;

    const { userId, bookingId, clientName, suggestedExtras = [] } = data;

    if (!userId || !bookingId || !clientName || suggestedExtras.length === 0) {
      return res
        .status(400)
        .json({ error: "Dati incompleti per generazione PDF" });
    }

    const now = new Date();
    const reportId = `upsell_${bookingId}`;

    const extrasText = suggestedExtras.map((s) => `✔ ${s}`).join("\n");

    const content = `
🎯 UPSALE REPORT – Suggerimenti AI

Cliente: ${clientName}
Booking ID: ${bookingId}

Servizi consigliati:
${extrasText}

🔹 Offerte suggerite automaticamente da StayPro AI
🔹 Ottimizza i profitti con il marketing intelligente
`;

    const tags = generateDocumentTags({
      type: "upsell",
      content,
      clientName,
    });

    const docRef = db
      .collection("ai_agent_hub")
      .doc(userId)
      .collection("documents")
      .doc(reportId);

    await docRef.set({
      reportId,
      title: `Offerta Upsell per ${clientName}`,
      content,
      tags,
      createdAt: now,
    });

    console.log("📄 Documento PDF mock upsell creato:\n", content);

    return res.status(200).json({
      message: "✅ PDF upsell mock generato e salvato",
      reportId,
    });
  } catch (err) {
    console.error("❌ Errore generateUpsellPdfMock:", err);
    return res
      .status(500)
      .json({ error: "Errore generazione documento upsell" });
  }
});

// ✅ IA Event Matcher – /agent/event-matcher
exports.eventMatcher = onRequest(async (req, res) => {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    const body = req.body || req.rawBody.toString();
    const data = typeof body === "string" ? JSON.parse(body) : body;

    const { userId, eventType, note = "", booking = {}, customer = {} } = data;

    if (!userId || !eventType) {
      return res
        .status(400)
        .json({ error: "userId ed eventType sono obbligatori" });
    }

    const { matchEvent } = require("./lib/eventMatcher");
    const matches = matchEvent({ eventType, note, booking, customer });

    if (matches.length === 0) {
      return res
        .status(200)
        .json({ message: "Nessuna azione IA suggerita", actions: [] });
    }

    const now = new Date();
    const batch = db.batch();
    const actions = [];

    for (const match of matches) {
      const actionRef = db
        .collection("ai_agent_hub")
        .doc(userId)
        .collection("actions")
        .doc();

      const action = {
        actionId: actionRef.id,
        type: match.type,
        status: "pending",
        startedAt: now,
        context: { eventType, note, bookingId: booking.id || null },
        output: { reason: match.reason },
        priority: match.priority || "normal",
      };

      batch.set(actionRef, action);
      actions.push(action);
    }

    await batch.commit();

    return res.status(200).json({
      message: `✅ ${actions.length} azione(i) IA create automaticamente`,
      actions,
    });
  } catch (err) {
    console.error("❌ Errore eventMatcher:", err);
    return res
      .status(500)
      .json({ error: "Errore durante l’analisi evento IA" });
  }
});
