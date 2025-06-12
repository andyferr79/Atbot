// 📁 functions/notificationsRoutes.js
const express = require("express");
const admin = require("firebase-admin");
const { verifyToken } = require("./middlewares/verifyToken");
const withRateLimit = require("./middlewares/withRateLimit");

const db = admin.firestore();
const router = express.Router();

// 🔐 Middleware globale
router.use(verifyToken);
router.use(withRateLimit(100, 60 * 1000)); // 100 richieste/minuto

// 📌 GET /notifications → Recupera notifiche dell’utente
router.get("/", async (req, res) => {
  try {
    const snapshot = await db
      .collection("Notifications")
      .where("userId", "==", req.userId)
      .get();

    const notifications = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString(),
    }));

    res.json({ notifications });
  } catch (error) {
    console.error("❌ Errore getNotifications:", error);
    res.status(500).json({ error: "Errore interno" });
  }
});

// 📌 GET /notifications/unread-count → Notifiche non lette totali
router.get("/unread-count", async (req, res) => {
  try {
    const snapshot = await db
      .collection("Notifications")
      .where("userId", "==", req.userId)
      .where("status", "==", "unread")
      .get();

    res.json({ unreadCount: snapshot.size });
  } catch (error) {
    console.error("❌ Errore unread-count:", error);
    res.status(500).json({ error: "Errore interno" });
  }
});

// 📌 GET /notifications/unread-by-type?type=ai → Non letti per tipo
router.get("/unread-by-type", async (req, res) => {
  try {
    const type = req.query.type || "ai";
    const snapshot = await db
      .collection("Notifications")
      .where("userId", "==", req.userId)
      .where("status", "==", "unread")
      .where("type", "==", type)
      .get();

    res.json({ unreadCount: snapshot.size, type });
  } catch (error) {
    console.error("❌ Errore unread-by-type:", error);
    res.status(500).json({ error: "Errore interno" });
  }
});

// 📌 POST /notifications → Crea nuova notifica
router.post("/", async (req, res) => {
  try {
    const { userId, message, type } = req.body;
    if (!userId || !message || !type) {
      return res.status(400).json({ error: "❌ Dati mancanti" });
    }

    const newNotification = {
      userId,
      message,
      type,
      status: "unread",
      createdAt: new Date(),
    };

    const docRef = await db.collection("Notifications").add(newNotification);
    res.status(201).json({ id: docRef.id, ...newNotification });
  } catch (error) {
    console.error("❌ Errore creazione notifica:", error);
    res.status(500).json({ error: "Errore interno" });
  }
});

// 📌 PUT /notifications/read → Segna notifica come letta
router.put("/read", async (req, res) => {
  try {
    const { notificationId } = req.body;
    if (!notificationId) {
      return res.status(400).json({ error: "❌ notificationId richiesto" });
    }

    await db
      .collection("Notifications")
      .doc(notificationId)
      .update({ status: "read" });

    res.json({ message: "✅ Notifica letta" });
  } catch (error) {
    console.error("❌ Errore segna come letta:", error);
    res.status(500).json({ error: "Errore interno" });
  }
});

// 📌 PUT /notifications/read-all → Segna tutte come lette
router.put("/read-all", async (req, res) => {
  try {
    const snapshot = await db
      .collection("Notifications")
      .where("userId", "==", req.userId)
      .where("status", "!=", "read")
      .get();

    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.update(doc.ref, { status: "read" }));
    await batch.commit();

    res.json({ message: "✅ Tutte le notifiche lette" });
  } catch (error) {
    console.error("❌ Errore read-all:", error);
    res.status(500).json({ error: "Errore interno" });
  }
});

// 📌 DELETE /notifications/:id → Elimina notifica
router.delete("/:id", async (req, res) => {
  try {
    const notificationId = req.params.id;
    if (!notificationId) {
      return res.status(400).json({ error: "❌ ID mancante" });
    }

    await db.collection("Notifications").doc(notificationId).delete();
    res.json({ message: "✅ Notifica eliminata" });
  } catch (error) {
    console.error("❌ Errore deleteNotification:", error);
    res.status(500).json({ error: "Errore interno" });
  }
});

module.exports = router;
