const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

// ✅ Inizializzazione Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// 📌 URL backend AI (da aggiornare in produzione)
const AI_BACKEND_URL = "http://127.0.0.1:8000";

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

// Middleware: rate limiting Firestore
const checkRateLimit = async (req, res, windowMs = 10 * 60 * 1000) => {
  const ip =
    req.headers["x-forwarded-for"] ||
    req.connection?.remoteAddress ||
    "unknown_ip";
  const now = Date.now();
  const rateDocRef = db.collection("RateLimits").doc(ip);
  const rateDoc = await rateDocRef.get();

  if (rateDoc.exists && now - rateDoc.data().lastRequest < windowMs) {
    res
      .status(429)
      .json({ error: "❌ Troppe richieste. Attendi prima di riprovare." });
    return false;
  }

  await rateDocRef.set({ lastRequest: now });
  return true;
};

// 📌 Ottiene raccomandazioni pricing con AI
exports.getPricingRecommendations = functions.https.onRequest(
  async (req, res) => {
    if (req.method !== "GET")
      return res.status(405).json({ error: "❌ Usa GET." });
    if (!(await verifyToken(req, res))) return;
    if (!(await checkRateLimit(req, res))) return;

    try {
      // 📌 Recupero tariffe attuali da Firestore
      const pricingSnapshot = await db.collection("RoomPricing").get();
      const pricingData = pricingSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // 📡 Chiamata backend AI per ottimizzazione pricing
      const aiResponse = await axios.post(
        `${AI_BACKEND_URL}/pricing/optimize`,
        { pricingData }
      );

      if (aiResponse.status !== 200 || !aiResponse.data) {
        throw new Error("Risposta non valida dal backend AI.");
      }

      return res.json({
        message: "✅ Raccomandazioni di prezzo ottenute con successo!",
        recommendations: aiResponse.data.recommendations,
      });
    } catch (error) {
      functions.logger.error(
        "❌ Errore recupero raccomandazioni pricing:",
        error
      );
      return res.status(500).json({
        error: "Errore nel recupero delle raccomandazioni di prezzo",
        details: error.message,
      });
    }
  }
);
