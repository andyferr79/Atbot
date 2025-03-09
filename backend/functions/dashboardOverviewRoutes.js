const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Inizializza Firebase Admin se non è già attivo
if (!admin.apps.length) {
  admin.initializeApp();
}

// ✅ Funzione Cloud per ottenere i dati della dashboard in tempo reale
exports.getDashboardOverview = functions.https.onRequest(async (req, res) => {
  // Consenti solo richieste GET
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ error: "❌ Metodo non consentito. Usa GET." });
  }

  try {
    // ✅ Rate limiting con Firestore (max 50 richieste ogni 5 min)
    const db = admin.firestore();
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown_ip";
    const now = Date.now();
    const rateDocRef = db.collection("RateLimits").doc(ip);
    const rateDoc = await rateDocRef.get();

    if (rateDoc.exists) {
      const lastRequest = rateDoc.data().lastRequest || 0;
      // 5 minuti = 5 * 60 * 1000
      if (now - lastRequest < 5 * 60 * 1000) {
        return res
          .status(429)
          .json({ error: "❌ Troppe richieste. Attendi prima di riprovare." });
      }
    }
    await rateDocRef.set({ lastRequest: now });

    // Funzione locale per aggiornare Firestore
    const updateFirestoreDashboard = async (dashboardData) => {
      await db
        .collection("Dashboard")
        .doc("overview")
        .set(dashboardData, { merge: true });
    };

    // Recupero dati da Firestore
    const bookingsSnapshot = await db.collection("Bookings").get();
    const financesSnapshot = await db.collection("FinancialReports").get();

    if (bookingsSnapshot.empty && financesSnapshot.empty) {
      const emptyData = {
        totalRevenue: 0,
        totalBookings: 0,
        occupancyRate: "0.00%",
        avgRevenuePerBooking: "0.00",
        updatedAt: new Date().toISOString(),
      };
      // Salviamo ugualmente su Firestore se vuoi tenere traccia
      await updateFirestoreDashboard(emptyData);
      return res.json(emptyData);
    }

    // Calcolo statistiche
    const totalBookings = bookingsSnapshot.size;
    const totalRevenue = financesSnapshot.docs.reduce(
      (sum, doc) => sum + (doc.data().amount || 0),
      0
    );
    const avgRevenuePerBooking =
      totalBookings > 0 ? (totalRevenue / totalBookings).toFixed(2) : "0.00";

    // Simulazione tasso di occupazione (esempio)
    const occupiedRooms = totalBookings * 1.5; // logica fittizia
    const totalRooms = 100;
    const occupancyRate =
      totalRooms > 0
        ? ((occupiedRooms / totalRooms) * 100).toFixed(2) + "%"
        : "0.00%";

    const dashboardData = {
      totalRevenue,
      totalBookings,
      occupancyRate,
      avgRevenuePerBooking,
      updatedAt: new Date().toISOString(),
    };

    // ✅ Salva i dati su Firestore
    await updateFirestoreDashboard(dashboardData);

    return res.json(dashboardData);
  } catch (error) {
    functions.logger.error(
      "❌ Errore nel recupero dei dati della dashboard:",
      error
    );
    return res.status(500).json({
      error: "Errore nel recupero dei dati della dashboard",
      details: error.message,
    });
  }
});
