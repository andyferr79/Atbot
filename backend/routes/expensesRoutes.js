const express = require("express");
const router = express.Router();
const admin = require("../firebase");
const rateLimit = require("express-rate-limit");
const winston = require("winston");

// ✅ Configurazione del logging avanzato
const logger = winston.createLogger({
  level: "error",
  format: winston.format.json(),
  transports: [new winston.transports.File({ filename: "logs/errors.log" })],
});

// ✅ Middleware per limitare le richieste API (Max 50 richieste per IP ogni 10 minuti)
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 50,
  message: "❌ Troppe richieste. Riprova più tardi.",
});

// ✅ Middleware di autenticazione Firebase
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(403).json({ error: "❌ Token mancante" });

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    logger.error("❌ Token non valido:", error);
    return res.status(401).json({ error: "❌ Token non valido" });
  }
};

// 📌 API per ottenere tutte le spese operative
router.get("/", limiter, verifyToken, async (req, res) => {
  try {
    if (!admin.apps.length) {
      throw new Error("Firestore non inizializzato correttamente.");
    }

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
        date: expense.date ? expense.date.toDate().toISOString() : "N/A",
      });
    });

    res.json({ expenses, totalExpenses });
  } catch (error) {
    logger.error("❌ Errore nel recupero delle spese:", error);
    res
      .status(500)
      .json({
        error: "Errore nel recupero delle spese",
        details: error.message,
      });
  }
});

// 📌 API per aggiungere una nuova spesa
router.post("/add", limiter, verifyToken, async (req, res) => {
  try {
    const { category, amount, description } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return res
        .status(400)
        .json({ error: "❌ L'importo deve essere un numero positivo." });
    }

    const db = admin.firestore();
    const newExpense = {
      category: category || "Varie",
      amount: parseFloat(amount),
      description: description || "",
      date: new Date(),
    };

    const docRef = await db.collection("Expenses").add(newExpense);
    res.json({
      message: "✅ Spesa registrata con successo",
      id: docRef.id,
      date: newExpense.date.toISOString(),
    });
  } catch (error) {
    logger.error("❌ Errore nell'aggiunta della spesa:", error);
    res
      .status(500)
      .json({
        error: "Errore nell'aggiunta della spesa",
        details: error.message,
      });
  }
});

module.exports = router;
