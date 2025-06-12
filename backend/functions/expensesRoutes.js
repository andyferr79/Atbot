const express = require("express");
const { admin } = require("./firebase");
const { verifyToken } = require("./middlewares/verifyToken");
const withRateLimit = require("./middlewares/withRateLimit");

const db = admin.firestore();
const router = express.Router();

// 🔐 Middleware globali
router.use(verifyToken);
router.use(withRateLimit(50, 10 * 60 * 1000)); // 50 richieste ogni 10 minuti

// 📌 GET /expenses → Recupera spese utente
router.get("/", async (req, res) => {
  try {
    const snapshot = await db
      .collection("Expenses")
      .where("userId", "==", req.userId)
      .get();

    let totalExpenses = 0;
    const expenses = snapshot.docs.map((doc) => {
      const data = doc.data();
      totalExpenses += data.amount || 0;
      return {
        id: doc.id,
        category: data.category || "Varie",
        amount: data.amount || 0,
        description: data.description || "",
        date: data.date?.toDate().toISOString() || "N/A",
      };
    });

    res.json({ expenses, totalExpenses });
  } catch (error) {
    console.error("❌ Errore recupero spese:", error);
    res.status(500).json({ error: error.message || "Errore interno" });
  }
});

// 📌 POST /expenses → Aggiungi spesa
router.post("/", async (req, res) => {
  try {
    const { category, amount, description, date } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return res
        .status(400)
        .json({ error: "❌ Importo deve essere positivo." });
    }

    const newExpense = {
      userId: req.userId,
      category: category || "Varie",
      amount: parseFloat(amount),
      description: description || "",
      date: date ? new Date(date) : new Date(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("Expenses").add(newExpense);
    res.status(201).json({ id: docRef.id, ...newExpense });
  } catch (error) {
    console.error("❌ Errore aggiunta spesa:", error);
    res.status(500).json({ error: error.message || "Errore interno" });
  }
});

// 📌 PATCH /expenses/:expenseId → Aggiorna spesa
router.patch("/:expenseId", async (req, res) => {
  try {
    const { expenseId } = req.params;
    const docRef = db.collection("Expenses").doc(expenseId);
    const doc = await docRef.get();

    if (!doc.exists || doc.data().userId !== req.userId) {
      return res.status(404).json({ error: "❌ Spesa non trovata." });
    }

    const updates = { ...req.body };
    if (updates.date) updates.date = new Date(updates.date);
    updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await docRef.update(updates);
    res.json({ message: "✅ Spesa aggiornata." });
  } catch (error) {
    console.error("❌ Errore aggiornamento spesa:", error);
    res.status(500).json({ error: error.message || "Errore interno" });
  }
});

// 📌 DELETE /expenses/:expenseId → Elimina spesa
router.delete("/:expenseId", async (req, res) => {
  try {
    const { expenseId } = req.params;
    const docRef = db.collection("Expenses").doc(expenseId);
    const doc = await docRef.get();

    if (!doc.exists || doc.data().userId !== req.userId) {
      return res.status(404).json({ error: "❌ Spesa non trovata." });
    }

    await docRef.delete();
    res.json({ message: "✅ Spesa eliminata." });
  } catch (error) {
    console.error("❌ Errore eliminazione spesa:", error);
    res.status(500).json({ error: error.message || "Errore interno" });
  }
});

module.exports = router;
