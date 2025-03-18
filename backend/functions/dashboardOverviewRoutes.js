const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// ✅ Middleware Autenticazione
async function authenticate(req) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) throw { status: 403, message: "❌ Token mancante" };
  try {
    return await admin.auth().verifyIdToken(token);
  } catch (error) {
    functions.logger.error("❌ Token non valido:", error);
    throw { status: 401, message: "❌ Token non valido" };
  }
}

// ✅ Middleware Rate Limiting avanzato
async function checkRateLimit(ip, maxRequests, windowMs) {
  const rateDocRef = admin.firestore().collection("RateLimits").doc(ip);
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

// 📌 GET - Dati Dashboard Overview
exports.getDashboardOverview = functions.https.onRequest(async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "❌ Usa GET." });
  }

  try {
    await authenticate(req);
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown_ip";
    await checkRateLimit(ip, 20, 5 * 60 * 1000); // 20 richieste ogni 5 min

    const db = admin.firestore();
    const [bookingsSnapshot, financesSnapshot] = await Promise.all([
      db.collection("Bookings").get(),
      db.collection("FinancialReports").get(),
    ]);

    const totalBookings = bookingsSnapshot.size;
    const totalRevenue = financesSnapshot.docs.reduce(
      (sum, doc) => sum + (doc.data().revenue || 0),
      0
    );

    // Simulazione calcolo occupancy
    const occupiedRooms = totalBookings * 1.5; // esempio
    const totalRooms = 100;
    const occupancyRate = ((occupiedRooms / totalRooms) * 100).toFixed(2) + "%";

    const avgRevenuePerBooking =
      totalBookings > 0 ? (totalRevenue / totalBookings).toFixed(2) : "0.00";

    const dashboardData = {
      totalBookings,
      totalRevenue,
      occupancyRate,
      recentUpdate: new Date().toISOString(),
    };

    await db
      .collection("Dashboard")
      .doc("overview")
      .set(dashboardData, { merge: true });

    return res.json(dashboardData);
  } catch (error) {
    functions.logger.error("❌ Errore dashboard overview:", error);
    return res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

// 📌 POST - Richiedere aggiornamento manuale dashboard
exports.updateDashboardData = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "❌ Usa POST." });
  }

  try {
    await authenticate(req);
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown_ip";
    await checkRateLimit(ip, 5, 5 * 60 * 1000); // Meno frequente, aggiornamenti manuali

    // Possibile inserire qui logica reale o chiamare altre funzioni di aggiornamento
    await db
      .collection("Dashboard")
      .doc("overview")
      .update({ updatedAt: new Date() });

    res.json({ message: "✅ Dashboard aggiornata manualmente." });
  } catch (error) {
    functions.logger.error("❌ Errore aggiornamento manuale dashboard:", error);
    return res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});
