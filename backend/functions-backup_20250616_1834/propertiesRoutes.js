// 📁 propertiesRoutes.js – CRUD completo per alloggi (Properties)
const express = require("express");
const admin = require("firebase-admin");

const router = express.Router();
const db = admin.firestore();
router.use(express.json());

// ✅ Middleware autenticazione
async function authenticate(req) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) throw { status: 403, message: "Token mancante" };
  try {
    await admin.auth().verifyIdToken(token);
  } catch (err) {
    throw { status: 401, message: "Token non valido" };
  }
}

// 📌 GET - Recupera tutte le proprietà
router.get("/", async (req, res) => {
  try {
    await authenticate(req);
    const snapshot = await db.collection("Properties").get();
    const properties = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.json({ properties });
  } catch (error) {
    console.error("Errore GET properties:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

// 📌 POST - Crea una nuova proprietà
router.post("/", async (req, res) => {
  try {
    await authenticate(req);
    const { name, price, image, operatorId } = req.body;

    if (!name || !price || !operatorId) {
      return res
        .status(400)
        .json({ error: "Nome, prezzo e operatorId sono obbligatori." });
    }

    const newProperty = {
      name,
      price: parseFloat(price),
      image: image || "",
      operatorId,
      type: "property",
      createdAt: new Date(),
    };

    const docRef = await db.collection("Properties").add(newProperty);
    res.status(201).json({ id: docRef.id, ...newProperty });
  } catch (error) {
    console.error("Errore POST property:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

// 📌 PUT - Aggiorna proprietà
router.put("/", async (req, res) => {
  try {
    await authenticate(req);
    const { id } = req.query;
    const updates = req.body;

    if (!id || !updates)
      return res.status(400).json({ error: "ID e dati richiesti." });

    updates.updatedAt = new Date();
    await db.collection("Properties").doc(id).update(updates);
    res.json({ message: "Proprietà aggiornata" });
  } catch (error) {
    console.error("Errore PUT property:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

// 📌 DELETE - Elimina proprietà
router.delete("/", async (req, res) => {
  try {
    await authenticate(req);
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "ID mancante." });

    await db.collection("Properties").doc(id).delete();
    res.json({ message: "Proprietà eliminata" });
  } catch (error) {
    console.error("Errore DELETE property:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

module.exports = router;
