const functions = require("firebase-functions");
const admin = require("firebase-admin");

// ✅ Inizializza Firebase Admin se non è già attivo
if (!admin.apps.length) {
  admin.initializeApp();
}

// 📌 Funzione per ottenere le prenotazioni
exports.getBookingsData = functions.https.onRequest(async (req, res) => {
  // Controlliamo che il metodo sia GET
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ error: "❌ Metodo non consentito. Usa GET." });
  }

  try {
    // ✅ Autenticazione Firebase (Token JWT)
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(403).json({ error: "❌ Token mancante" });
    }
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      functions.logger.info(
        "✅ Token verificato con successo per UID:",
        decodedToken.uid
      );
    } catch (error) {
      functions.logger.error("❌ Token non valido:", error);
      return res.status(401).json({ error: "❌ Token non valido" });
    }

    // ✅ Recupero delle prenotazioni da Firestore
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

      // 🔹 Correzione: Verifica se `checkInDate` e `checkOutDate` esistono ed evita `instanceof`
      const checkInDate =
        booking.checkInDate && typeof booking.checkInDate.toDate === "function"
          ? booking.checkInDate.toDate().toISOString()
          : "N/A";

      const checkOutDate =
        booking.checkOutDate &&
        typeof booking.checkOutDate.toDate === "function"
          ? booking.checkOutDate.toDate().toISOString()
          : "N/A";

      recentBookings.push({
        id: doc.id,
        customerName: booking.customerName || "N/A",
        checkInDate,
        checkOutDate,
        amount: booking.amount || 0,
        status: booking.status || "unknown",
      });
    });

    // Mantiene solo le ultime 5 prenotazioni con checkInDate valido
    recentBookings = recentBookings
      .filter((b) => b.checkInDate !== "N/A")
      .sort((a, b) => new Date(b.checkInDate) - new Date(a.checkInDate))
      .slice(0, 5);

    return res.json({
      totalBookings,
      activeBookings,
      confirmedBookings,
      cancelledBookings,
      recentBookings,
    });
  } catch (error) {
    functions.logger.error("❌ Errore nel recupero delle prenotazioni:", error);
    return res.status(500).json({
      error: "Errore nel recupero delle prenotazioni",
      details: error.message,
    });
  }
});
