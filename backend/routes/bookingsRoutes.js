const express = require("express");
const router = express.Router();
const admin = require("../firebase"); // Connessione a Firestore

// 📌 API per ottenere le prenotazioni
router.get("/", async (req, res) => {
  try {
    const db = admin.firestore();
    const bookingsSnapshot = await db.collection("Bookings").get();

    if (bookingsSnapshot.empty) {
      return res.json({
        totalBookings: 0,
        activeBookings: 0,
        confirmedBookings: 0,
        cancelledBookings: 0,
        recentBookings: [],
      });
    }

    let totalBookings = 0;
    let activeBookings = 0;
    let confirmedBookings = 0;
    let cancelledBookings = 0;
    let recentBookings = [];

    bookingsSnapshot.forEach((doc) => {
      const booking = doc.data();
      totalBookings++;

      if (booking.status === "active") activeBookings++;
      if (booking.status === "confirmed") confirmedBookings++;
      if (booking.status === "cancelled") cancelledBookings++;

      recentBookings.push({
        id: doc.id,
        customerName: booking.customerName || "N/A",
        checkInDate: booking.checkInDate || "N/A",
        checkOutDate: booking.checkOutDate || "N/A",
        amount: booking.amount || 0,
        status: booking.status || "unknown",
      });
    });

    // Mantiene solo le ultime 5 prenotazioni
    recentBookings = recentBookings
      .sort((a, b) => new Date(b.checkInDate) - new Date(a.checkInDate))
      .slice(0, 5);

    res.json({
      totalBookings,
      activeBookings,
      confirmedBookings,
      cancelledBookings,
      recentBookings,
    });
  } catch (error) {
    console.error("❌ Errore nel recupero delle prenotazioni:", error);
    res.status(500).json({ error: "Errore nel recupero delle prenotazioni" });
  }
});

module.exports = router;
