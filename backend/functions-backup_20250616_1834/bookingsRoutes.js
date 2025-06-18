// 📁 functions/bookingsRoutes.js
const express = require("express");
const admin = require("firebase-admin");
const { verifyToken } = require("../middlewares/verifyToken");

const db = admin.firestore();
const router = express.Router();

router.use(verifyToken);

// ✅ GET /bookings → Tutte le prenotazioni dell’utente
router.get("/", async (req, res) => {
  try {
    const snapshot = await db
      .collection("Bookings")
      .where("userId", "==", req.user.uid)
      .get();

    const bookings = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString() || null,
    }));

    res.json({ bookings });
  } catch (error) {
    console.error("❌ Errore getBookings:", error);
    res.status(500).json({ error: "Errore nel recupero prenotazioni." });
  }
});

// ✅ GET /bookings/:id → Prenotazione specifica
router.get("/:id", async (req, res) => {
  try {
    const doc = await db.collection("Bookings").doc(req.params.id).get();

    if (!doc.exists || doc.data().userId !== req.user.uid) {
      return res.status(404).json({ error: "❌ Prenotazione non trovata." });
    }

    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error("❌ Errore getBookingById:", error);
    res.status(500).json({ error: "Errore interno." });
  }
});

// ✅ POST /bookings → Crea nuova prenotazione
router.post("/", async (req, res) => {
  try {
    const { customerName, checkInDate, checkOutDate, amount, status } =
      req.body;

    if (!customerName || !checkInDate || !checkOutDate || !amount || !status) {
      return res.status(400).json({ error: "❌ Tutti i campi obbligatori." });
    }

    const booking = {
      customerName,
      checkInDate: admin.firestore.Timestamp.fromDate(new Date(checkInDate)),
      checkOutDate: admin.firestore.Timestamp.fromDate(new Date(checkOutDate)),
      amount,
      status,
      userId: req.user.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const ref = await db.collection("Bookings").add(booking);
    const savedDoc = await ref.get();
    const data = savedDoc.data();

    res.status(201).json({
      id: savedDoc.id,
      ...data,
      checkInDate: data.checkInDate?.toDate().toISOString(),
      checkOutDate: data.checkOutDate?.toDate().toISOString(),
      createdAt: data.createdAt?.toDate().toISOString(),
    });
  } catch (error) {
    console.error("❌ Errore createBooking:", error);
    res.status(500).json({ error: "Errore creazione prenotazione." });
  }
});

// ✅ PATCH /bookings/:id → Aggiorna prenotazione
router.patch("/:id", async (req, res) => {
  try {
    const updates = { ...req.body };
    const docRef = db.collection("Bookings").doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists || doc.data().userId !== req.user.uid) {
      return res.status(404).json({ error: "❌ Prenotazione non trovata." });
    }

    if (updates.checkInDate)
      updates.checkInDate = admin.firestore.Timestamp.fromDate(
        new Date(updates.checkInDate)
      );
    if (updates.checkOutDate)
      updates.checkOutDate = admin.firestore.Timestamp.fromDate(
        new Date(updates.checkOutDate)
      );

    await docRef.update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ message: "✅ Prenotazione aggiornata." });
  } catch (error) {
    console.error("❌ Errore updateBooking:", error);
    res.status(500).json({ error: "Errore aggiornamento prenotazione." });
  }
});

// ✅ DELETE /bookings/:id → Elimina prenotazione
router.delete("/:id", async (req, res) => {
  try {
    const docRef = db.collection("Bookings").doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists || doc.data().userId !== req.user.uid) {
      return res.status(404).json({ error: "❌ Prenotazione non trovata." });
    }

    await docRef.delete();
    res.json({ message: "✅ Prenotazione eliminata." });
  } catch (error) {
    console.error("❌ Errore deleteBooking:", error);
    res.status(500).json({ error: "Errore eliminazione prenotazione." });
  }
});

module.exports = router;
