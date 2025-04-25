const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const axios = require("axios");
const db = admin.apps.length
  ? admin.firestore()
  : (() => {
      admin.initializeApp();
      return admin.firestore();
    })();

// URL del backend IA
const AI_BACKEND_URL = "http://127.0.0.1:8000";

// Middleware di verifica token
async function verifyToken(req, res) {
  const auth = req.headers.authorization?.split(" ")[1];
  if (!auth) {
    res.status(403).json({ error: "❌ Token mancante" });
    return false;
  }
  try {
    await admin.auth().verifyIdToken(auth);
    return true;
  } catch (e) {
    res.status(401).json({ error: "❌ Token non valido" });
    return false;
  }
}

// Middleware rate limiting
async function checkRateLimit(req, res) {
  const ip = req.headers["x-forwarded-for"] || req.ip || "unknown";
  const now = Date.now();
  const doc = db.collection("RateLimits").doc(ip);
  const snap = await doc.get();
  if (snap.exists && now - snap.data().lastRequest < 10 * 60 * 1000) {
    res.status(429).json({ error: "❌ Troppe richieste" });
    return false;
  }
  await doc.set({ lastRequest: now });
  return true;
}

// Wrapper comune per tutte le funzioni protette
function secureFunction(handler) {
  return onRequest(async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "❌ Usa POST." });
    }
    if (!(await verifyToken(req, res))) return;
    if (!(await checkRateLimit(req, res))) return;
    try {
      await handler(req, res);
    } catch (err) {
      console.error("❌ Errore interno:", err);
      res.status(500).json({ error: err.message });
    }
  });
}

// 📌 Handler vero e proprio
async function _chatWithAI(req, res) {
  const { user_message, session_id } = req.body;
  if (!user_message || !session_id) {
    return res
      .status(400)
      .json({ error: "❌ user_message e session_id obbligatori." });
  }
  try {
    const { data } = await axios.post(
      `${AI_BACKEND_URL}/chat`,
      { user_message, session_id },
      { timeout: 10000 }
    );
    res.json(data);
  } catch (error) {
    if (error.response) {
      res
        .status(error.response.status)
        .json({ error: "Errore backend AI", details: error.response.data });
    } else if (error.code === "ECONNABORTED") {
      res.status(504).json({ error: "❌ Timeout comunicazione AI" });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
}

// 📡 Esportazione della funzione
exports.chatWithAI = secureFunction(_chatWithAI);
