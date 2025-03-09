const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Middleware: verifica token Firebase
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

// Middleware: Rate limiting Firestore
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

// 📌 Ottiene tutti i report dei fornitori
exports.getSuppliersReports = functions.https.onRequest(async (req, res) => {
  if (req.method !== "GET")
    return res.status(405).json({ error: "❌ Usa GET." });
  if (!(await verifyToken(req, res))) return;
  if (!(await checkRateLimit(req, res))) return;

  try {
    const snapshot = await db.collection("SuppliersReports").get();
    const reports = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      reportDate: doc.data().reportDate?.toDate().toISOString() || "N/A",
      createdAt: doc.data().createdAt?.toDate().toISOString() || "N/A",
    }));

    return res.json({ reports });
  } catch (error) {
    functions.logger.error("❌ Errore recupero report fornitori:", error);
    res.status(500).json({ error: error.message });
  }
});

// 📌 Aggiunge un nuovo report fornitore
exports.addSupplierReport = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST")
    return res.status(405).json({ error: "❌ Usa POST." });
  if (!(await verifyToken(req, res))) return;
  if (!(await checkRateLimit(req, res))) return;

  const { supplierName, totalSpent, contractStatus, reportDate } = req.body;

  if (!supplierName || !totalSpent || !contractStatus || !reportDate) {
    return res
      .status(400)
      .json({ error: "❌ Tutti i campi sono obbligatori." });
  }

  const parsedTotalSpent = parseFloat(totalSpent);
  if (isNaN(parsedTotalSpent) || parsedTotalSpent <= 0) {
    return res
      .status(400)
      .json({ error: "❌ Il totale speso deve essere positivo." });
  }

  const newReport = {
    supplierName,
    totalSpent: parsedTotalSpent,
    contractStatus,
    reportDate: new Date(reportDate),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  try {
    const docRef = await db.collection("SuppliersReports").add(newReport);
    res.json({
      message: "✅ Report fornitore aggiunto con successo",
      id: docRef.id,
      reportDate: newReport.reportDate.toISOString(),
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    functions.logger.error("❌ Errore aggiunta report fornitore:", error);
    res.status(500).json({ error: error.message });
  }
});
