const express = require("express");
const router = express.Router();
const admin = require("../firebase"); // Connessione a Firestore

// 📌 API per ottenere le notifiche e gli alert
router.get("/", async (req, res) => {
  try {
    const db = admin.firestore();
    const notificationsSnapshot = await db.collection("Notifications").get();

    if (notificationsSnapshot.empty) {
      return res.json({ notifications: [] });
    }

    let notifications = [];

    notificationsSnapshot.forEach((doc) => {
      const notification = doc.data();
      notifications.push({
        id: doc.id,
        type: notification.type || "general",
        message: notification.message || "Nessun messaggio",
        createdAt: notification.createdAt || "N/A",
        status: notification.status || "unread",
      });
    });

    res.json({ notifications });
  } catch (error) {
    console.error("❌ Errore nel recupero delle notifiche:", error);
    res.status(500).json({ error: "Errore nel recupero delle notifiche" });
  }
});

// 📌 API per contrassegnare una notifica come letta
router.put("/read/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = admin.firestore();
    await db.collection("Notifications").doc(id).update({ status: "read" });
    res.json({ message: "✅ Notifica contrassegnata come letta", id });
  } catch (error) {
    console.error("❌ Errore nell'aggiornamento della notifica:", error);
    res.status(500).json({ error: "Errore nell'aggiornamento della notifica" });
  }
});

module.exports = router;
