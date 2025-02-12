const express = require("express");
const router = express.Router();
const admin = require("../firebase");

// ✅ Recupera tutti i report dei clienti
router.get("/", async (req, res) => {
  try {
    const snapshot = await admin
      .firestore()
      .collection("CustomersReports")
      .get();
    const reports = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(reports);
  } catch (error) {
    console.error("❌ Errore nel recupero dei dati clienti:", error);
    res.status(500).json({ error: "Errore nel recupero dei dati clienti" });
  }
});

// ✅ Aggiunge un nuovo report cliente
router.post("/add", async (req, res) => {
  try {
    const { name, email, phone, bookings, structureId, structureType } =
      req.body;
    if (!name || !email || !phone || !bookings) {
      return res.status(400).json({ error: "Tutti i campi sono obbligatori" });
    }

    const newReport = {
      name,
      email,
      phone,
      bookings: parseInt(bookings),
      structureId: structureId || null,
      structureType: structureType || "Generico",
      createdAt: new Date(),
    };

    const docRef = await admin
      .firestore()
      .collection("CustomersReports")
      .add(newReport);
    res.json({ id: docRef.id, ...newReport });
  } catch (error) {
    console.error("❌ Errore nell'aggiunta del report cliente:", error);
    res.status(500).json({ error: "Errore nell'aggiunta del report cliente" });
  }
});

module.exports = router;
