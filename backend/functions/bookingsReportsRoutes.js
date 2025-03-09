const functions = require("firebase-functions");
const admin = require("firebase-admin");

// ✅ Inizializza Firebase Admin se non è già attivo
if (!admin.apps.length) {
  admin.initializeApp();
}

// ✅ Funzione Cloud per ottenere il report prenotazioni
exports.getBookingsReport = functions.https.onRequest(async (req, res) => {
  // ➜ Controllo metodo HTTP
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

    // Verifica del token
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      // Se serve, puoi usare decodedToken per logiche aggiuntive, es.: req.user = decodedToken;
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

    // Esempio: blocca una richiesta se effettuata nell'ultimo 1 minuto (60.000 ms).
    // Se preferisci una soglia differente (es. 10 minuti), puoi modificare la logica.
    if (rateLimitDoc.exists) {
      const lastRequest = rateLimitDoc.data().lastRequest || 0;
      // Esempio: una richiesta ogni 60 secondi
      if (now - lastRequest < 60 * 1000) {
        return res
          .status(429)
          .json({ error: "❌ Troppe richieste. Attendi prima di riprovare." });
      }
    }

    // Aggiorna il timestamp dell'ultima richiesta
    await rateLimitRef.set({ lastRequest: now });

    // ✅ Recupero dati da Firestore (collezione "Bookings")
    const snapshot = await db.collection("Bookings").get();

    if (snapshot.empty) {
      functions.logger.warn("⚠️ Nessuna prenotazione trovata.");
      return res.json([]);
    }

    // Mappatura dei documenti in un array di oggetti
    const bookingsReports = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt
          ? data.createdAt.toDate().toISOString()
          : null,
        checkInDate: data.checkInDate
          ? data.checkInDate.toDate().toISOString()
          : null,
        checkOutDate: data.checkOutDate
          ? data.checkOutDate.toDate().toISOString()
          : null,
      };
    });

    functions.logger.info(
      `✅ Recuperate ${bookingsReports.length} prenotazioni.`
    );
    return res.json(bookingsReports);
  } catch (error) {
    functions.logger.error(
      "❌ Errore nel recupero del report prenotazioni:",
      error
    );
    return res.status(500).json({
      error: "Errore nel recupero del report prenotazioni",
      details: error.message,
    });
  }
});
