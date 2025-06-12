const express = require("express");
const admin = require("firebase-admin");
const { verifyToken } = require("../middlewares/verifyToken");

const withRateLimit = require("./middlewares/withRateLimit");

const db = admin.firestore();
const router = express.Router();

// 🔐 Middleware globale
router.use(verifyToken);
router.use(withRateLimit(60, 5 * 60 * 1000)); // 60 richieste ogni 5 min

// 📌 GET /suppliers → Recupera fornitori dell'utente
router.get("/", async (req, res) => {
  try {
    const snapshot = await db
      .collection("Suppliers")
      .where("userId", "==", req.user.uid)
      .get();

    const suppliers = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate().toISOString() || null,
        updatedAt: data.updatedAt?.toDate().toISOString() || null,
      };
    });

    res.json({ suppliers });
  } catch (error) {
    console.error("❌ Errore getSuppliers:", error);
    res.status(500).json({ error: "Errore nel recupero fornitori." });
  }
});

// 📌 POST /suppliers → Aggiunge nuovo fornitore
router.post("/", async (req, res) => {
  try {
    const {
      name,
      category = "Generale",
      contact = {},
      status = "Attivo",
    } = req.body;

    if (!name || !contact.email) {
      return res.status(400).json({
        error: "❌ Nome e contatto email sono obbligatori.",
      });
    }

    const newSupplier = {
      name,
      category,
      contact,
      status,
      userId: req.user.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("Suppliers").add(newSupplier);
    res.status(201).json({ id: docRef.id, ...newSupplier });
  } catch (error) {
    console.error("❌ Errore addSupplier:", error);
    res.status(500).json({ error: "Errore durante la creazione." });
  }
});

// 📌 PUT /suppliers/:id → Aggiorna fornitore
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!updates || typeof updates !== "object") {
      return res
        .status(400)
        .json({ error: "❌ Dati aggiornati mancanti o invalidi." });
    }

    await db
      .collection("Suppliers")
      .doc(id)
      .update({
        ...updates,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    res.json({ message: "✅ Fornitore aggiornato." });
  } catch (error) {
    console.error("❌ Errore updateSupplier:", error);
    res.status(500).json({ error: "Errore aggiornamento." });
  }
});

// 📌 DELETE /suppliers/:id → Elimina fornitore
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "❌ ID richiesto." });

    await db.collection("Suppliers").doc(id).delete();
    res.json({ message: "✅ Fornitore eliminato." });
  } catch (error) {
    console.error("❌ Errore deleteSupplier:", error);
    res.status(500).json({ error: "Errore eliminazione." });
  }
});

module.exports = router;
