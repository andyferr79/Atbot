const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

// ✅ GET: recupero report marketing
exports.getMarketingReports = functions.https.onRequest(async (req, res) => {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ error: "❌ Metodo non consentito. Usa GET." });
  }

  // 🔑 Verifica token Firebase
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(403).json({ error: "❌ Token mancante" });
  }
  try {
    await admin.auth().verifyIdToken(token);
  } catch (error) {
    functions.logger.error("❌ Token non valido:", error);
    return res.status(401).json({ error: "❌ Token non valido" });
  }

  // 🚦 Rate limiting (max 50 richieste ogni 10 minuti per IP)
  const db = admin.firestore();
  const ip =
    req.headers["x-forwarded-for"] ||
    req.connection?.remoteAddress ||
    "unknown_ip";
  const now = Date.now();
  const rateDocRef = db.collection("RateLimits").doc(ip);
  const rateDoc = await rateDocRef.get();

  if (rateDoc.exists && now - rateDoc.data().lastRequest < 10 * 60 * 1000) {
    return res
      .status(429)
      .json({ error: "❌ Troppe richieste. Attendi prima di riprovare." });
  }
  await rateDocRef.set({ lastRequest: now });

  // 📌 Recupero dati da Firestore
  try {
    const snapshot = await db.collection("MarketingReports").get();
    const reports = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString() || "N/A",
    }));

    return res.json(reports);
  } catch (error) {
    functions.logger.error("❌ Errore recupero report marketing:", error);
    return res.status(500).json({
      error: "Errore nel recupero dei dati di marketing",
      details: error.message,
    });
  }
});

// ✅ POST: aggiunta nuovo report marketing
exports.addMarketingReport = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ error: "❌ Metodo non consentito. Usa POST." });
  }

  // 🔑 Verifica token Firebase
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(403).json({ error: "❌ Token mancante" });
  }
  try {
    await admin.auth().verifyIdToken(token);
  } catch (error) {
    functions.logger.error("❌ Token non valido:", error);
    return res.status(401).json({ error: "❌ Token non valido" });
  }

  // 🚦 Rate limiting (max 50 richieste ogni 10 minuti per IP)
  const db = admin.firestore();
  const ip =
    req.headers["x-forwarded-for"] ||
    req.connection?.remoteAddress ||
    "unknown_ip";
  const now = Date.now();
  const rateDocRef = db.collection("RateLimits").doc(ip);
  const rateDoc = await rateDocRef.get();

  if (rateDoc.exists && now - rateDoc.data().lastRequest < 10 * 60 * 1000) {
    return res
      .status(429)
      .json({ error: "❌ Troppe richieste. Attendi prima di riprovare." });
  }
  await rateDocRef.set({ lastRequest: now });

  // 📌 Validazione dati
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

  // 📌 Salvataggio in Firestore
  const newReport = {
    name,
    channel,
    budget: parsedBudget,
    conversions: parsedConversions,
    createdAt: new Date(),
  };

  try {
    const docRef = await db.collection("MarketingReports").add(newReport);
    return res.json({
      id: docRef.id,
      ...newReport,
      createdAt: newReport.createdAt.toISOString(),
    });
  } catch (error) {
    functions.logger.error("❌ Errore aggiunta report marketing:", error);
    return res.status(500).json({
      error: "Errore nell'aggiunta del report di marketing",
      details: error.message,
    });
  }
});
