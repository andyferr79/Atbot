const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// ✅ Middleware autenticazione riutilizzabile
async function authenticate(req) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) throw { status: 403, message: "❌ Token mancante" };
  try {
    await admin.auth().verifyIdToken(token);
  } catch (error) {
    functions.logger.error("❌ Token non valido:", error);
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

// ✅ Funzione per aggiornare statistiche
const updateFirestoreStats = async (stats) => {
  await db.collection("Reports").doc("stats").set(stats, { merge: true });
};

// 📌 GET - Recupera statistiche generali dei report
exports.getReportsStats = functions.https.onRequest(async (req, res) => {
  if (req.method !== "GET")
    return res.status(405).json({ error: "❌ Usa GET." });

  try {
    await authenticate(req);
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown_ip";
    await checkRateLimit(ip, 50, 5 * 60 * 1000);

    const [bookingsSnapshot, financesSnapshot, marketingSnapshot] =
      await Promise.all([
        db.collection("Bookings").get(),
        db.collection("FinancialReports").get(),
        db.collection("MarketingReports").get(),
      ]);

    const totalBookings = bookingsSnapshot.size;

    const totalRevenue = financesSnapshot.docs.reduce(
      (sum, doc) => sum + (doc.data().amount || 0),
      0
    );

    const totalConversions = marketingSnapshot.docs.reduce(
      (sum, doc) => sum + (doc.data().conversions || 0),
      0
    );

    const avgRevenuePerBooking =
      totalBookings > 0 ? (totalRevenue / totalBookings).toFixed(2) : "0.00";

    const stats = {
      totalBookings,
      totalRevenue,
      totalConversions,
      avgRevenuePerBooking,
      updatedAt: new Date().toISOString(),
    };

    await updateFirestoreStats(stats);

    res.json(stats);
  } catch (error) {
    functions.logger.error("❌ Errore recupero statistiche:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

// 📌 POST - Aggiornamento manuale delle statistiche (facoltativo)
exports.updateReportsStats = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST")
    return res.status(405).json({ error: "❌ Usa POST." });

  try {
    await authenticate(req);
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown_ip";
    await checkRateLimit(ip, 20, 5 * 60 * 1000);

    const { totalBookings, totalRevenue, totalConversions } = req.body;

    if (
      [totalBookings, totalRevenue, totalConversions].some(
        (v) => v == null || isNaN(v)
      )
    ) {
      return res
        .status(400)
        .json({ error: "❌ Tutti i campi numerici sono obbligatori." });
    }

    const stats = {
      totalBookings: parseInt(totalBookings, 10),
      totalRevenue: parseFloat(totalRevenue),
      totalConversions: parseInt(totalConversions, 10),
      avgRevenuePerBooking:
        parseInt(totalBookings, 10) > 0
          ? (parseFloat(totalRevenue) / parseInt(totalBookings, 10)).toFixed(2)
          : "0.00",
      updatedAt: new Date().toISOString(),
    };

    await updateFirestoreStats(stats);
    res.json({ message: "✅ Statistiche aggiornate manualmente.", stats });
  } catch (error) {
    functions.logger.error("❌ Errore aggiornamento statistiche:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});
