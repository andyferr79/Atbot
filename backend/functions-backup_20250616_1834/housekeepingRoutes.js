const express = require("express");
const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const router = express.Router();
router.use(express.json());

// ✅ Middleware Autenticazione
async function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(403).json({ error: "❌ Token mancante" });
  try {
    req.user = await admin.auth().verifyIdToken(token);
    next();
  } catch (err) {
    console.error("❌ Token non valido:", err);
    res.status(401).json({ error: "❌ Token non valido" });
  }
}

// ✅ Middleware Rate Limiting
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

// ✅ GET - Stato camere
router.get("/status", authenticate, async (req, res) => {
  try {
    const ip =
      req.headers["x-forwarded-for"] ||
      req.socket?.remoteAddress ||
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

    res.json({
      totalRooms,
      occupiedRooms,
      availableRooms,
      roomsToClean,
      roomStatus,
    });
  } catch (error) {
    console.error("❌ Errore recupero camere:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

// ✅ POST - Aggiungere camera
router.post("/", authenticate, async (req, res) => {
  try {
    const ip =
      req.headers["x-forwarded-for"] ||
      req.socket?.remoteAddress ||
      "unknown_ip";
    await checkRateLimit(ip, 20, 10 * 60 * 1000);

    const { roomNumber, status } = req.body;
    if (!roomNumber || !status) {
      return res.status(400).json({ error: "❌ Campi obbligatori mancanti." });
    }

    const newRoom = {
      roomNumber,
      status,
      lastCleaned: new Date(),
      createdAt: new Date(),
    };

    const docRef = await db.collection("Rooms").add(newRoom);
    res.json({ id: docRef.id, ...newRoom });
  } catch (error) {
    console.error("❌ Errore creazione camera:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

// ✅ PUT - Aggiorna stato camera
router.put("/", authenticate, async (req, res) => {
  try {
    const ip =
      req.headers["x-forwarded-for"] ||
      req.socket?.remoteAddress ||
      "unknown_ip";
    await checkRateLimit(ip, 50, 10 * 60 * 1000);

    const { roomId, status, lastCleaned } = req.body;
    if (!roomId || !status) {
      return res.status(400).json({ error: "❌ roomId e status richiesti." });
    }

    const updates = { status };
    if (lastCleaned) updates.lastCleaned = new Date(lastCleaned);

    await db.collection("Rooms").doc(roomId).update(updates);
    res.json({ message: "✅ Stato camera aggiornato." });
  } catch (error) {
    console.error("❌ Errore aggiornamento camera:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

// ✅ DELETE - Elimina camera
router.delete("/", authenticate, async (req, res) => {
  try {
    const ip =
      req.headers["x-forwarded-for"] ||
      req.socket?.remoteAddress ||
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
    res.json({ message: "✅ Camera eliminata." });
  } catch (error) {
    console.error("❌ Errore eliminazione camera:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

module.exports = router;
