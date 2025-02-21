const express = require("express");
const router = express.Router();
const admin = require("../firebase"); // Connessione a Firestore

// 📌 API per ottenere la panoramica generale della dashboard
router.get("/overview", async (req, res) => {
  try {
    const db = admin.firestore();

    // Recupera dati da Firestore
    const bookingsSnapshot = await db.collection("Bookings").get();
    const financesSnapshot = await db.collection("FinancialReports").get();

    // Calcolo delle statistiche
    const totalBookings = bookingsSnapshot.size;
    const totalRevenue = financesSnapshot.docs.reduce(
      (sum, doc) => sum + (doc.data().amount || 0),
      0
    );
    const avgRevenuePerBooking =
      totalBookings > 0 ? (totalRevenue / totalBookings).toFixed(2) : 0;

    // Simulazione tasso di occupazione (da migliorare con dati reali)
    const occupiedRooms = totalBookings * 1.5; // Stima basata sulle prenotazioni
    const totalRooms = 100; // Valore statico, può essere migliorato
    const occupancyRate = ((occupiedRooms / totalRooms) * 100).toFixed(2);

    res.json({
      totalRevenue,
      totalBookings,
      occupancyRate,
      avgRevenuePerBooking,
    });
  } catch (error) {
    console.error("Errore nel recupero dei dati della dashboard:", error);
    res
      .status(500)
      .json({ error: "Errore nel recupero dei dati della dashboard" });
  }
});

module.exports = router;
