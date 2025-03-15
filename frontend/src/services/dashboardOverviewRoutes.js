const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

// ✅ Inizializza Firebase Admin se non è già stato inizializzato
if (!admin.apps.length) {
  admin.initializeApp();
}

// ✅ Funzione per ottenere la panoramica della dashboard
exports.getDashboardOverview = onRequest(async (req, res) => {
  try {
    const db = admin.firestore();

    // 🔹 Recupera dati da Firestore
    const bookingsSnapshot = await db.collection("Bookings").get();
    const customersSnapshot = await db.collection("Customers").get();
    const financesSnapshot = await db.collection("FinancialReports").get();

    // 🔹 Calcola statistiche della dashboard
    const totalBookings = bookingsSnapshot.size;
    const totalRevenue = financesSnapshot.docs.reduce(
      (sum, doc) => sum + (doc.data().amount || 0),
      0
    );
    const avgRevenuePerBooking =
      totalBookings > 0 ? (totalRevenue / totalBookings).toFixed(2) : 0;

    // 🔹 Tasso di occupazione camere (stima)
    const occupiedRooms = totalBookings * 1.5;
    const totalRooms = 100; // Modificabile dinamicamente
    const occupancyRate = ((occupiedRooms / totalRooms) * 100).toFixed(2);

    // 🔹 Numero clienti attivi
    const activeCustomers = customersSnapshot.size;

    // ✅ Restituisce la risposta
    res.json({
      totalRevenue,
      totalBookings,
      occupancyRate,
      avgRevenuePerBooking,
      activeCustomers,
    });
  } catch (error) {
    console.error("❌ Errore nel recupero dei dati della dashboard:", error);
    res.status(500).json({
      error: "Errore nel recupero dei dati della dashboard",
      details: error.message,
    });
  }
});
