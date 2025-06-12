// 📁 functions/pricingRecommendationsRoutes.js

const express = require("express");
const admin = require("firebase-admin");
const axios = require("axios");

const router = express.Router();
const db = admin.firestore();
const AI_BACKEND_URL = "http://127.0.0.1:8000";

// ✅ Middleware autenticazione
const authenticate = async (req) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) throw { status: 403, message: "❌ Token mancante" };
  try {
    await admin.auth().verifyIdToken(token);
  } catch (error) {
    console.error("❌ Token non valido:", error);
    throw { status: 401, message: "❌ Token non valido" };
  }
};

// ✅ Middleware rate limiting
const checkRateLimit = async (ip, maxRequests, windowMs) => {
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
};

// 📌 GET /pricing/recommendations
router.get("/recommendations", async (req, res) => {
  try {
    await authenticate(req);
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown_ip";
    await checkRateLimit(ip, 50, 10 * 60 * 1000);

    const pricingSnapshot = await db.collection("RoomPricing").get();
    const pricingData = pricingSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const aiResponse = await axios.post(`${AI_BACKEND_URL}/pricing/optimize`, {
      pricingData,
    });
    if (aiResponse.status !== 200 || !aiResponse.data) {
      throw { status: 500, message: "❌ Risposta non valida dal backend AI." };
    }

    res.json({
      message: "✅ Raccomandazioni di prezzo ottenute!",
      recommendations: aiResponse.data.recommendations,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Errore raccomandazioni pricing:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

// 📌 POST /pricing/recommendations
router.post("/recommendations", async (req, res) => {
  try {
    await authenticate(req);
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown_ip";
    await checkRateLimit(ip, 30, 10 * 60 * 1000);

    const { recommendations } = req.body;
    if (!recommendations) {
      return res.status(400).json({ error: "❌ recommendations richieste." });
    }

    await db.collection("PricingRecommendations").doc("latest").set({
      recommendations,
      savedAt: new Date(),
    });

    res.json({ message: "✅ Raccomandazioni prezzi salvate con successo." });
  } catch (error) {
    console.error("❌ Errore salvataggio raccomandazioni:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

// 📌 GET /pricing/recommendations/latest
router.get("/recommendations/latest", async (req, res) => {
  try {
    await authenticate(req);
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown_ip";
    await checkRateLimit(ip, 50, 10 * 60 * 1000);

    const doc = await db
      .collection("PricingRecommendations")
      .doc("latest")
      .get();
    if (!doc.exists) {
      return res
        .status(404)
        .json({ error: "⚠️ Nessuna raccomandazione trovata." });
    }

    const data = doc.data();
    res.json({
      recommendations: data.recommendations,
      generatedAt: data.generatedAt?.toDate().toISOString() || "N/A",
    });
  } catch (error) {
    console.error("❌ Errore recupero raccomandazioni:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

module.exports = router;
