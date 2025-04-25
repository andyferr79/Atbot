// E:/ATBot/backend/functions/notificationsRoutes.js

const admin = require("firebase-admin");
const db = admin.apps.length
  ? admin.firestore()
  : (() => {
      admin.initializeApp();
      return admin.firestore();
    })();

// ✅ Middleware autenticazione
async function authenticate(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;
  if (!token) {
    const err = new Error("❌ Token mancante");
    err.status = 403;
    throw err;
  }
  try {
    req.user = await admin.auth().verifyIdToken(token);
  } catch (error) {
    console.error("❌ Token non valido:", error);
    const err = new Error("❌ Token non valido");
    err.status = 401;
    throw err;
  }
}

// ✅ Middleware Rate Limiting (opzionale)
async function checkRateLimit(ip, maxRequests = 100, windowMs = 60_000) {
  const rateDocRef = db.collection("RateLimits").doc(ip);
  const rateDoc = await rateDocRef.get();
  const now = Date.now();

  let data = rateDoc.exists ? rateDoc.data() : { count: 0, firstRequest: now };

  if (now - data.firstRequest < windowMs) {
    if (data.count >= maxRequests) {
      const err = new Error("❌ Troppe richieste. Riprova più tardi.");
      err.status = 429;
      throw err;
    }
    data.count++;
  } else {
    data = { count: 1, firstRequest: now };
  }

  await rateDocRef.set(data);
}

// 🔔 GET: Tutte le notifiche dell'utente
async function getNotificationsHandler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "❌ Usa GET." });
  }
  try {
    await authenticate(req);
    await checkRateLimit(req.ip);

    const userId = req.user.uid;
    const snapshot = await db
      .collection("Notifications")
      .where("userId", "==", userId)
      .get();

    const notifications = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString(),
    }));

    res.json({ notifications });
  } catch (error) {
    console.error("❌ Errore recupero notifiche:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
}

// 🔔 POST: Creare una nuova notifica
async function createNotificationHandler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "❌ Usa POST." });
  }
  try {
    await authenticate(req);
    await checkRateLimit(req.ip);

    const { userId, message, type } = req.body;
    if (!userId || !message || !type) {
      return res.status(400).json({ error: "❌ Campi obbligatori mancanti." });
    }

    const newNotification = {
      userId,
      message,
      type,
      status: "unread",
      createdAt: new Date(),
    };

    const docRef = await db.collection("Notifications").add(newNotification);

    res.status(201).json({ id: docRef.id, ...newNotification });
  } catch (error) {
    console.error("❌ Errore creazione notifica:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
}

// 🔔 PUT: Segnare una notifica come letta
async function markNotificationAsReadHandler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "❌ Usa PUT." });
  }
  try {
    await authenticate(req);
    await checkRateLimit(req.ip);

    const { notificationId } = req.body;
    if (!notificationId) {
      return res.status(400).json({ error: "❌ notificationId richiesto." });
    }

    await db
      .collection("Notifications")
      .doc(notificationId)
      .update({ status: "read" });

    res.json({ message: "✅ Notifica segnata come letta." });
  } catch (error) {
    console.error("❌ Errore aggiornamento notifica:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
}

// 🔔 PUT: Segnare tutte le notifiche come lette
async function markAllNotificationsAsReadHandler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "❌ Usa PUT." });
  }
  try {
    await authenticate(req);
    await checkRateLimit(req.ip);

    const userId = req.user.uid;
    const snapshot = await db
      .collection("Notifications")
      .where("userId", "==", userId)
      .where("status", "!=", "read")
      .get();

    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.update(doc.ref, { status: "read" }));
    await batch.commit();

    res.json({ message: "✅ Tutte le notifiche segnate come lette." });
  } catch (error) {
    console.error("❌ Errore aggiornamento notifiche:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
}

// 🔔 DELETE: Eliminare una notifica
async function deleteNotificationHandler(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "❌ Usa DELETE." });
  }
  try {
    await authenticate(req);
    await checkRateLimit(req.ip);

    const notificationId = req.query.notificationId;
    if (!notificationId) {
      return res.status(400).json({ error: "❌ notificationId richiesto." });
    }

    await db.collection("Notifications").doc(notificationId).delete();
    res.json({ message: "✅ Notifica eliminata." });
  } catch (error) {
    console.error("❌ Errore eliminazione notifica:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
}

// 🔔 GET: Numero notifiche non lette per l'utente
async function getUnreadNotificationsCountHandler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "❌ Usa GET." });
  }
  try {
    await authenticate(req);
    await checkRateLimit(req.ip);

    const userId = req.user.uid;
    const snapshot = await db
      .collection("Notifications")
      .where("userId", "==", userId)
      .where("status", "==", "unread")
      .get();

    res.json({ unreadCount: snapshot.size });
  } catch (error) {
    console.error("❌ Errore conteggio notifiche non lette:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
}

module.exports = {
  getNotificationsHandler,
  createNotificationHandler,
  markNotificationAsReadHandler,
  markAllNotificationsAsReadHandler,
  deleteNotificationHandler,
  getUnreadNotificationsCountHandler,
};
