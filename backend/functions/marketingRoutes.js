const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// ✅ Middleware autenticazione token
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

// ✅ Rate limiting via Firestore
const checkRateLimit = async (
  req,
  res,
  limit = 50,
  windowMs = 10 * 60 * 1000
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

// ==============================
// 📌 GESTIONE POST SOCIAL
// ==============================

// ✅ Recupera tutti i post social
exports.getSocialPosts = functions.https.onRequest(async (req, res) => {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ error: "❌ Metodo non consentito. Usa GET." });
  }
  if (!(await verifyToken(req, res))) return;
  if (!(await checkRateLimit(req, res))) return;

  try {
    const snapshot = await db.collection("SocialPosts").get();
    const posts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString() || "N/A",
    }));
    return res.json(posts);
  } catch (error) {
    functions.logger.error("❌ Errore recupero post social:", error);
    return res.status(500).json({
      message: "Errore nel recupero dei post social",
      details: error.message,
    });
  }
});

// ✅ Aggiunge un nuovo post social
exports.addSocialPost = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ error: "❌ Metodo non consentito. Usa POST." });
  }
  if (!(await verifyToken(req, res))) return;
  if (!(await checkRateLimit(req, res))) return;

  try {
    const newPost = {
      ...req.body,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const docRef = await db.collection("SocialPosts").add(newPost);
    return res.json({ id: docRef.id, ...newPost });
  } catch (error) {
    functions.logger.error("❌ Errore aggiunta post social:", error);
    return res.status(500).json({
      message: "Errore nell'aggiunta del post social",
      details: error.message,
    });
  }
});

// ==============================
// 📌 GESTIONE CAMPAGNE MARKETING
// ==============================

// ✅ Recupera tutte le campagne marketing
exports.getMarketingCampaigns = functions.https.onRequest(async (req, res) => {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ error: "❌ Metodo non consentito. Usa GET." });
  }
  if (!(await verifyToken(req, res))) return;
  if (!(await checkRateLimit(req, res))) return;

  try {
    const snapshot = await db.collection("MarketingCampaigns").get();
    const campaigns = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString() || "N/A",
    }));
    return res.json(campaigns);
  } catch (error) {
    functions.logger.error("❌ Errore recupero campagne marketing:", error);
    return res.status(500).json({
      message: "Errore nel recupero delle campagne marketing",
      details: error.message,
    });
  }
});

// ✅ Aggiunge una nuova campagna marketing
exports.addMarketingCampaign = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ error: "❌ Metodo non consentito. Usa POST." });
  }
  if (!(await verifyToken(req, res))) return;
  if (!(await checkRateLimit(req, res))) return;

  const { userId, platforms, budget, targetAudience, goal } = req.body;

  if (!userId || !platforms || !budget || !targetAudience || !goal) {
    return res
      .status(400)
      .json({ error: "❌ Tutti i campi sono obbligatori." });
  }

  const parsedBudget = parseFloat(budget);
  if (isNaN(parsedBudget) || parsedBudget <= 0) {
    return res.status(400).json({ error: "❌ Budget deve essere positivo." });
  }

  const newCampaign = {
    userId,
    platforms,
    budget: parsedBudget,
    targetAudience,
    goal,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  try {
    const docRef = await db.collection("MarketingCampaigns").add(newCampaign);
    return res.json({
      message: "✅ Campagna marketing creata con successo",
      id: docRef.id,
    });
  } catch (error) {
    functions.logger.error("❌ Errore creazione campagna marketing:", error);
    return res.status(500).json({
      message: "Errore nella creazione della campagna marketing",
      details: error.message,
    });
  }
});
