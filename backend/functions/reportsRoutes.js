const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// ✅ Middleware verifica token Firebase
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

// ✅ Middleware per rate limiting Firestore
const checkRateLimit = async (req, res, windowMs = 10 * 60 * 1000) => {
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

// 📌 Recupera tutti i report
exports.getReports = functions.https.onRequest(async (req, res) => {
  if (req.method !== "GET")
    return res.status(405).json({ error: "❌ Usa GET." });
  if (!(await verifyToken(req, res))) return;
  if (!(await checkRateLimit(req, res))) return;

  try {
    const snapshot = await db.collection("Reports").get();
    const reports = snapshot.docs.map((doc) => ({
      id: doc.id,
      type: doc.data().type,
      title: doc.data().title,
      data: doc.data().data,
      createdAt: doc.data().createdAt?.toDate().toISOString() || "N/A",
    }));
    return res.json({ reports });
  } catch (error) {
    functions.logger.error("❌ Errore nel recupero dei report:", error);
    return res.status(500).json({ error: error.message });
  }
});

// 📌 Genera un nuovo report personalizzato
exports.createReport = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST")
    return res.status(405).json({ error: "❌ Usa POST." });
  if (!(await verifyToken(req, res))) return;
  if (!(await checkRateLimit(req, res))) return;

  const { title, type, data } = req.body;

  if (
    !title ||
    typeof title !== "string" ||
    !type ||
    typeof type !== "string" ||
    !data ||
    typeof data !== "object"
  ) {
    return res
      .status(400)
      .json({ error: "❌ Dati inseriti non validi o incompleti." });
  }

  try {
    const newReport = {
      title,
      type,
      data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("Reports").add(newReport);
    return res.json({
      message: "✅ Report generato con successo",
      id: docRef.id,
    });
  } catch (error) {
    functions.logger.error("❌ Errore nella generazione del report:", error);
    return res.status(500).json({ error: error.message });
  }
});
