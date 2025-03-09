const functions = require("firebase-functions");
const admin = require("firebase-admin");

// ✅ Inizializza Firebase Admin se necessario
if (!admin.apps.length) {
  admin.initializeApp();
}

// 📌 Funzione Cloud per recuperare lo stato delle camere (Housekeeping)
exports.getHousekeepingStatus = functions.https.onRequest(async (req, res) => {
  // Consenti solo richieste GET
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ error: "❌ Metodo non consentito. Usa GET." });
  }

  try {
    // ✅ Verifica Token Firebase
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

    // 📌 Rate limiting su Firestore (max 50 richieste ogni 10 minuti per IP)
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
        return res
          .status(429)
          .json({ error: "❌ Troppe richieste. Riprova più tardi." });
      }
    }
    await rateDocRef.set({ lastRequest: now });

    // 📌 Recupero dati delle camere da Firestore
    const roomsSnapshot = await db.collection("Rooms").get();

    if (roomsSnapshot.empty) {
      return res.json({
        totalRooms: 0,
        occupiedRooms: 0,
        availableRooms: 0,
        roomsToClean: 0,
        roomStatus: [],
      });
    }

    let totalRooms = 0;
    let occupiedRooms = 0;
    let availableRooms = 0;
    let roomsToClean = 0;
    let roomStatus = [];

    roomsSnapshot.forEach((doc) => {
      const room = doc.data();
      totalRooms++;

      if (room.status === "occupied") occupiedRooms++;
      if (room.status === "available") availableRooms++;
      if (room.status === "dirty") roomsToClean++;

      roomStatus.push({
        id: doc.id,
        roomNumber: room.roomNumber || "N/A",
        status: room.status || "unknown",
        lastCleaned: room.lastCleaned
          ? room.lastCleaned.toDate().toISOString()
          : "N/A",
      });
    });

    return res.json({
      totalRooms,
      occupiedRooms,
      availableRooms,
      roomsToClean,
      roomStatus,
    });
  } catch (error) {
    functions.logger.error(
      "❌ Errore nel recupero dello stato delle camere:",
      error
    );
    return res.status(500).json({
      error: "Errore nel recupero dello stato delle camere",
      details: error.message,
    });
  }
});
