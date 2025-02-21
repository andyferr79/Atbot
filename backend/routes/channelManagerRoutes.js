const express = require("express");
const router = express.Router();
const admin = require("../firebase"); // Connessione a Firestore

// 📌 API per ottenere lo stato della sincronizzazione con i portali OTA
router.get("/", async (req, res) => {
  try {
    const db = admin.firestore();
    const channelSyncSnapshot = await db.collection("ChannelManager").get();

    if (channelSyncSnapshot.empty) {
      return res.json({ channels: [] });
    }

    let channels = [];

    channelSyncSnapshot.forEach((doc) => {
      const channel = doc.data();
      channels.push({
        id: doc.id,
        name: channel.name || "N/A",
        status: channel.status || "unknown",
        lastSync: channel.lastSync || "N/A",
      });
    });

    res.json({ channels });
  } catch (error) {
    console.error(
      "❌ Errore nel recupero dei dati del Channel Manager:",
      error
    );
    res
      .status(500)
      .json({ error: "Errore nel recupero dei dati del Channel Manager" });
  }
});

// 📌 API per sincronizzare manualmente con le OTA
router.post("/sync", async (req, res) => {
  try {
    const { channelName } = req.body;
    if (!channelName) {
      return res
        .status(400)
        .json({ error: "❌ Il nome del canale è obbligatorio." });
    }

    const db = admin.firestore();
    const newSync = {
      name: channelName,
      status: "syncing",
      lastSync: new Date().toISOString(),
    };
    const docRef = await db.collection("ChannelManager").add(newSync);

    res.json({
      message: "✅ Sincronizzazione avviata con successo",
      id: docRef.id,
    });
  } catch (error) {
    console.error("❌ Errore nella sincronizzazione con le OTA:", error);
    res.status(500).json({ error: "Errore nella sincronizzazione con le OTA" });
  }
});

module.exports = router;
