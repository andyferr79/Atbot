const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Middleware per verifica token
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

// 📌 Ottiene preferenze generali
exports.getPreferences = functions.https.onRequest(async (req, res) => {
  if (req.method !== "GET")
    return res.status(405).json({ error: "❌ Usa GET." });
  if (!(await verifyToken(req, res))) return;
  if (!(await checkRateLimit(req, res))) return;

  try {
    const doc = await db.collection("Settings").doc("preferences").get();
    if (!doc.exists)
      return res.status(404).json({ error: "Preferenze non trovate" });
    res.json(doc.data());
  } catch (error) {
    functions.logger.error("❌ Errore recupero preferenze:", error);
    res.status(500).json({ error: error.message });
  }
});

// 📌 Aggiorna preferenze generali
exports.updatePreferences = functions.https.onRequest(async (req, res) => {
  if (req.method !== "PUT")
    return res.status(405).json({ error: "❌ Usa PUT." });
  if (!(await verifyToken(req, res))) return;
  if (!(await checkRateLimit(req, res))) return;

  const preferences = req.body;
  if (!preferences || typeof preferences !== "object") {
    return res.status(400).json({ error: "Dati preferenze non validi." });
  }

  try {
    await db
      .collection("Settings")
      .doc("preferences")
      .set(preferences, { merge: true });
    res.json({ message: "✅ Preferenze aggiornate con successo." });
  } catch (error) {
    functions.logger.error("❌ Errore aggiornamento preferenze:", error);
    res.status(500).json({ error: error.message });
  }
});

// 📌 Ottiene configurazione struttura
exports.getStructureSettings = functions.https.onRequest(async (req, res) => {
  if (req.method !== "GET")
    return res.status(405).json({ error: "❌ Usa GET." });
  if (!(await verifyToken(req, res))) return;
  if (!(await checkRateLimit(req, res))) return;

  try {
    const doc = await db.collection("Settings").doc("structure").get();
    if (!doc.exists)
      return res
        .status(404)
        .json({ error: "Configurazione struttura non trovata" });
    res.json(doc.data());
  } catch (error) {
    functions.logger.error(
      "❌ Errore recupero configurazione struttura:",
      error
    );
    res.status(500).json({ error: error.message });
  }
});

// 📌 Aggiorna configurazione struttura
exports.updateStructureSettings = functions.https.onRequest(
  async (req, res) => {
    if (req.method !== "PUT")
      return res.status(405).json({ error: "❌ Usa PUT." });
    if (!(await verifyToken(req, res))) return;
    if (!(await checkRateLimit(req, res))) return;

    const structure = req.body;
    if (!structure || typeof structure !== "object") {
      return res.status(400).json({ error: "❌ Dati struttura non validi." });
    }

    try {
      await db
        .collection("Settings")
        .doc("structure")
        .set(structure, { merge: true });
      res.json({
        message: "✅ Configurazione struttura aggiornata con successo.",
      });
    } catch (error) {
      functions.logger.error("❌ Errore aggiornamento struttura:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// 📌 Ottiene impostazioni di sicurezza
exports.getSecuritySettings = functions.https.onRequest(async (req, res) => {
  if (req.method !== "GET")
    return res.status(405).json({ error: "❌ Usa GET." });
  if (!(await verifyToken(req, res))) return;
  if (!(await checkRateLimit(req, res))) return;

  try {
    const doc = await db.collection("Settings").doc("security").get();
    if (!doc.exists)
      return res
        .status(404)
        .json({ error: "Impostazioni sicurezza non trovate" });
    res.json(doc.data());
  } catch (error) {
    functions.logger.error("❌ Errore recupero impostazioni sicurezza:", error);
    res.status(500).json({ error: error.message });
  }
});
