const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Inizializza Firebase Admin se non è già attivo
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// ✅ Middleware di autenticazione token (riutilizzabile)
async function authenticateRequest(req) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    throw { status: 403, message: "❌ Token mancante" };
  }
  try {
    return await admin.auth().verifyIdToken(token);
  } catch (error) {
    functions.logger.error("❌ Token non valido:", error);
    throw { status: 401, message: "❌ Token non valido" };
  }
}

// ✅ Middleware Rate Limiting per IP (riutilizzabile)
async function checkRateLimit(ip, maxRequests, windowMs) {
  const rateRef = db.collection("RateLimits").doc(ip);
  const docSnap = await rateRef.get();
  const now = Date.now();

  if (docSnap.exists) {
    const requestTimestamps = docSnap.data().requests || [];

    // Filtra solo richieste negli ultimi 'windowMs'
    const recentRequests = requestTimestamps.filter(
      (timestamp) => now - timestamp < windowMs
    );

    if (recentRequests.length >= maxRequests) {
      throw {
        status: 429,
        message: "❌ Troppe richieste. Attendi prima di riprovare.",
      };
    }

    // Aggiorna richieste recenti
    recentRequests.push(now);
    await rateRef.set({ requests: recentRequests });
  } else {
    await rateRef.set({ requests: [now] });
  }
}

// 📌 Funzione Cloud aggiornata per sincronizzare OTA
exports.syncOTAChannels = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ error: "❌ Metodo non consentito. Usa POST." });
  }

  try {
    // ✅ Autenticazione richiesta
    await authenticateRequest(req);

    // ✅ Rate limiting più preciso: Max 30 richieste in 10 minuti
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown_ip";
    await checkRateLimit(ip, 30, 10 * 60 * 1000); // 30 richieste ogni 10 minuti

    // ✅ Aggiornamento stato OTA (Qui si integrano le API reali)
    await db.collection("ChannelManager").doc("sync_status").set({
      status: "syncing",
      lastSync: admin.firestore.Timestamp.now(),
      requestedBy: ip,
    });

    functions.logger.info(`✅ Sincronizzazione avviata da IP: ${ip}`);

    return res.json({ message: "✅ Sincronizzazione avviata con successo!" });
  } catch (error) {
    functions.logger.error("❌ Errore nella sincronizzazione OTA:", error);

    const status = error.status || 500;
    const message = error.message || "Errore interno del server.";

    return res.status(status).json({ error: message });
  }
});
