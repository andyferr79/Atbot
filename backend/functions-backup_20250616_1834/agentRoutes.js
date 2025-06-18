// 📁 functions/agentRoutes.js – Express Gen 2 + Sicurezza Trigger IA

const express = require("express");
const admin = require("firebase-admin");
const { onRequest } = require("firebase-functions/v2/https");
const { verifyToken } = require("../middlewares/verifyToken");
const withRateLimit = require("../middlewares/withRateLimit");

const { trackIAUsage } = require("./usageTracker");
const { sendNotification } = require("./lib/sendNotification");
const { generateDocumentTags } = require("./lib/generateDocumentTags");
const { matchEvent } = require("./lib/eventMatcher");

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();
const router = express.Router();

// 🔐 Middleware globale
router.use(verifyToken);

// 📊 Logging globale
router.use((req, res, next) => {
  console.log(`📥 [${req.method}] ${req.originalUrl} – UID: ${req.user?.uid}`);
  next();
});

// 🛡️ Rate limiter personalizzato
const rateLimiter = withRateLimit(10, 60_000);

// --- INIZIO ROTTE ---
// ✅ Recupera tutte le azioni IA
router.get("/actions/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const snapshot = await db
      .collection("ai_agent_hub")
      .doc(userId)
      .collection("actions")
      .orderBy("startedAt", "desc")
      .get();

    const actions = snapshot.docs.map((doc) => doc.data());
    res.status(200).json(actions);
  } catch (err) {
    console.error("❌ getAgentActions:", err);
    res.status(500).json({ error: "Errore recupero azioni IA" });
  }
});

// ✅ Elimina azione IA
router.delete("/actions/:userId/:actionId", async (req, res) => {
  try {
    const { userId, actionId } = req.params;
    await db
      .collection("ai_agent_hub")
      .doc(userId)
      .collection("actions")
      .doc(actionId)
      .delete();
    res.status(200).json({ message: "✅ Azione eliminata" });
  } catch (err) {
    console.error("❌ deleteAgentAction:", err);
    res.status(500).json({ error: "Errore eliminazione azione" });
  }
});

// ✅ Aggiorna stato/output azione
router.patch("/actions/:userId/:actionId", async (req, res) => {
  try {
    const { userId, actionId } = req.params;
    const { status, output } = req.body;
    const updates = {};
    if (status) updates.status = status;
    if (output) updates.output = output;

    await db
      .collection("ai_agent_hub")
      .doc(userId)
      .collection("actions")
      .doc(actionId)
      .update(updates);
    res.status(200).json({ message: "✅ Azione aggiornata" });
  } catch (err) {
    console.error("❌ updateAgentAction:", err);
    res.status(500).json({ error: "Errore aggiornamento azione" });
  }
});

// ✅ Recupera documenti IA
router.get("/documents/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const snapshot = await db
      .collection("ai_agent_hub")
      .doc(userId)
      .collection("documents")
      .orderBy("createdAt", "desc")
      .get();
    const docs = snapshot.docs.map((doc) => doc.data());
    res.status(200).json(docs);
  } catch (err) {
    console.error("❌ getAgentDocuments:", err);
    res.status(500).json({ error: "Errore recupero documenti IA" });
  }
});

// ✅ Recupera configurazione IA
router.get("/config/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const doc = await db.collection("ai_agent_hub_config").doc(userId).get();
    if (!doc.exists)
      return res
        .status(200)
        .json({ autonomyLevel: "base", enabledAutomations: {} });
    res.status(200).json(doc.data());
  } catch (err) {
    console.error("❌ getAgentConfig:", err);
    res.status(500).json({ error: "Errore recupero config" });
  }
});

// ✅ Salva configurazione IA
router.post("/config/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const data = req.body;
    await db
      .collection("ai_agent_hub_config")
      .doc(userId)
      .set(data, { merge: true });
    res.status(200).json({ message: "✅ Config salvata" });
  } catch (err) {
    console.error("❌ saveAgentConfig:", err);
    res.status(500).json({ error: "Errore salvataggio config" });
  }
});

// ✅ Trigger: Dispatch IA (protetto + rate limit)
router.post("/dispatch", withRateLimit(10, 60_000), async (req, res) => {
  try {
    const userId = req.user.uid;
    const {
      taskType,
      model = "gpt-4",
      context = {},
      priority = "normal",
    } = req.body;

    if (!taskType)
      return res.status(400).json({ error: "taskType è obbligatorio" });

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
      priority,
    };

    await actionRef.set(action);

    await sendNotification({
      userId,
      title: `Nuova azione IA: ${taskType}`,
      description: `È stata avviata un’azione "${taskType}" per l’agente IA.`,
      type: "ai",
    });

    res
      .status(200)
      .json({ message: "✅ Azione IA salvata", actionId: actionRef.id });
  } catch (err) {
    console.error("❌ dispatchAgentAction:", err);
    res.status(500).json({ error: "Errore salvataggio azione IA" });
  }
});

// ✅ Trigger: Event Matcher IA
router.post("/event-matcher", withRateLimit(10, 60_000), async (req, res) => {
  try {
    const userId = req.user.uid;
    const { eventType, note = "", booking = {}, customer = {} } = req.body;
    if (!eventType)
      return res.status(400).json({ error: "eventType obbligatorio" });

    const matches = matchEvent({ eventType, note, booking, customer });
    if (matches.length === 0)
      return res
        .status(200)
        .json({ message: "Nessuna azione IA suggerita", actions: [] });

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

    res
      .status(200)
      .json({ message: `✅ ${actions.length} azione(i) IA create`, actions });
  } catch (err) {
    console.error("❌ eventMatcher:", err);
    res.status(500).json({ error: "Errore analisi evento IA" });
  }
});

// ✅ Feedback IA
router.post("/feedback", withRateLimit(10, 60_000), async (req, res) => {
  try {
    const userId = req.user.uid;
    const { actionId, rating, comment = "" } = req.body;
    if (!actionId || !["up", "down"].includes(rating)) {
      return res.status(400).json({ error: "Dati feedback non validi" });
    }

    const now = new Date();
    await db
      .collection("ai_agent_hub")
      .doc(userId)
      .collection("feedback")
      .doc()
      .set({
        actionId,
        userId,
        rating,
        comment,
        timestamp: now,
        expireAt: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
      });

    res.status(200).json({ message: "✅ Feedback salvato" });
  } catch (err) {
    console.error("❌ sendAgentFeedback:", err);
    res.status(500).json({ error: "Errore salvataggio feedback" });
  }
});

// ✅ agent/checkin/send-welcome
router.post(
  "/checkin/send-welcome",
  withRateLimit(10, 60_000),
  async (req, res) => {
    try {
      const userId = req.user.uid;
      const { bookingId, clientName, checkinDate, checkoutDate } = req.body;

      if (!bookingId || !clientName || !checkinDate || !checkoutDate) {
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
        context: { bookingId, clientName, checkinDate, checkoutDate },
        output: { clientMessage },
      };

      await actionRef.set(action);

      console.log(
        "📤 Check-in IA completato. Messaggio simulato al cliente:\n",
        clientMessage
      );

      return res.status(200).json({
        message: "✅ Check-in IA completato + messaggio generato",
        actionId: actionRef.id,
      });
    } catch (err) {
      console.error("❌ Errore /checkin/send-welcome:", err);
      return res
        .status(500)
        .json({ error: "Errore registrazione check-in IA" });
    }
  }
);

// ✅ agent/checkin/generate-pdf
router.post(
  "/checkin/generate-pdf",
  withRateLimit(10, 60_000),
  async (req, res) => {
    try {
      const userId = req.user.uid;
      const { bookingId, clientName, checkinDate, checkoutDate } = req.body;

      if (!bookingId || !clientName || !checkinDate || !checkoutDate) {
        return res
          .status(400)
          .json({ error: "Dati incompleti per generazione PDF" });
      }

      const now = new Date();
      const reportId = `checkin_${bookingId}`;

      const content = `
📝 CHECK-IN SUMMARY (Mock)
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

      console.log("📄 Documento riepilogo check-in generato:\n", content);

      return res.status(200).json({
        message: "✅ Documento riepilogo check-in mock salvato",
        reportId,
      });
    } catch (err) {
      console.error("❌ Errore /checkin/generate-pdf:", err);
      return res
        .status(500)
        .json({ error: "Errore generazione documento check-in" });
    }
  }
);

// ✅ notifications/ai
router.post(
  "/notifications/ai",
  withRateLimit(10, 60_000),
  async (req, res) => {
    try {
      const userId = req.user.uid;
      const { title, description } = req.body;

      if (!title || !description) {
        return res
          .status(400)
          .json({ error: "title e description sono obbligatori" });
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
      console.error("❌ Errore /notifications/ai:", err);
      return res.status(500).json({
        error: "Errore durante il salvataggio della notifica AI",
      });
    }
  }
);

// ✅ agent/upsell/suggest
router.post(
  "/agent/upsell/suggest",
  withRateLimit(10, 60_000),
  async (req, res) => {
    try {
      const userId = req.user.uid;
      const { propertyId, bookingId, clientName } = req.body;

      if (!propertyId || !bookingId || !clientName) {
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
      console.error("❌ Errore /agent/upsell/suggest:", err);
      return res
        .status(500)
        .json({ error: "Errore durante suggerimento upsell" });
    }
  }
);

// ✅ agent/upsell/generate-pdf
router.post(
  "/agent/upsell/generate-pdf",
  withRateLimit(10, 60_000),
  async (req, res) => {
    try {
      const userId = req.user.uid;
      const { bookingId, clientName, suggestedExtras = [] } = req.body;

      if (!bookingId || !clientName || suggestedExtras.length === 0) {
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
      console.error("❌ Errore /agent/upsell/generate-pdf:", err);
      return res
        .status(500)
        .json({ error: "Errore generazione documento upsell" });
    }
  }
);
module.exports = onRequest({ cors: true }, router);
