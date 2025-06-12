const express = require("express");
const admin = require("firebase-admin");
const { verifyToken } = require("../middlewares/verifyToken");

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();
const router = express.Router();

// 📥 Log richieste
router.use((req, res, next) => {
  console.log(`[📊 DashboardOverview] ${req.method} ${req.originalUrl}`);
  next();
});

// 🔐 Middleware: autenticazione
router.use(verifyToken);

// 🚫 Rate Limiting: max 20 richieste ogni 5 minuti per IP
const checkRateLimit = async (req, res, next) => {
  const ip = req.headers["x-forwarded-for"] || req.ip || "unknown_ip";
  const now = Date.now();
  const ref = db.collection("RateLimits").doc(`dashboard_${ip}`);
  const doc = await ref.get();

  let data = doc.exists ? doc.data() : { count: 0, firstRequest: now };

  if (now - data.firstRequest < 5 * 60 * 1000) {
    if (data.count >= 20) {
      return res.status(429).json({ error: "❌ Troppe richieste. Attendi." });
    }
    data.count++;
  } else {
    data = { count: 1, firstRequest: now };
  }

  await ref.set(data);
  next();
};

// 📌 GET /dashboard → overview completa
router.get("/", checkRateLimit, async (req, res) => {
  try {
    const [bookingsSnapshot, financesSnapshot] = await Promise.all([
      db.collection("Bookings").get(),
      db.collection("FinancialReports").get(),
    ]);

    const totalBookings = bookingsSnapshot.size;
    const totalRevenue = financesSnapshot.docs.reduce(
      (sum, doc) => sum + (doc.data().revenue || 0),
      0
    );

    const occupiedRooms = totalBookings * 1.5; // 🔧 Simulazione esempio
    const totalRooms = 100;
    const occupancyRate = ((occupiedRooms / totalRooms) * 100).toFixed(2) + "%";

    const dashboardData = {
      totalBookings,
      totalRevenue,
      occupancyRate,
      avgRevenuePerBooking:
        totalBookings > 0 ? (totalRevenue / totalBookings).toFixed(2) : "0.00",
      recentUpdate: new Date().toISOString(),
    };

    await db
      .collection("Dashboard")
      .doc("overview")
      .set(dashboardData, { merge: true });

    res.status(200).json(dashboardData);
  } catch (error) {
    console.error("❌ Errore dashboard overview:", error);
    res.status(500).json({ error: "Errore generazione overview" });
  }
});

// 📌 POST /dashboard/update → aggiorna manualmente
router.post("/update", async (req, res) => {
  try {
    await db
      .collection("Dashboard")
      .doc("overview")
      .update({ updatedAt: new Date() });

    res.json({ message: "✅ Dashboard aggiornata manualmente." });
  } catch (error) {
    console.error("❌ Errore update dashboard:", error);
    res.status(500).json({ error: "Errore aggiornamento manuale" });
  }
});

module.exports = router;
