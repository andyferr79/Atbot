const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// ✅ Middleware autenticazione
async function authenticate(req) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) throw { status: 403, message: "❌ Token mancante" };
  try {
    req.user = await admin.auth().verifyIdToken(token);
  } catch (error) {
    functions.logger.error("❌ Token non valido:", error);
    throw { status: 401, message: "❌ Token non valido" };
  }
}

// ✅ Middleware Rate Limiting
async function checkRateLimit(ip, maxRequests, windowMs) {
  const rateDocRef = db.collection("RateLimits").doc(ip);
  const rateDoc = await rateDocRef.get();
  const now = Date.now();

  let data = rateDoc.exists ? rateDoc.data() : { count: 0, firstRequest: now };

  if (now - data.firstRequest < windowMs) {
    if (data.count >= maxRequests) {
      throw { status: 429, message: "❌ Troppe richieste. Riprova più tardi." };
    }
    data.count++;
  } else {
    data = { count: 1, firstRequest: now };
  }

  await rateDocRef.set(data);
}

// 🔔 GET: Tutte le notifiche dell'utente
exports.getNotifications = functions.https.onRequest(async (req, res) => {
  if (req.method !== "GET")
    return res.status(405).json({ error: "❌ Usa GET." });

  try {
    await authenticate(req);
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
    functions.logger.error("❌ Errore recupero notifiche:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

// 🔔 POST: Creare una nuova notifica
exports.createNotification = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST")
    return res.status(405).json({ error: "❌ Usa POST." });

  try {
    await authenticate(req);

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
    functions.logger.error("❌ Errore creazione notifica:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

// 🔔 PUT: Segnare una notifica come letta
exports.markNotificationAsRead = functions.https.onRequest(async (req, res) => {
  if (req.method !== "PUT")
    return res.status(405).json({ error: "❌ Usa PUT." });

  try {
    await authenticate(req);
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
    functions.logger.error("❌ Errore aggiornamento notifica:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

// 🔔 PUT: Segnare tutte le notifiche come lette
exports.markAllNotificationsAsRead = functions.https.onRequest(
  async (req, res) => {
    if (req.method !== "PUT")
      return res.status(405).json({ error: "❌ Usa PUT." });

    try {
      await authenticate(req);
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
      functions.logger.error("❌ Errore aggiornamento notifiche:", error);
      res
        .status(error.status || 500)
        .json({ error: error.message || "Errore interno" });
    }
  }
);

// 🔔 DELETE: Eliminare una notifica
exports.deleteNotification = functions.https.onRequest(async (req, res) => {
  if (req.method !== "DELETE")
    return res.status(405).json({ error: "❌ Usa DELETE." });

  try {
    await authenticate(req);
    const { notificationId } = req.query;
    if (!notificationId) {
      return res.status(400).json({ error: "❌ notificationId richiesto." });
    }

    await db.collection("Notifications").doc(notificationId).delete();
    res.json({ message: "✅ Notifica eliminata." });
  } catch (error) {
    functions.logger.error("❌ Errore eliminazione notifica:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

// 🔔 GET: Numero notifiche non lette per l'utente
exports.getUnreadNotificationsCount = functions.https.onRequest(
  async (req, res) => {
    if (req.method !== "GET")
      return res.status(405).json({ error: "❌ Usa GET." });

    try {
      await authenticate(req);
      const userId = req.user.uid;

      const snapshot = await db
        .collection("Notifications")
        .where("userId", "==", userId)
        .where("status", "==", "unread")
        .get();

      res.json({ unreadCount: snapshot.size });
    } catch (error) {
      functions.logger.error("❌ Errore conteggio notifiche non lette:", error);
      res
        .status(error.status || 500)
        .json({ error: error.message || "Errore interno" });
    }
  }
);
