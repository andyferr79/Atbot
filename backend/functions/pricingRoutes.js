const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// ✅ Middleware autenticazione riutilizzabile
async function authenticate(req) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) throw { status: 403, message: "❌ Token mancante" };
  try {
    return await admin.auth().verifyIdToken(token);
  } catch (error) {
    functions.logger.error("❌ Token non valido:", error);
    throw { status: 401, message: "❌ Token non valido" };
  }
}

// ✅ Middleware Rate Limiting avanzato
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

// 📌 GET - Recuperare tutte le tariffe delle camere
exports.getRoomPricing = functions.https.onRequest(async (req, res) => {
  if (req.method !== "GET")
    return res.status(405).json({ error: "❌ Usa GET." });

  try {
    await authenticate(req);
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown_ip";
    await checkRateLimit(ip, 50, 10 * 60 * 1000);

    const snapshot = await db.collection("RoomPricing").get();
    const prices = snapshot.docs.map((doc) => ({
      id: doc.id,
      roomType: doc.data().roomType || "N/A",
      currentPrice: doc.data().currentPrice || 0,
      suggestedPrice: doc.data().suggestedPrice || 0,
      lastUpdated: doc.data().lastUpdated?.toDate().toISOString() || "N/A",
    }));

    res.json(prices);
  } catch (error) {
    functions.logger.error("❌ Errore recupero tariffe:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

// 📌 POST - Aggiungi nuova tariffa camera
exports.addRoomPricing = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST")
    return res.status(405).json({ error: "❌ Usa POST." });

  try {
    await authenticate(req);
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown_ip";
    await checkRateLimit(ip, 30, 10 * 60 * 1000);

    const { roomType, currentPrice } = req.body;

    if (
      !roomType ||
      !currentPrice ||
      isNaN(currentPrice) ||
      currentPrice <= 0
    ) {
      return res.status(400).json({ error: "❌ Dati non validi." });
    }

    const newPricing = {
      roomType,
      currentPrice: parseFloat(currentPrice),
      suggestedPrice: null,
      lastUpdated: new Date(),
    };

    const docRef = await db.collection("RoomPricing").add(newPricing);
    res.json({ id: docRef.id, ...newPricing });
  } catch (error) {
    functions.logger.error("❌ Errore aggiunta tariffa:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

// 📌 PUT - Aggiorna tariffa esistente
exports.updateRoomPricing = functions.https.onRequest(async (req, res) => {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "❌ Usa PUT." });
  }

  try {
    await authenticate(req);
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown_ip";
    await checkRateLimit(ip, 30, 10 * 60 * 1000);

    const { pricingId, updates } = req.body;
    if (!pricingId || !updates || updates.currentPrice <= 0) {
      return res.status(400).json({ error: "❌ Dati mancanti o invalidi." });
    }

    updates.lastUpdated = new Date();

    await db.collection("RoomPricing").doc(pricingId).update(updates);
    res.json({ message: "✅ Tariffa aggiornata." });
  } catch (error) {
    functions.logger.error("❌ Errore aggiornamento tariffa:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

// 📌 DELETE - Eliminare una tariffa
exports.deleteRoomPricing = functions.https.onRequest(async (req, res) => {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "❌ Usa DELETE." });
  }

  try {
    await authenticate(req);
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown_ip";
    await checkRateLimit(ip, 20, 10 * 60 * 1000);

    const { pricingId } = req.query;
    if (!pricingId) {
      return res.status(400).json({ error: "❌ pricingId richiesto." });
    }

    await db.collection("RoomPricing").doc(pricingId).delete();
    return res.json({ message: "✅ Tariffa eliminata." });
  } catch (error) {
    functions.logger.error("❌ Errore eliminazione tariffa:", error);
    return res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});
