// 📁 functions/roomsRoutes.js
const express = require("express");
const { admin } = require("../firebase");
const { verifyToken } = require("../middlewares/verifyToken");
const withRateLimit = require("./middlewares/withRateLimit");

const db = admin.firestore();
const router = express.Router();

// 🔐 Middleware
router.use(verifyToken);
router.use(withRateLimit(100, 10 * 60 * 1000)); // 100 richieste ogni 10 minuti

// 📌 GET /rooms → Recupera tutte le camere
router.get("/", async (req, res) => {
  try {
    const snapshot = await db
      .collection("Rooms")
      .where("userId", "==", req.userId)
      .get();

    const rooms = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString() || null,
    }));

    res.json({ rooms });
  } catch (error) {
    console.error("❌ Errore getRooms:", error);
    res.status(500).json({ error: "Errore nel recupero delle camere." });
  }
});

// 📌 POST /rooms → Crea nuova camera
router.post("/", async (req, res) => {
  try {
    const { name, type, price, status } = req.body;
    if (!name || !type || !price || !status) {
      return res.status(400).json({ error: "❌ Tutti i campi obbligatori." });
    }

    const newRoom = {
      name,
      type,
      price: parseFloat(price),
      status,
      userId: req.userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const ref = await db.collection("Rooms").add(newRoom);
    const savedDoc = await ref.get();
    const data = savedDoc.data();

    res.status(201).json({
      id: savedDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate().toISOString(),
    });
  } catch (error) {
    console.error("❌ Errore createRoom:", error);
    res.status(500).json({ error: "Errore creazione camera." });
  }
});

// 📌 PATCH /rooms/:id → Aggiorna camera
router.patch("/:id", async (req, res) => {
  try {
    const updates = { ...req.body };
    const docRef = db.collection("Rooms").doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists || doc.data().userId !== req.userId) {
      return res.status(404).json({ error: "❌ Camera non trovata." });
    }

    await docRef.update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ message: "✅ Camera aggiornata." });
  } catch (error) {
    console.error("❌ Errore updateRoom:", error);
    res.status(500).json({ error: "Errore aggiornamento camera." });
  }
});

// 📌 DELETE /rooms/:id → Elimina camera
router.delete("/:id", async (req, res) => {
  try {
    const docRef = db.collection("Rooms").doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists || doc.data().userId !== req.userId) {
      return res.status(404).json({ error: "❌ Camera non trovata." });
    }

    await docRef.delete();
    res.json({ message: "✅ Camera eliminata." });
  } catch (error) {
    console.error("❌ Errore deleteRoom:", error);
    res.status(500).json({ error: "Errore eliminazione camera." });
  }
});

module.exports = router;
