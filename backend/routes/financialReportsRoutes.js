const express = require("express");
const router = express.Router();
const admin = require("../firebase");
const fileUpload = require("express-fileupload");
const { format } = require("date-fns");

router.use(fileUpload());

// ✅ Endpoint per importare dati finanziari e aggiornarli come "processed"
router.post("/import", async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: "Nessun file caricato." });
    }

    const file = req.files.file;
    console.log(`✅ File ricevuto: ${file.name}`);

    const financialData = {
      fileName: file.name,
      uploadedAt: new Date(),
      status: "pending",
      processedAt: null, // 🔥 Quando il file viene elaborato, aggiorniamo questo valore
    };

    const docRef = await admin
      .firestore()
      .collection("FinancialReports")
      .add(financialData);

    // ✅ Simuliamo l'elaborazione dopo pochi secondi (reale logica di parsing da aggiungere)
    setTimeout(async () => {
      await admin
        .firestore()
        .collection("FinancialReports")
        .doc(docRef.id)
        .update({
          status: "processed",
          processedAt: new Date(),
        });
      console.log(`✅ File ${file.name} elaborato correttamente.`);
    }, 5000);

    res.json({
      message: "Dati finanziari importati con successo",
      reportId: docRef.id,
    });
  } catch (error) {
    console.error("❌ Errore nell'importazione dei dati:", error);
    res.status(500).json({ error: "Errore nell'importazione dei dati" });
  }
});

module.exports = router;
