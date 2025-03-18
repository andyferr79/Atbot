const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// ✅ Middleware per verificare il token utente
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

// ✅ Middleware per il rate limiting
const checkRateLimit = async (req, res, windowMs = 60 * 1000) => {
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

// ✅ API per ottenere tutti i report delle prenotazioni
exports.getBookingsReports = functions.https.onRequest(async (req, res) => {
  if (req.method !== "GET")
    return res.status(405).json({ error: "❌ Usa GET." });
  if (!(await verifyToken(req, res))) return;
  if (!(await checkRateLimit(req, res))) return;

  try {
    const snapshot = await db.collection("BookingsReports").get();
    if (snapshot.empty) {
      return res.json([]);
    }

    const reports = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString() || "N/A",
    }));

    res.json({ reports });
  } catch (error) {
    functions.logger.error("❌ Errore nel recupero dei report:", error);
    res.status(500).json({ error: "Errore nel recupero dei report" });
  }
});

// ✅ API per ottenere un singolo report per ID
exports.getBookingReportById = functions.https.onRequest(async (req, res) => {
  if (req.method !== "GET")
    return res.status(405).json({ error: "❌ Usa GET." });
  if (!(await verifyToken(req, res))) return;

  try {
    const { id } = req.query;
    if (!id)
      return res.status(400).json({ error: "❌ ID del report mancante" });

    const reportRef = db.collection("BookingsReports").doc(id);
    const reportDoc = await reportRef.get();

    if (!reportDoc.exists)
      return res.status(404).json({ error: "❌ Report non trovato" });

    res.json({ id: reportDoc.id, ...reportDoc.data() });
  } catch (error) {
    functions.logger.error("❌ Errore nel recupero del report:", error);
    res.status(500).json({ error: "Errore nel recupero del report" });
  }
});

// ✅ API per creare un nuovo report di prenotazioni
exports.createBookingReport = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST")
    return res.status(405).json({ error: "❌ Usa POST." });
  if (!(await verifyToken(req, res))) return;

  try {
    const { reportData, generatedBy } = req.body;
    if (!reportData || !generatedBy) {
      return res
        .status(400)
        .json({ error: "❌ Tutti i campi sono obbligatori." });
    }

    const newReport = {
      reportData,
      generatedBy,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const reportRef = await db.collection("BookingsReports").add(newReport);

    res.json({ message: "✅ Report creato con successo!", id: reportRef.id });
  } catch (error) {
    functions.logger.error("❌ Errore nella creazione del report:", error);
    res.status(500).json({ error: "Errore nella creazione del report" });
  }
});

// ✅ API per aggiornare un report di prenotazioni
exports.updateBookingReport = functions.https.onRequest(async (req, res) => {
  if (req.method !== "PUT")
    return res.status(405).json({ error: "❌ Usa PUT." });
  if (!(await verifyToken(req, res))) return;

  try {
    const { id } = req.query;
    const { reportData } = req.body;

    if (!id)
      return res.status(400).json({ error: "❌ ID del report mancante" });
    if (!reportData)
      return res
        .status(400)
        .json({ error: "❌ Nessun dato fornito per l'aggiornamento" });

    const reportRef = db.collection("BookingsReports").doc(id);
    const reportDoc = await reportRef.get();

    if (!reportDoc.exists)
      return res.status(404).json({ error: "❌ Report non trovato" });

    await reportRef.update({ reportData });

    res.json({ message: "✅ Report aggiornato con successo!" });
  } catch (error) {
    functions.logger.error("❌ Errore nell'aggiornamento del report:", error);
    res.status(500).json({ error: "Errore nell'aggiornamento del report" });
  }
});

// ✅ API per eliminare un report di prenotazioni
exports.deleteBookingReport = functions.https.onRequest(async (req, res) => {
  if (req.method !== "DELETE")
    return res.status(405).json({ error: "❌ Usa DELETE." });
  if (!(await verifyToken(req, res))) return;

  try {
    const { id } = req.query;
    if (!id)
      return res.status(400).json({ error: "❌ ID del report mancante" });

    const reportRef = db.collection("BookingsReports").doc(id);
    const reportDoc = await reportRef.get();

    if (!reportDoc.exists)
      return res.status(404).json({ error: "❌ Report non trovato" });

    await reportRef.delete();

    res.json({ message: "✅ Report eliminato con successo!" });
  } catch (error) {
    functions.logger.error("❌ Errore nell'eliminazione del report:", error);
    res.status(500).json({ error: "Errore nell'eliminazione del report" });
  }
});
