const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");

// Rotta di test Firebase
router.get("/test-firebase", async (req, res) => {
  try {
    const db = admin.firestore();
    const docRef = db.collection("test").doc("example");
    await docRef.set({ message: "Connessione a Firebase riuscita!" });
    const doc = await docRef.get();
    res.json(doc.data());
  } catch (error) {
    console.error("Errore nella connessione a Firebase:", error);
    res.status(500).send("Errore nella connessione a Firebase");
  }
});

module.exports = router;
