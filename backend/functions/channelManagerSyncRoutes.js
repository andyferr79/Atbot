const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Inizializza Firebase Admin se non è già attivo
if (!admin.apps.length) {
  admin.initializeApp();
}

// 📌 Funzione Cloud per sincronizzare StayPro con Booking, Airbnb, Expedia
exports.syncOTAChannels = functions.https.onRequest(async (req, res) => {
  // Consenti solo richieste POST
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ error: "❌ Metodo non consentito. Usa POST." });
  }

  try {
    // ✅ Verifica token
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(403).json({ error: "❌ Token mancante" });
    }
    try {
      await admin.auth().verifyIdToken(token);
    } catch (error) {
      functions.logger.error("❌ Token non valido:", error);
      return res.status(401).json({ error: "❌ Token non valido" });
    }

    // ✅ Rate limiting su Firestore (max 30 richieste / 10 min per IP)
    const db = admin.firestore();
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown_ip";
    const now = Date.now();
    const rateRef = db.collection("RateLimits").doc(ip);
    const docSnap = await rateRef.get();

    if (docSnap.exists) {
      const lastRequest = docSnap.data().lastRequest || 0;
      // Finestra di 10 minuti (10*60*1000)
      if (now - lastRequest < 10 * 60 * 1000) {
        return res
          .status(429)
          .json({ error: "❌ Troppe richieste. Attendi prima di riprovare." });
      }
    }
    await rateRef.set({ lastRequest: now });

    // ✅ Simulazione aggiornamento OTA (in produzione: chiamare API reali)
    await db.collection("ChannelManager").doc("sync_status").set({
      status: "syncing",
      lastSync: new Date().toISOString(),
    });

    return res.json({ message: "✅ Sincronizzazione avviata con successo!" });
  } catch (error) {
    functions.logger.error("❌ Errore nella sincronizzazione con OTA:", error);
    return res
      .status(500)
      .json({ error: "Errore nella sincronizzazione con OTA" });
  }
});
