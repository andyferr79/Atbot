// 📁 customersReportsRoutes.js
const express = require("express");
const { verifyToken } = require("../middlewares/verifyToken");
const { withCors } = require("../middlewares/withCors");
const admin = require("firebase-admin");
const rateLimit = require("express-rate-limit");

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

const router = express.Router();

// 🔐 Middleware + RateLimit
router.use(withCors);
router.use(verifyToken);
router.use(
  rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 50,
    message: "❌ Troppe richieste. Riprova più tardi.",
  })
);

// 📌 GET - Tutti i report dell’utente autenticato
router.get("/", async (req, res) => {
  try {
    const snapshot = await db
      .collection("CustomersReports")
      .where("userId", "==", req.user.uid)
      .get();

    const reports = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString() || "N/A",
    }));

    res.json(reports);
  } catch (err) {
    console.error("❌ Errore GET CustomersReports:", err);
    res.status(500).json({ error: "Errore interno" });
  }
});

// 📌 POST - Aggiungi nuovo report
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, bookings, structureId, structureType } =
      req.body;

    if (!name || !email || !phone || bookings === undefined) {
      return res.status(400).json({ error: "❌ Dati mancanti" });
    }

    const newReport = {
      userId: req.user.uid,
      name,
      email,
      phone,
      bookings: parseInt(bookings),
      structureId: structureId || null,
      structureType: structureType || "Generico",
      createdAt: admin.firestore.Timestamp.now(),
    };

    const docRef = await db.collection("CustomersReports").add(newReport);
    res.json({ id: docRef.id, ...newReport });
  } catch (err) {
    console.error("❌ Errore POST CustomersReports:", err);
    res.status(500).json({ error: "Errore interno" });
  }
});

// 📌 PUT - Aggiorna report se appartiene all’utente
router.put("/", async (req, res) => {
  try {
    const { reportId, updates } = req.body;
    if (!reportId || !updates) {
      return res.status(400).json({ error: "❌ Parametri mancanti" });
    }

    const docRef = db.collection("CustomersReports").doc(reportId);
    const doc = await docRef.get();

    if (!doc.exists || doc.data().userId !== req.user.uid) {
      return res.status(403).json({ error: "❌ Accesso non autorizzato" });
    }

    await docRef.update(updates);
    res.json({ message: "✅ Report aggiornato" });
  } catch (err) {
    console.error("❌ Errore PUT CustomersReports:", err);
    res.status(500).json({ error: "Errore interno" });
  }
});

// 📌 DELETE - Elimina report se appartiene all’utente
router.delete("/", async (req, res) => {
  try {
    const { reportId } = req.query;
    if (!reportId) {
      return res.status(400).json({ error: "❌ reportId richiesto" });
    }

    const docRef = db.collection("CustomersReports").doc(reportId);
    const doc = await docRef.get();

    if (!doc.exists || doc.data().userId !== req.user.uid) {
      return res.status(403).json({ error: "❌ Accesso non autorizzato" });
    }

    await docRef.delete();
    res.json({ message: "✅ Report eliminato" });
  } catch (err) {
    console.error("❌ Errore DELETE CustomersReports:", err);
    res.status(500).json({ error: "Errore interno" });
  }
});

module.exports = router;
