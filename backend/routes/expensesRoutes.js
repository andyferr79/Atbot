const express = require("express");
const router = express.Router();
const admin = require("../firebase"); // Connessione a Firestore

// 📌 API per ottenere tutte le spese operative
router.get("/", async (req, res) => {
  try {
    const db = admin.firestore();
    const expensesSnapshot = await db.collection("Expenses").get();

    if (expensesSnapshot.empty) {
      return res.json({ expenses: [], totalExpenses: 0 });
    }

    let expenses = [];
    let totalExpenses = 0;

    expensesSnapshot.forEach((doc) => {
      const expense = doc.data();
      totalExpenses += expense.amount || 0;

      expenses.push({
        id: doc.id,
        category: expense.category || "Varie",
        amount: expense.amount || 0,
        description: expense.description || "",
        date: expense.date || "N/A",
      });
    });

    res.json({ expenses, totalExpenses });
  } catch (error) {
    console.error("❌ Errore nel recupero delle spese:", error);
    res.status(500).json({ error: "Errore nel recupero delle spese" });
  }
});

// 📌 API per aggiungere una nuova spesa
router.post("/add", async (req, res) => {
  try {
    const { category, amount, description } = req.body;
    if (!amount) {
      return res.status(400).json({ error: "❌ L'importo è obbligatorio." });
    }

    const db = admin.firestore();
    const newExpense = {
      category: category || "Varie",
      amount,
      description: description || "",
      date: new Date().toISOString(),
    };
    const docRef = await db.collection("Expenses").add(newExpense);

    res.json({ message: "✅ Spesa registrata con successo", id: docRef.id });
  } catch (error) {
    console.error("❌ Errore nell'aggiunta della spesa:", error);
    res.status(500).json({ error: "Errore nell'aggiunta della spesa" });
  }
});

module.exports = router;
