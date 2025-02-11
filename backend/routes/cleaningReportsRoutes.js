const express = require("express");
const router = express.Router();
const admin = require("../firebase");

// ✅ Recupera tutti i report delle pulizie filtrando per structureId
router.get("/", async (req, res) => {
  try {
    const { structureId } = req.query;
    let query = admin.firestore().collection("CleaningReports");

    if (structureId) {
      query = query.where("structureId", "==", structureId);
    }

    const snapshot = await query.get();
    const reports = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(reports);
  } catch (error) {
    console.error("❌ Errore nel recupero dei dati sulle pulizie:", error);
    res
      .status(500)
      .json({ error: "Errore nel recupero dei dati sulle pulizie" });
  }
});

// ✅ Aggiunge un nuovo report di pulizia per qualsiasi tipo di struttura
router.post("/add", async (req, res) => {
  try {
    const {
      structureId,
      structureType,
      roomNumber,
      address,
      status,
      lastCleaned,
      assignedTo,
    } = req.body;
    if (
      !structureId ||
      !structureType ||
      !roomNumber ||
      !status ||
      !lastCleaned ||
      !assignedTo
    ) {
      return res
        .status(400)
        .json({ error: "Tutti i campi obbligatori devono essere compilati" });
    }

    const newReport = {
      structureId,
      structureType,
      roomNumber,
      address:
        structureType === "appartamento" || structureType === "villa"
          ? address
          : null,
      status,
      lastCleaned: new Date(lastCleaned),
      assignedTo,
      createdAt: new Date(),
    };

    const docRef = await admin
      .firestore()
      .collection("CleaningReports")
      .add(newReport);
    res.json({ id: docRef.id, ...newReport });
  } catch (error) {
    console.error("❌ Errore nell'aggiunta del report di pulizia:", error);
    res
      .status(500)
      .json({ error: "Errore nell'aggiunta del report di pulizia" });
  }
});

module.exports = router;
