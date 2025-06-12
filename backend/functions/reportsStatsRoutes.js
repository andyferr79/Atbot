// 📁 functions/reportsStatsRoutes.js
const express = require("express");
const { admin } = require("./firebase");
const { verifyToken } = require("./middlewares/verifyToken");
const withRateLimit = require("./middlewares/withRateLimit");

const db = admin.firestore();
const router = express.Router();

// 🔐 Middleware
router.use(verifyToken);
router.use(withRateLimit(60, 5 * 60 * 1000)); // Max 60 richieste ogni 5 minuti

// 📌 GET /reports/stats → Statistiche globali
router.get("/", async (req, res) => {
  try {
    const [bookingsSnapshot, financesSnapshot, marketingSnapshot] =
      await Promise.all([
        db.collection("Bookings").where("userId", "==", req.userId).get(),
        db
          .collection("FinancialReports")
          .where("userId", "==", req.userId)
          .get(),
        db
          .collection("MarketingReports")
          .where("userId", "==", req.userId)
          .get(),
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

    await db
      .collection("Reports")
      .doc("stats-" + req.userId)
      .set(stats, { merge: true });

    res.json(stats);
  } catch (error) {
    console.error("❌ Errore getReportsStats:", error);
    res.status(500).json({ error: "Errore nel calcolo delle statistiche." });
  }
});

// 📌 POST /reports/stats → Aggiorna manualmente le statistiche
router.post("/", async (req, res) => {
  try {
    const { totalBookings, totalRevenue, totalConversions } = req.body;

    if (
      [totalBookings, totalRevenue, totalConversions].some(
        (v) => v == null || isNaN(v)
      )
    ) {
      return res.status(400).json({ error: "❌ Campi numerici obbligatori." });
    }

    const stats = {
      totalBookings: parseInt(totalBookings, 10),
      totalRevenue: parseFloat(totalRevenue),
      totalConversions: parseInt(totalConversions, 10),
      avgRevenuePerBooking:
        totalBookings > 0 ? (totalRevenue / totalBookings).toFixed(2) : "0.00",
      updatedAt: new Date().toISOString(),
    };

    await db
      .collection("Reports")
      .doc("stats-" + req.userId)
      .set(stats, { merge: true });

    res.json({ message: "✅ Statistiche aggiornate.", stats });
  } catch (error) {
    console.error("❌ Errore updateReportsStats:", error);
    res.status(500).json({ error: "Errore aggiornamento statistiche." });
  }
});

module.exports = router;
