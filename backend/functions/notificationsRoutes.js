const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Middleware per verifica token (centralizzato)
const verifyToken = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    res.status(403).json({ error: "❌ Token mancante" });
    return false;
  }
  try {
    req.user = await admin.auth().verifyIdToken(token);
    return true;
  } catch (error) {
    functions.logger.error("❌ Token non valido:", error);
    res.status(401).json({ error: "❌ Token non valido" });
    return false;
  }
};

// Middleware per rate limiting (centralizzato)
const checkRateLimit = async (
  req,
  res,
  maxRequests = 50,
  windowMinutes = 10
) => {
  const ip =
    req.headers["x-forwarded-for"] ||
    req.connection?.remoteAddress ||
    "unknown_ip";
  const now = Date.now();
  const rateDocRef = db.collection("RateLimits").doc(ip);
  const rateDoc = await rateDocRef.get();

  if (
    rateDoc.exists &&
    now - rateDoc.data().lastRequest < windowMinutes * 60 * 1000
  ) {
    return res
      .status(429)
      .json({ error: "❌ Troppe richieste. Riprova più tardi." });
  }

  await rateDocRef.set({ lastRequest: now });
  return true;
};

// 🔔 Ottiene tutte le notifiche utente
exports.getNotifications = functions.https.onRequest(async (req, res) => {
  if (req.method !== "GET")
    return res.status(405).json({ error: "❌ Usa GET." });
  if (!(await verifyToken(req, res))) return;
  if (!(await checkRateLimit(req, res))) return;

  try {
    const snapshot = await db.collection("Notifications").get();
    const notifications = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString() || "N/A",
    }));
    res.json({ notifications });
  } catch (error) {
    functions.logger.error("❌ Errore recupero notifiche:", error);
    res.status(500).json({ error: error.message });
  }
});

// 🔔 Numero notifiche non lette
exports.getUnreadNotificationsCount = functions.https.onRequest(
  async (req, res) => {
    if (!(await verifyToken(req, res))) return;
    if (!(await checkRateLimit(req, res))) return;

    try {
      const userId = req.user.uid;
      const snapshot = await db
        .collection("Notifications")
        .where("userId", "==", userId)
        .where("status", "==", "unread")
        .get();

      res.json({ count: snapshot.size });
    } catch (error) {
      functions.logger.error("❌ Errore conteggio notifiche non lette:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// 🔔 Conta notifiche annunci non lette
exports.getUnreadAnnouncementsCount = functions.https.onRequest(
  async (req, res) => {
    if (!(await verifyToken(req, res))) return;
    if (!(await checkRateLimit(req, res))) return;

    try {
      const userId = req.user.uid;
      const snapshot = await db
        .collection("Announcements")
        .where("userId", "==", userId)
        .where("status", "==", "unread")
        .get();

      res.json({ count: snapshot.size });
    } catch (error) {
      functions.logger.error(
        "❌ Errore recupero comunicazioni ufficiali non lette:",
        error
      );
      res.status(500).json({ error: error.message });
    }
  }
);

// ✅ Segna una notifica come letta
exports.markNotificationAsRead = functions.https.onRequest(async (req, res) => {
  if (req.method !== "PUT")
    return res.status(405).json({ error: "❌ Usa metodo PUT." });
  if (!(await verifyToken(req, res))) return;
  if (!(await checkRateLimit(req, res))) return;

  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: "❌ ID notifica mancante." });
    }

    await db.collection("Notifications").doc(id).update({ status: "read" });
    res.json({ message: "✅ Notifica segnata come letta." });
  } catch (error) {
    functions.logger.error("❌ Errore aggiornamento notifica:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Segna tutte notifiche utente come lette
exports.markAllNotificationsAsRead = functions.https.onRequest(
  async (req, res) => {
    if (req.method !== "PUT")
      return res.status(405).json({ error: "❌ Usa metodo PUT." });
    if (!(await verifyToken(req, res))) return;
    if (!(await checkRateLimit(req, res))) return;

    try {
      const userId = req.user.uid;
      const snapshot = await db
        .collection("Notifications")
        .where("userId", "==", userId)
        .where("status", "==", "unread")
        .get();

      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { status: "read" });
      });

      await batch.commit();
      res.json({ message: "✅ Tutte le notifiche segnate come lette." });
    } catch (error) {
      functions.logger.error("❌ Errore aggiornamento notifiche:", error);
      res.status(500).json({ error: error.message });
    }
  }
);
