const express = require("express");
const admin = require("firebase-admin");
const router = express.Router();

const db = admin.firestore();
router.use(express.json());

// ✅ Middleware autenticazione
async function authenticate(req) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) throw { status: 403, message: "❌ Token mancante" };
  try {
    return await admin.auth().verifyIdToken(token);
  } catch (error) {
    console.error("❌ Token non valido:", error);
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

// 📌 GET - Recuperare tutti i report marketing
router.get("/", async (req, res) => {
  try {
    await authenticate(req);
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown_ip";
    await checkRateLimit(ip, 50, 10 * 60 * 1000);

    const snapshot = await db.collection("MarketingReports").get();
    const reports = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString() || "N/A",
    }));

    return res.json(reports);
  } catch (error) {
    console.error("❌ Errore recupero report marketing:", error);
    return res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

// 📌 POST - Aggiungere nuovo report marketing
router.post("/", async (req, res) => {
  try {
    await authenticate(req);
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown_ip";
    await checkRateLimit(ip, 50, 10 * 60 * 1000);

    const { name, channel, budget, conversions } = req.body;

    if (!name || !channel || !budget || !conversions) {
      return res
        .status(400)
        .json({ error: "❌ Tutti i campi sono obbligatori." });
    }

    const parsedBudget = parseFloat(budget);
    if (isNaN(parsedBudget) || parsedBudget <= 0) {
      return res.status(400).json({ error: "❌ Budget deve essere positivo." });
    }

    const parsedConversions = parseInt(conversions, 10);
    if (isNaN(parsedConversions) || parsedConversions < 0) {
      return res.status(400).json({ error: "❌ Conversioni non valide." });
    }

    const newReport = {
      name,
      channel,
      budget: parsedBudget,
      conversions: parsedConversions,
      createdAt: new Date(),
    };

    const docRef = await db.collection("MarketingReports").add(newReport);
    return res.json({ id: docRef.id, ...newReport });
  } catch (error) {
    console.error("❌ Errore aggiunta report marketing:", error);
    return res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

// 📌 PUT - Aggiornare report marketing
router.put("/", async (req, res) => {
  try {
    await authenticate(req);
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown_ip";
    await checkRateLimit(ip, 50, 10 * 60 * 1000);

    const { reportId, updates } = req.body;
    if (!reportId || !updates) {
      return res
        .status(400)
        .json({ error: "❌ reportId e updates richiesti." });
    }

    await db.collection("MarketingReports").doc(reportId).update(updates);
    return res.json({ message: "✅ Report marketing aggiornato." });
  } catch (error) {
    console.error("❌ Errore aggiornamento report marketing:", error);
    return res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

// 📌 DELETE - Eliminare report marketing
router.delete("/", async (req, res) => {
  try {
    await authenticate(req);
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown_ip";
    await checkRateLimit(ip, 20, 10 * 60 * 1000);

    const { reportId } = req.query;
    if (!reportId) {
      return res.status(400).json({ error: "❌ reportId richiesto." });
    }

    await db.collection("MarketingReports").doc(reportId).delete();
    return res.json({ message: "✅ Report marketing eliminato." });
  } catch (error) {
    console.error("❌ Errore eliminazione report marketing:", error);
    return res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

module.exports = router;
