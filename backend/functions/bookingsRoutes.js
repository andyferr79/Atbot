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
      // Se serve, puoi salvare `decodedToken` in `req.user`.
    } catch (error) {
      functions.logger.error("❌ Token non valido:", error);
      return res.status(401).json({ error: "❌ Token non valido" });
    }

    // ✅ Rate limiting con Firestore
    const db = admin.firestore();
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown_ip";
    const rateLimitRef = db.collection("RateLimits").doc(ip);

    const now = Date.now();
    const rateLimitDoc = await rateLimitRef.get();
    // Esempio: blocca se arriva un'altra richiesta entro 15 minuti (15 * 60 * 1000).
    // Se preferisci un'altra soglia o un contatore incrementale, adegua la logica.
    if (rateLimitDoc.exists) {
      const lastRequest = rateLimitDoc.data().lastRequest;
      if (now - lastRequest < 15 * 60 * 1000) {
        return res
          .status(429)
          .json({ error: "❌ Troppe richieste. Riprova più tardi." });
      }
    }
    // Aggiorna il timestamp dell'ultima richiesta
    await rateLimitRef.set({ lastRequest: now });

    // ✅ Recupero delle prenotazioni da Firestore
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
        checkInDate: booking.checkInDate
          ? booking.checkInDate.toDate().toISOString()
          : "N/A",
        checkOutDate: booking.checkOutDate
          ? booking.checkOutDate.toDate().toISOString()
          : "N/A",
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
