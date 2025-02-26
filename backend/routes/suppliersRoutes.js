const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");

// Recupera tutti i fornitori
router.get("/", async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection("Suppliers").get();
    const suppliers = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.json(suppliers);
  } catch (error) {
    console.error("Errore nel recupero dei fornitori:", error);
    res
      .status(500)
      .json({ message: "Errore nel recupero dei fornitori", error });
  }
});

// Aggiungi un nuovo fornitore
router.post("/", async (req, res) => {
  try {
    const newSupplier = { ...req.body, createdAt: new Date() };
    const docRef = await admin
      .firestore()
      .collection("Suppliers")
      .add(newSupplier);
    res.json({ id: docRef.id, ...newSupplier });
  } catch (error) {
    console.error("Errore nell'aggiunta del fornitore:", error);
    res
      .status(500)
      .json({ message: "Errore nell'aggiunta del fornitore", error });
  }
});

module.exports = router;
