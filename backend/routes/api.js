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

// Recupera tutti gli ospiti
router.get("/guests", async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection("Guests").get();
    const guests = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(guests);
  } catch (error) {
    console.error("Errore nel recupero degli ospiti:", error);
    res
      .status(500)
      .json({ message: "Errore nel recupero degli ospiti", error });
  }
});

// Aggiungi un nuovo ospite
router.post("/guests", async (req, res) => {
  try {
    const newGuest = req.body; // I dati dell'ospite vengono passati dal client
    const docRef = await admin.firestore().collection("Guests").add(newGuest);
    res.json({ id: docRef.id, ...newGuest });
  } catch (error) {
    console.error("Errore nell'aggiunta dell'ospite:", error);
    res
      .status(500)
      .json({ message: "Errore nell'aggiunta dell'ospite", error });
  }
});

module.exports = router;
