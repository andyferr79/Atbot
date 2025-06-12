const express = require("express");
const { admin } = require("./firebase");
const { verifyToken } = require("../middlewares/verifyToken");

const withRateLimit = require("./middlewares/withRateLimit");

const db = admin.firestore();
const router = express.Router();

// 🔐 Middleware globale
router.use(verifyToken);
router.use(withRateLimit(50, 10 * 60 * 1000)); // Max 50 ogni 10 min

// 📌 GET /suppliers-reports → Tutti i report fornitori
router.get("/", async (req, res) => {
  try {
    const snapshot = await db.collection("SuppliersReports").get();
    const reports = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        supplierName: data.supplierName || "N/A",
        totalSpent: data.totalSpent || 0,
        contractStatus: data.contractStatus || "unknown",
        reportDate: data.reportDate?.toDate().toISOString() || "N/A",
        createdAt: data.createdAt?.toDate().toISOString() || "N/A",
      };
    });

    res.json({ reports });
  } catch (error) {
    console.error("❌ Errore getSuppliersReports:", error);
    res.status(500).json({ error: "Errore nel recupero dei report." });
  }
});

// 📌 POST /suppliers-reports → Aggiunge nuovo report
router.post("/", async (req, res) => {
  try {
    const { supplierName, totalSpent, contractStatus, reportDate } = req.body;

    if (!supplierName || !totalSpent || !contractStatus || !reportDate) {
      return res.status(400).json({ error: "❌ Campi obbligatori mancanti." });
    }

    const parsedTotal = parseFloat(totalSpent);
    if (isNaN(parsedTotal) || parsedTotal <= 0) {
      return res
        .status(400)
        .json({ error: "❌ Il totale speso deve essere positivo." });
    }

    const newReport = {
      supplierName,
      totalSpent: parsedTotal,
      contractStatus,
      reportDate: new Date(reportDate),
      createdAt: new Date(),
    };

    const docRef = await db.collection("SuppliersReports").add(newReport);
    res.json({ id: docRef.id, ...newReport });
  } catch (error) {
    console.error("❌ Errore addSupplierReport:", error);
    res.status(500).json({ error: "Errore creazione report." });
  }
});

// 📌 PUT /suppliers-reports/:id → Aggiorna un report
router.put("/:id", async (req, res) => {
  try {
    const updates = req.body;
    if (!updates) {
      return res
        .status(400)
        .json({ error: "❌ Dati aggiornamento richiesti." });
    }

    if (updates.reportDate) updates.reportDate = new Date(updates.reportDate);
    updates.updatedAt = new Date();

    await db.collection("SuppliersReports").doc(req.params.id).update(updates);

    res.json({ message: "✅ Report aggiornato con successo." });
  } catch (error) {
    console.error("❌ Errore updateSuppliersReport:", error);
    res.status(500).json({ error: "Errore aggiornamento report." });
  }
});

// 📌 DELETE /suppliers-reports/:id → Elimina un report
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "❌ ID report richiesto." });
    }

    await db.collection("SuppliersReports").doc(id).delete();
    res.json({ message: "✅ Report eliminato con successo." });
  } catch (error) {
    console.error("❌ Errore deleteSuppliersReport:", error);
    res.status(500).json({ error: "Errore eliminazione report." });
  }
});

module.exports = router;
