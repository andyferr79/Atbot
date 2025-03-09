const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

// ✅ Inizializzazione Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

// 📌 URL backend AI (attualmente locale per test)
const AI_BACKEND_URL = "http://127.0.0.1:8000";

// 📌 Funzione Cloud per generare la pianificazione ottimizzata delle pulizie
exports.generateHousekeepingSchedule = functions.https.onRequest(
  async (req, res) => {
    if (req.method !== "GET") {
      return res
        .status(405)
        .json({ error: "❌ Metodo non consentito. Usa GET." });
    }

    try {
      // 🔑 Verifica token Firebase
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

      // 🚦 Rate limiting via Firestore (max 30 richieste ogni 10 min per IP)
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
        if (now - lastRequest < 10 * 60 * 1000) {
          return res.status(429).json({
            error: "❌ Troppe richieste. Attendi prima di riprovare.",
          });
        }
      }
      await rateDocRef.set({ lastRequest: now });

      // 📌 Recupera dati prenotazioni da Firestore
      const bookingsSnapshot = await db.collection("Bookings").get();
      const bookingsData = bookingsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        checkInDate: doc.data().checkInDate?.toDate().toISOString(),
        checkOutDate: doc.data().checkOutDate?.toDate().toISOString(),
      }));

      // 📡 Chiamata all'AI per ottimizzare la pianificazione pulizie
      const aiResponse = await axios.post(
        `${AI_BACKEND_URL}/housekeeping/optimize`,
        { bookingsData }
      );

      if (aiResponse.status !== 200 || !aiResponse.data) {
        throw new Error("Risposta non valida dal backend AI.");
      }

      // ✅ Restituisce pianificazione ottimizzata
      return res.json({
        message: "✅ Pianificazione pulizie generata con successo!",
        schedule: aiResponse.data.schedule,
      });
    } catch (error) {
      functions.logger.error(
        "❌ Errore generazione pianificazione pulizie:",
        error
      );
      return res.status(500).json({
        error: "Errore generazione pianificazione pulizie",
        details: error.message,
      });
    }
  }
);
