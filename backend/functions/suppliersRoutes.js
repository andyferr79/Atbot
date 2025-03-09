const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Middleware verifica token
const verifyToken = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    res.status(403).json({ error: "❌ Token mancante" });
    return false;
  }
  try {
    req.user = await admin.auth().verifyIdToken(token);
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
    res.status(429).json({ error: "❌ Troppe richieste. Riprova più tardi." });
    return false;
  }

  await rateDocRef.set({ lastRequest: now });
  return true;
};

// 📌 Ottiene tutti i fornitori
exports.getSuppliers = functions.https.onRequest(async (req, res) => {
  if (req.method !== "GET")
    return res.status(405).json({ error: "❌ Usa GET." });
  if (!(await verifyToken(req, res))) return;
  if (!(await checkRateLimit(req, res))) return;

  try {
    const snapshot = await db.collection("Suppliers").get();
    const suppliers = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString() || "N/A",
    }));

    res.json({ suppliers });
  } catch (error) {
    functions.logger.error("❌ Errore recupero fornitori:", error);
    res.status(500).json({ error: error.message });
  }
});

// 📌 Aggiunge nuovo fornitore
exports.addSupplier = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST")
    return res.status(405).json({ error: "❌ Usa POST." });
  if (!(await verifyToken(req, res))) return;
  if (!(await checkRateLimit(req, res))) return;

  const { name, contact, email, phone } = req.body;

  if (!name || !contact) {
    return res.status(400).json({ error: "❌ Nome e contatto obbligatori." });
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "❌ Email non valida." });
  }

  if (phone && !/^[0-9\-\+\s\(\)]{7,15}$/.test(phone)) {
    return res.status(400).json({ error: "❌ Telefono non valido." });
  }

  const newSupplier = {
    name,
    contact,
    email: email || null,
    phone: phone || null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  try {
    const docRef = await db.collection("Suppliers").add(newSupplier);
    res.json({
      message: "✅ Fornitore aggiunto con successo",
      id: docRef.id,
    });
  } catch (error) {
    functions.logger.error("❌ Errore aggiunta fornitore:", error);
    res.status(500).json({ error: error.message });
  }
});
