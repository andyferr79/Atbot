const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

// ✅ Inizializzazione Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// URL del backend AI (attualmente locale)
const AI_BACKEND_URL = "http://127.0.0.1:8000";

// Middleware verifica token Firebase
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

// Middleware rate limiting Firestore
const checkRateLimit = async (
  req,
  res,
  windowMs = 10 * 60 * 1000,
  maxRequests = 50
) => {
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

// 📌 API per chat con AI
exports.chatWithAI = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST")
    return res.status(405).json({ error: "❌ Usa POST." });
  if (!(await verifyToken(req, res))) return;
  if (!(await checkRateLimit(req, res))) return;

  const { user_message, session_id } = req.body;

  if (!user_message || !session_id) {
    return res
      .status(400)
      .json({ error: "❌ user_message e session_id obbligatori." });
  }

  try {
    const aiResponse = await axios.post(
      `${AI_BACKEND_URL}/chat`,
      {
        user_message,
        session_id,
      },
      { timeout: 10000 }
    );

    res.json(aiResponse.data);
  } catch (error) {
    if (error.response) {
      functions.logger.error("❌ Errore AI:", error.response.data);
      res
        .status(error.response.status)
        .json({ error: "Errore backend AI", details: error.response.data });
    } else if (error.code === "ECONNABORTED") {
      functions.logger.error("❌ Timeout nella comunicazione con l'AI:", error);
      res.status(504).json({ error: "❌ Timeout comunicazione AI" });
    } else {
      functions.logger.error(
        "❌ Errore generale nella comunicazione AI:",
        error
      );
      res.status(500).json({ error: error.message });
    }
  }
});
