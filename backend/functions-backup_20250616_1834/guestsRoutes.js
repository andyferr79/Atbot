// 📁 functions/guestsRoutes.js
const express = require("express");
const { admin } = require("./firebase");
const { verifyToken } = require("./middlewares/verifyToken");
const withRateLimit = require("./middlewares/withRateLimit");

const db = admin.firestore();
const router = express.Router();

// 🔐 Middleware
router.use(verifyToken);
router.use(withRateLimit(100, 10 * 60 * 1000)); // max 100 richieste ogni 10 min

// 📌 GET /guests → Recupera tutti gli ospiti dell’utente
router.get("/", async (req, res) => {
  try {
    const snap = await db
      .collection("Guests")
      .where("userId", "==", req.userId)
      .get();

    const guests = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString() || null,
    }));

    return res.json({ guests });
  } catch (err) {
    console.error("❌ getGuests error:", err);
    return res.status(500).json({ error: "Impossibile recuperare gli ospiti" });
  }
});

// 📌 POST /guests → Crea nuovo ospite
router.post("/", async (req, res) => {
  try {
    const { name, email, phone = "", roomType = "" } = req.body;
    if (!name || !email) {
      return res
        .status(400)
        .json({ error: "❌ name ed email sono obbligatori" });
    }

    const doc = await db.collection("Guests").add({
      name,
      email,
      phone,
      roomType,
      userId: req.userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(201).json({ id: doc.id, message: "✅ Guest creato" });
  } catch (err) {
    console.error("❌ addGuest error:", err);
    return res.status(500).json({ error: "Creazione guest fallita" });
  }
});

// 📌 PUT /guests/:guestId → Aggiorna ospite
router.put("/:guestId", async (req, res) => {
  try {
    const { guestId } = req.params;
    const docRef = db.collection("Guests").doc(guestId);
    const doc = await docRef.get();

    if (!doc.exists || doc.data().userId !== req.userId) {
      return res.status(404).json({ error: "❌ Guest non trovato" });
    }

    await docRef.update({
      ...req.body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.json({ message: "✅ Guest aggiornato" });
  } catch (err) {
    console.error("❌ updateGuest error:", err);
    return res.status(500).json({ error: "Aggiornamento guest fallito" });
  }
});

// 📌 DELETE /guests/:guestId → Elimina ospite
router.delete("/:guestId", async (req, res) => {
  try {
    const { guestId } = req.params;
    const docRef = db.collection("Guests").doc(guestId);
    const doc = await docRef.get();

    if (!doc.exists || doc.data().userId !== req.userId) {
      return res.status(404).json({ error: "❌ Guest non trovato" });
    }

    await docRef.delete();
    return res.json({ message: "✅ Guest eliminato" });
  } catch (err) {
    console.error("❌ deleteGuest error:", err);
    return res.status(500).json({ error: "Eliminazione guest fallita" });
  }
});

module.exports = router;
