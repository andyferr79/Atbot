const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Inizializza Firebase Admin solo se non già inizializzato
if (!admin.apps.length) {
  admin.initializeApp();
}

// 📌 1) Funzione per ottenere lo stato dei canali OTA (GET /)
exports.getChannelManager = functions.https.onRequest(async (req, res) => {
  // Consenti solo richieste GET
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ error: "❌ Metodo non consentito. Usa GET." });
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

    // ✅ Rate limiting Firestore (max 50 richieste ogni 10 min per IP)
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
      // Finestra di 10 minuti (10 * 60 * 1000)
      if (now - lastRequest < 10 * 60 * 1000) {
        return res
          .status(429)
          .json({ error: "❌ Troppe richieste. Riprova più tardi." });
      }
    }
    await rateRef.set({ lastRequest: now });

    // ✅ Recupero dei dati dalla collezione "ChannelManager"
    const channelSyncSnapshot = await db.collection("ChannelManager").get();
    if (channelSyncSnapshot.empty) {
      return res.json({ channels: [] });
    }

    const channels = channelSyncSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || "N/A",
        status: data.status || "unknown",
        lastSync: data.lastSync ? data.lastSync.toDate().toISOString() : "N/A",
      };
    });

    return res.json({ channels });
  } catch (error) {
    functions.logger.error(
      "❌ Errore nel recupero dei dati del Channel Manager:",
      error
    );
    return res.status(500).json({
      error: "Errore nel recupero dei dati del Channel Manager",
      details: error.message,
    });
  }
});

// 📌 2) Funzione per sincronizzare manualmente con le OTA (POST /sync)
exports.syncChannelManager = functions.https.onRequest(async (req, res) => {
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

    // ✅ Rate limiting Firestore (50 richieste / 10 min)
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
      // Finestra di 10 minuti
      if (now - lastRequest < 10 * 60 * 1000) {
        return res
          .status(429)
          .json({ error: "❌ Troppe richieste. Riprova più tardi." });
      }
    }
    await rateRef.set({ lastRequest: now });

    // ✅ Logica di sincronizzazione
    const { channelName } = req.body;
    if (!channelName) {
      return res
        .status(400)
        .json({ error: "❌ Il nome del canale è obbligatorio." });
    }

    // Creiamo un nuovo doc nella collezione "ChannelManager"
    const newSync = {
      name: channelName,
      status: "syncing",
      lastSync: new Date().toISOString(),
    };
    const docRef = await db.collection("ChannelManager").add(newSync);

    return res.json({
      message: "✅ Sincronizzazione avviata con successo",
      id: docRef.id,
    });
  } catch (error) {
    functions.logger.error(
      "❌ Errore nella sincronizzazione con le OTA:",
      error
    );
    return res.status(500).json({
      error: "Errore nella sincronizzazione con le OTA",
      details: error.message,
    });
  }
});
