const express = require("express");
const router = express.Router();
const admin = require("../firebase");
const rateLimit = require("express-rate-limit");
const winston = require("winston");

// ✅ Configurazione del logging avanzato
const logger = winston.createLogger({
  level: "error",
  format: winston.format.json(),
  transports: [new winston.transports.File({ filename: "logs/errors.log" })],
});

// ✅ Middleware per limitare le richieste API (Max 50 richieste per IP ogni 10 minuti)
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 50,
  message: "❌ Troppe richieste. Riprova più tardi.",
});

// ✅ Middleware di autenticazione Firebase
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(403).json({ error: "❌ Token mancante" });

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    logger.error("❌ Token non valido:", error);
    return res.status(401).json({ error: "❌ Token non valido" });
  }
};

// 📌 API per ottenere lo stato delle camere e housekeeping
router.get("/", limiter, verifyToken, async (req, res) => {
  try {
    if (!admin.apps.length) {
      throw new Error("Firestore non inizializzato correttamente.");
    }

    const db = admin.firestore();
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

    res.json({
      totalRooms,
      occupiedRooms,
      availableRooms,
      roomsToClean,
      roomStatus,
    });
  } catch (error) {
    logger.error("❌ Errore nel recupero dello stato delle camere:", error);
    res
      .status(500)
      .json({
        error: "Errore nel recupero dello stato delle camere",
        details: error.message,
      });
  }
});

module.exports = router;
