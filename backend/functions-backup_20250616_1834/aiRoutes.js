// 📁 functions/aiRoutes.js – Gen 2, Sicuro, Log + Rate Limit

const express = require("express");
const admin = require("firebase-admin");
const axios = require("axios");
const rateLimit = require("express-rate-limit");
const { verifyToken } = require("../middlewares/verifyToken");

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

const router = express.Router();

// ✅ Middleware globali
router.use(verifyToken);

// 📊 Logging richieste
router.use((req, res, next) => {
  console.log(`💬 [POST] /ai/chat – UID: ${req.user?.uid}, IP: ${req.ip}`);
  next();
});

// 🛡️ Rate limiter per chat IA
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: "Troppe richieste. Riprova tra poco.",
  keyGenerator: (req) => req.user?.uid || req.ip,
});
router.use(limiter);

// ✅ URL backend AI FastAPI
const AI_BACKEND_URL = "http://127.0.0.1:8000";

// 🤖 POST /ai/chat → inoltra richiesta al backend FastAPI
router.post("/chat", async (req, res) => {
  const { user_message, session_id } = req.body;

  if (!user_message || !session_id) {
    return res.status(400).json({
      error: "❌ user_message e session_id obbligatori",
    });
  }

  try {
    const response = await axios.post(
      `${AI_BACKEND_URL}/chat`,
      { user_message, session_id },
      { timeout: 10000 }
    );

    return res.status(200).json(response.data);
  } catch (err) {
    console.error("❌ Errore /ai/chat →", err?.response?.data || err.message);

    if (err.response) {
      return res
        .status(err.response.status)
        .json({ error: "Errore backend AI", details: err.response.data });
    }

    if (err.code === "ECONNABORTED") {
      return res.status(504).json({ error: "❌ Timeout backend AI" });
    }

    return res.status(500).json({ error: "Errore interno comunicazione AI" });
  }
});

module.exports = router;
