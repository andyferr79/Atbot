const express = require("express");
const router = express.Router();
const admin = require("../firebase");
const { format } = require("date-fns");

// ✅ Endpoint per ottenere i dati finanziari
router.get("/", async (req, res) => {
  try {
    const snapshot = await admin
      .firestore()
      .collection("financialReports")
      .get();
    const financialReports = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(financialReports);
  } catch (error) {
    console.error("❌ Errore nel recupero dei dati finanziari:", error);
    res.status(500).json({ error: "Errore nel recupero dei dati finanziari" });
  }
});

// ✅ Endpoint per esportare il report finanziario
router.get("/export", async (req, res) => {
  try {
    const formatType = req.query.format; // Formati disponibili: pdf, csv

    if (!formatType || (formatType !== "pdf" && formatType !== "csv")) {
      return res
        .status(400)
        .json({ error: "Formato non valido. Usa pdf o csv." });
    }

    // Simulazione dell'esportazione
    const filename = `financial-report-${format(
      new Date(),
      "yyyyMMdd-HHmm"
    )}.${formatType}`;
    res.json({
      message: `Report finanziario esportato in formato ${formatType}`,
      filename,
    });
  } catch (error) {
    console.error("❌ Errore durante l'esportazione del report:", error);
    res.status(500).json({ error: "Errore nell'esportazione del report" });
  }
});

// ✅ Endpoint per importare dati finanziari
router.post("/import", async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: "Nessun file caricato." });
    }

    const file = req.files.file;
    console.log(`✅ File ricevuto: ${file.name}`);

    // Simulazione del salvataggio del file
    res.json({
      message: "Dati finanziari importati con successo",
      filename: file.name,
    });
  } catch (error) {
    console.error("❌ Errore nell'importazione dei dati:", error);
    res.status(500).json({ error: "Errore nell'importazione dei dati" });
  }
});

module.exports = router;
