const express = require("express");
const router = express.Router();
const admin = require("../firebase"); // Connessione a Firestore

// 📌 API per ottenere lo stato delle camere e housekeeping
router.get("/", async (req, res) => {
  try {
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
        lastCleaned: room.lastCleaned || "N/A",
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
    console.error("❌ Errore nel recupero dello stato delle camere:", error);
    res
      .status(500)
      .json({ error: "Errore nel recupero dello stato delle camere" });
  }
});

module.exports = router;
