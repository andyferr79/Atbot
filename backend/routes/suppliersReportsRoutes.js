const express = require("express");
const router = express.Router();
const admin = require("../firebase");

// ✅ Endpoint per ottenere i dati dei fornitori
router.get("/", async (req, res) => {
  try {
    const snapshot = await admin
      .firestore()
      .collection("SuppliersReports")
      .get();
    const suppliersReports = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(suppliersReports);
  } catch (error) {
    console.error("❌ Errore nel recupero dei dati fornitori:", error);
    res.status(500).json({ error: "Errore nel recupero dei dati fornitori" });
  }
});

// ✅ Endpoint per aggiungere un nuovo report fornitore
router.post("/add", async (req, res) => {
  try {
    const { supplierName, totalSpent, contractStatus, reportDate } = req.body;

    if (!supplierName || !totalSpent || !contractStatus || !reportDate) {
      return res.status(400).json({ error: "Tutti i campi sono obbligatori." });
    }

    const newSupplierReport = {
      supplierName,
      totalSpent: parseFloat(totalSpent),
      contractStatus,
      reportDate: new Date(reportDate),
      createdAt: new Date(),
    };

    const docRef = await admin
      .firestore()
      .collection("SuppliersReports")
      .add(newSupplierReport);

    res.json({
      message: "Report fornitore aggiunto con successo",
      id: docRef.id,
    });
  } catch (error) {
    console.error("❌ Errore nell'aggiunta del report fornitore:", error);
    res
      .status(500)
      .json({ error: "Errore nell'aggiunta del report fornitore" });
  }
});

module.exports = router;
