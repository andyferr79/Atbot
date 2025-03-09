const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Middleware: verifica token
const verifyToken = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    res.status(403).json({ error: "❌ Token mancante" });
    return false;
  }
  try {
    await admin.auth().verifyIdToken(token);
    return true;
  } catch (error) {
    functions.logger.error("❌ Token non valido:", error);
    res.status(401).json({ error: "❌ Token non valido" });
    return false;
  }
};

// Middleware: rate limiting via Firestore
const checkRateLimit = async (req, res, windowMs = 10 * 60 * 1000) => {
  const ip =
    req.headers["x-forwarded-for"] ||
    req.connection?.remoteAddress ||
    "unknown_ip";
  const now = Date.now();
  const rateDocRef = db.collection("RateLimits").doc(ip);
  const rateDoc = await rateDocRef.get();

  if (rateDoc.exists && now - rateDoc.data().lastRequest < windowMs) {
    res.status(429).json({ error: "❌ Troppe richieste. Riprova più tardi." });
    return false;
  }

  await rateDocRef.set({ lastRequest: now });
  return true;
};

// 📌 Recupera tariffe attuali camere
exports.getRoomPricing = functions.https.onRequest(async (req, res) => {
  if (req.method !== "GET")
    return res.status(405).json({ error: "❌ Usa GET." });
  if (!(await verifyToken(req, res))) return;
  if (!(await checkRateLimit(req, res))) return;

  try {
    const pricingSnapshot = await db.collection("RoomPricing").get();

    const prices = pricingSnapshot.docs.map((doc) => ({
      id: doc.id,
      roomType: doc.data().roomType || "N/A",
      currentPrice: doc.data().currentPrice || 0,
      suggestedPrice: doc.data().suggestedPrice || 0,
      lastUpdated: doc.data().lastUpdated?.toDate().toISOString() || "N/A",
    }));

    res.json({ prices });
  } catch (error) {
    functions.logger.error("❌ Errore recupero tariffe camere:", error);
    res.status(500).json({
      error: "Errore nel recupero delle tariffe",
      details: error.message,
    });
  }
});

// 📌 Aggiorna tariffa manualmente
exports.updateRoomPricing = functions.https.onRequest(async (req, res) => {
  if (req.method !== "PUT")
    return res.status(405).json({ error: "❌ Usa PUT." });
  if (!(await verifyToken(req, res))) return;
  if (!(await checkRateLimit(req, res))) return;

  const { id, newPrice } = req.body;

  if (!id || !newPrice || isNaN(newPrice) || parseFloat(newPrice) <= 0) {
    return res
      .status(400)
      .json({ error: "❌ ID e nuovo prezzo valido obbligatori." });
  }

  try {
    await db
      .collection("RoomPricing")
      .doc(id)
      .update({
        currentPrice: parseFloat(newPrice),
        lastUpdated: new Date(),
      });

    res.json({ message: "✅ Tariffa aggiornata con successo", id });
  } catch (error) {
    functions.logger.error("❌ Errore aggiornamento tariffa:", error);
    res.status(500).json({
      error: "Errore nell'aggiornamento della tariffa",
      details: error.message,
    });
  }
});
