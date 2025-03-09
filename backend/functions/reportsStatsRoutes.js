const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Middleware verifica token Firebase
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
const checkRateLimit = async (req, res, windowMs = 5 * 60 * 1000) => {
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

// Funzione per aggiornare statistiche su Firestore
const updateFirestoreStats = async (stats) => {
  await db.collection("Reports").doc("stats").set(stats, { merge: true });
};

// 📌 Ottiene statistiche generali dei report
exports.getReportsStats = functions.https.onRequest(async (req, res) => {
  if (req.method !== "GET")
    return res.status(405).json({ error: "❌ Usa GET." });
  if (!(await verifyToken(req, res))) return;
  if (!(await checkRateLimit(req, res))) return;

  try {
    // Dati prenotazioni
    const bookingsSnapshot = await db.collection("Bookings").get();
    const totalBookings = bookingsSnapshot.size;

    // Dati finanziari
    const financesSnapshot = await db.collection("FinancialReports").get();
    const totalRevenue = financesSnapshot.docs.reduce(
      (sum, doc) => sum + (doc.data().amount || 0),
      0
    );

    // Dati campagne marketing
    const marketingSnapshot = await db.collection("MarketingReports").get();
    const totalConversions = marketingSnapshot.docs.reduce(
      (sum, doc) => sum + (doc.data().conversions || 0),
      0
    );

    // Calcolo statistiche
    const stats = {
      totalBookings,
      totalRevenue,
      totalConversions,
      avgRevenuePerBooking:
        totalBookings > 0 ? (totalRevenue / totalBookings).toFixed(2) : 0,
      updatedAt: new Date().toISOString(),
    };

    // Salvataggio statistiche su Firestore
    await updateFirestoreStats(stats);

    res.json(stats);
  } catch (error) {
    functions.logger.error("❌ Errore nel recupero delle statistiche:", error);
    res
      .status(500)
      .json({
        error: "Errore nel recupero delle statistiche",
        details: error.message,
      });
  }
});
