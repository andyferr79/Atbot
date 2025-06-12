// 📁 functions/bookingsReportsRoutes.js – Booking Reports (Gen 2)

const express = require("express");
const admin = require("firebase-admin");
const { verifyToken } = require("../middlewares/verifyToken");

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

const router = express.Router();

// 🔐 Middleware globale: autenticazione
router.use(verifyToken);

// 🛡️ Middleware: rate limit semplice (1 richiesta/minuto per IP)
const checkRateLimit = async (req, res, next) => {
  const ip = req.headers["x-forwarded-for"] || req.ip || "unknown_ip";
  const now = Date.now();
  const docRef = db.collection("RateLimits").doc(`bookings_${ip}`);
  const doc = await docRef.get();

  if (doc.exists && now - doc.data().lastRequest < 60 * 1000) {
    return res
      .status(429)
      .json({ error: "❌ Troppe richieste. Attendi un minuto." });
  }

  await docRef.set({ lastRequest: now });
  next();
};

// 📥 Log richieste
router.use((req, res, next) => {
  console.log(
    `[📊 BookingsReports] ${req.method} ${req.originalUrl} – UID: ${req.user?.uid}`
  );
  next();
});

// ✅ GET /reports/bookings → Elenco report utente
router.get("/", checkRateLimit, async (req, res) => {
  try {
    const snapshot = await db
      .collection("BookingsReports")
      .where("generatedBy", "==", req.user.uid)
      .get();

    const reports = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString() || null,
    }));

    res.status(200).json({ reports });
  } catch (error) {
    console.error("❌ getBookingsReports:", error);
    res.status(500).json({ error: "Errore nel recupero dei report" });
  }
});

// ✅ GET /reports/bookings/:id → Singolo report
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const ref = db.collection("BookingsReports").doc(id);
    const doc = await ref.get();

    if (!doc.exists)
      return res.status(404).json({ error: "❌ Report non trovato" });
    res.status(200).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error("❌ getBookingReportById:", error);
    res.status(500).json({ error: "Errore interno" });
  }
});

// ✅ POST /reports/bookings → Crea nuovo report
router.post("/", async (req, res) => {
  try {
    const { reportData } = req.body;
    if (!reportData)
      return res.status(400).json({ error: "❌ Dati report mancanti" });

    const ref = await db.collection("BookingsReports").add({
      reportData,
      generatedBy: req.user.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({ message: "✅ Report creato", id: ref.id });
  } catch (error) {
    console.error("❌ createBookingReport:", error);
    res.status(500).json({ error: "Errore nella creazione del report" });
  }
});

// ✅ PUT /reports/bookings/:id → Aggiorna report
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { reportData } = req.body;
    if (!reportData)
      return res
        .status(400)
        .json({ error: "❌ Nessun contenuto da aggiornare" });

    const ref = db.collection("BookingsReports").doc(id);
    const doc = await ref.get();

    if (!doc.exists)
      return res.status(404).json({ error: "❌ Report non trovato" });

    await ref.update({ reportData });
    res.status(200).json({ message: "✅ Report aggiornato" });
  } catch (error) {
    console.error("❌ updateBookingReport:", error);
    res.status(500).json({ error: "Errore aggiornamento report" });
  }
});

// ✅ DELETE /reports/bookings/:id → Elimina report
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const ref = db.collection("BookingsReports").doc(id);
    const doc = await ref.get();

    if (!doc.exists)
      return res.status(404).json({ error: "❌ Report non trovato" });

    await ref.delete();
    res.status(200).json({ message: "✅ Report eliminato" });
  } catch (error) {
    console.error("❌ deleteBookingReport:", error);
    res.status(500).json({ error: "Errore eliminazione report" });
  }
});

module.exports = router;
