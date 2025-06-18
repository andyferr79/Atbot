// 📁 functions/financesRoutes.js (Versione aggiornata Express Router)
const express = require("express");
const { admin } = require("./firebase");
const { verifyToken } = require("./middlewares/verifyToken");
const withRateLimit = require("./middlewares/withRateLimit");

const db = admin.firestore();
const router = express.Router();

// ✅ Middleware
router.use(verifyToken);
router.use(withRateLimit(50, 10 * 60 * 1000)); // 50 richieste ogni 10 minuti

// 📌 GET /finances → Recupera dati finanziari
router.get("/", async (req, res) => {
  try {
    const snapshot = await db.collection("FinancialReports").get();
    let totalRevenue = 0,
      receivedPayments = 0,
      pendingPayments = 0;
    let recentTransactions = [];

    snapshot.forEach((doc) => {
      const { amount = 0, status, date, customer } = doc.data();
      totalRevenue += amount;
      if (status === "paid") receivedPayments += amount;
      if (status === "pending") pendingPayments += amount;

      recentTransactions.push({
        id: doc.id,
        date: date ? date.toDate().toISOString() : "N/A",
        amount,
        status: status || "unknown",
        customer: customer || "N/A",
      });
    });

    recentTransactions = recentTransactions
      .filter((t) => t.date !== "N/A")
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    res.json({
      totalRevenue,
      receivedPayments,
      pendingPayments,
      recentTransactions,
    });
  } catch (error) {
    console.error("❌ Errore recupero dati finanziari:", error);
    res.status(500).json({ error: error.message || "Errore interno" });
  }
});

// 📌 POST /finances → Aggiungi transazione
router.post("/", async (req, res) => {
  try {
    const { amount, status, customer, date } = req.body;

    if (!amount || isNaN(amount) || amount <= 0 || !status || !customer) {
      return res
        .status(400)
        .json({ error: "❌ Campi obbligatori mancanti o invalidi." });
    }

    const newTransaction = {
      amount: parseFloat(amount),
      status,
      customer,
      date: date ? new Date(date) : new Date(),
    };

    const docRef = await db.collection("FinancialReports").add(newTransaction);
    res.status(201).json({ id: docRef.id, ...newTransaction });
  } catch (error) {
    console.error("❌ Errore aggiunta transazione:", error);
    res.status(500).json({ error: error.message || "Errore interno" });
  }
});

// 📌 PUT /finances → Aggiorna transazione
router.put("/", async (req, res) => {
  try {
    const { transactionId, updates } = req.body;
    if (!transactionId || !updates) {
      return res
        .status(400)
        .json({ error: "❌ transactionId e updates richiesti." });
    }

    if (updates.date) updates.date = new Date(updates.date);
    await db.collection("FinancialReports").doc(transactionId).update(updates);
    res.json({ message: "✅ Transazione aggiornata." });
  } catch (error) {
    console.error("❌ Errore aggiornamento transazione:", error);
    res.status(500).json({ error: error.message || "Errore interno" });
  }
});

// 📌 DELETE /finances → Elimina transazione
router.delete("/", async (req, res) => {
  try {
    const { transactionId } = req.query;
    if (!transactionId) {
      return res.status(400).json({ error: "❌ transactionId richiesto." });
    }

    await db.collection("FinancialReports").doc(transactionId).delete();
    res.json({ message: "✅ Transazione eliminata." });
  } catch (error) {
    console.error("❌ Errore eliminazione transazione:", error);
    res.status(500).json({ error: error.message || "Errore interno" });
  }
});

module.exports = router;
