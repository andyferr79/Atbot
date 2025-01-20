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

// Rotte per la gestione degli ospiti
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

router.post("/guests", async (req, res) => {
  try {
    const newGuest = req.body;
    const docRef = await admin.firestore().collection("Guests").add(newGuest);
    res.json({ id: docRef.id, ...newGuest });
  } catch (error) {
    console.error("Errore nell'aggiunta dell'ospite:", error);
    res
      .status(500)
      .json({ message: "Errore nell'aggiunta dell'ospite", error });
  }
});

// Rotte per la gestione delle camere
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

router.post("/rooms", async (req, res) => {
  try {
    const { operatorId, ...roomData } = req.body;

    if (!operatorId) {
      return res
        .status(400)
        .json({ message: "L'ID dell'operatore è obbligatorio." });
    }

    const newRoom = {
      ...roomData,
      operatorId,
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

router.put("/rooms/:id", async (req, res) => {
  try {
    const roomId = req.params.id;
    const updatedData = req.body;
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

// Rotte per la gestione dei fornitori
router.get("/suppliers", async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection("Suppliers").get();
    const suppliers = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt ? data.createdAt.toDate() : null,
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : null,
      };
    });
    res.json(suppliers);
  } catch (error) {
    console.error("Errore nel recupero dei fornitori:", error);
    res
      .status(500)
      .json({ message: "Errore nel recupero dei fornitori", error });
  }
});

router.post("/suppliers", async (req, res) => {
  try {
    const newSupplier = {
      ...req.body,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
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

router.put("/suppliers/:id", async (req, res) => {
  try {
    const supplierId = req.params.id;
    const updatedData = {
      ...req.body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await admin
      .firestore()
      .collection("Suppliers")
      .doc(supplierId)
      .update(updatedData);
    res.json({ id: supplierId, ...updatedData });
  } catch (error) {
    console.error("Errore nell'aggiornamento del fornitore:", error);
    res
      .status(500)
      .json({ message: "Errore nell'aggiornamento del fornitore", error });
  }
});

router.delete("/suppliers/:id", async (req, res) => {
  try {
    const supplierId = req.params.id;
    await admin.firestore().collection("Suppliers").doc(supplierId).delete();
    res.json({ message: "Fornitore eliminato con successo", id: supplierId });
  } catch (error) {
    console.error("Errore nell'eliminazione del fornitore:", error);
    res
      .status(500)
      .json({ message: "Errore nell'eliminazione del fornitore", error });
  }
});

module.exports = router;
