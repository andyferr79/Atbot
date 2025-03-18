const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// ✅ Middleware Autenticazione
async function authenticate(req) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) throw { status: 403, message: "❌ Token mancante" };
  try {
    return await admin.auth().verifyIdToken(token);
  } catch (error) {
    functions.logger.error("❌ Token non valido:", error);
    throw { status: 401, message: "❌ Token non valido" };
  }
}

// ✅ Middleware Rate Limiting avanzato
async function checkRateLimit(ip, maxRequests, windowMs) {
  const rateDocRef = db.collection("RateLimits").doc(ip);
  const rateDoc = await rateDocRef.get();
  const now = Date.now();

  let data = rateDoc.exists ? rateDoc.data() : { count: 0, firstRequest: now };

  if (now - data.firstRequest < windowMs) {
    if (data.count >= maxRequests) {
      throw { status: 429, message: "❌ Troppe richieste. Riprova più tardi." };
    }
    data.count++;
  } else {
    data = { count: 1, firstRequest: now };
  }

  await rateDocRef.set(data);
}

// 📌 GET - Ottenere stato delle camere
exports.getHousekeepingStatus = functions.https.onRequest(async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "❌ Usa GET." });
  }

  try {
    await authenticate(req);
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown_ip";
    await checkRateLimit(ip, 50, 10 * 60 * 1000);

    const roomsSnapshot = await db.collection("Rooms").get();

    let totalRooms = 0,
      occupiedRooms = 0,
      availableRooms = 0,
      roomsToClean = 0;
    const roomStatus = [];

    roomsSnapshot.forEach((doc) => {
      const room = doc.data();
      totalRooms++;

      if (room.status === "occupied") occupiedRooms++;
      if (room.status === "available") availableRooms++;
      if (room.status === "toClean") roomsToClean++;

      roomStatus.push({
        id: doc.id,
        roomNumber: room.roomNumber || "N/A",
        status: room.status || "unknown",
        lastCleaned: room.lastCleaned?.toDate().toISOString() || "N/A",
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
    functions.logger.error("❌ Errore recupero camere:", error);
    return res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

// 📌 POST - Aggiungere nuova camera
exports.addRoom = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "❌ Usa POST." });
  }

  try {
    await authenticate(req);
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown_ip";
    await checkRateLimit(ip, 20, 10 * 60 * 1000);

    const { roomNumber, status } = req.body;

    if (!roomNumber || !status) {
      return res.status(400).json({ error: "❌ Campi obbligatori mancanti." });
    }

    const newRoom = {
      roomNumber: req.body.roomNumber,
      status,
      lastCleaned: new Date(),
      createdAt: new Date(),
    };

    const docRef = await db.collection("Rooms").add(newRoom);
    res.json({ id: docRef.id, ...newRoom });
  } catch (error) {
    functions.logger.error("❌ Errore creazione camera:", error);
    return res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

// 📌 PUT - Aggiornare lo stato di una camera
exports.updateRoomStatus = functions.https.onRequest(async (req, res) => {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "❌ Usa PUT." });
  }

  try {
    await authenticate(req);
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown_ip";
    await checkRateLimit(ip, 50, 10 * 60 * 1000);

    const { roomId, status, lastCleaned } = req.body;
    if (!roomId || !status) {
      return res.status(400).json({ error: "❌ roomId e status richiesti." });
    }

    const updates = { status };
    if (lastCleaned) updates.lastCleaned = new Date(lastCleaned);

    await db.collection("Rooms").doc(roomId).update(updates);
    return res.json({ message: "✅ Stato camera aggiornato." });
  } catch (error) {
    functions.logger.error("❌ Errore aggiornamento camera:", error);
    return res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

// 📌 DELETE - Eliminare camera (rimuovere dalla gestione housekeeping)
exports.deleteRoom = functions.https.onRequest(async (req, res) => {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "❌ Usa DELETE." });
  }

  try {
    await authenticate(req);
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown_ip";
    await checkRateLimit(ip, 20, 10 * 60 * 1000);

    const { roomId } = req.query;
    if (!roomId) {
      return res.status(400).json({ error: "❌ roomId richiesto." });
    }

    const roomDoc = await db.collection("Rooms").doc(roomId).get();
    if (!roomDoc.exists) {
      return res.status(404).json({ error: "❌ Camera non trovata." });
    }

    await db.collection("Rooms").doc(roomId).delete();
    return res.json({ message: "✅ Camera eliminata." });
  } catch (error) {
    functions.logger.error("❌ Errore eliminazione camera:", error);
    return res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});
