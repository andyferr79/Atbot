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

// Recupera tutte le camere
router.get("/rooms", async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection("rooms").get();
    const rooms = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(rooms);
  } catch (error) {
    console.error("Errore nel recupero delle camere:", error);
    res
      .status(500)
      .json({ message: "Errore nel recupero delle camere", error });
  }
});

// Aggiungi una nuova camera
router.post("/rooms", async (req, res) => {
  try {
    const { operatorId, ...roomData } = req.body; // Estrai operatorId e altri dati della camera

    if (!operatorId) {
      return res
        .status(400)
        .json({ message: "L'ID dell'operatore è obbligatorio." });
    }

    const newRoom = {
      ...roomData,
      operatorId, // Assegna l'ID dell'operatore
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await admin.firestore().collection("rooms").add(newRoom);
    res.json({ id: docRef.id, ...newRoom });
  } catch (error) {
    console.error("Errore nell'aggiunta della camera:", error);
    res
      .status(500)
      .json({ message: "Errore nell'aggiunta della camera", error });
  }
});

// Aggiorna i dettagli di una camera
router.put("/rooms/:id", async (req, res) => {
  try {
    const roomId = req.params.id;
    const updatedData = req.body; // I nuovi dati della camera
    updatedData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await admin.firestore().collection("rooms").doc(roomId).update(updatedData);
    res.json({ id: roomId, ...updatedData });
  } catch (error) {
    console.error("Errore nell'aggiornamento della camera:", error);
    res
      .status(500)
      .json({ message: "Errore nell'aggiornamento della camera", error });
  }
});

// Elimina una camera
router.delete("/rooms/:id", async (req, res) => {
  try {
    const roomId = req.params.id;
    await admin.firestore().collection("rooms").doc(roomId).delete();
    res.json({ message: "Camera eliminata con successo", id: roomId });
  } catch (error) {
    console.error("Errore nell'eliminazione della camera:", error);
    res
      .status(500)
      .json({ message: "Errore nell'eliminazione della camera", error });
  }
});

module.exports = router;
