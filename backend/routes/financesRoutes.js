const express = require("express");
const router = express.Router();
const admin = require("../firebase"); // Connessione a Firestore

// 📌 API per ottenere i dati finanziari
router.get("/", async (req, res) => {
  try {
    const db = admin.firestore();
    const financesSnapshot = await db.collection("FinancialReports").get();

    if (financesSnapshot.empty) {
      return res.json({
        totalRevenue: 0,
        receivedPayments: 0,
        pendingPayments: 0,
        recentTransactions: [],
      });
    }

    let totalRevenue = 0;
    let receivedPayments = 0;
    let pendingPayments = 0;
    let recentTransactions = [];

    financesSnapshot.forEach((doc) => {
      const transaction = doc.data();
      totalRevenue += transaction.amount || 0;

      if (transaction.status === "paid")
        receivedPayments += transaction.amount || 0;
      if (transaction.status === "pending")
        pendingPayments += transaction.amount || 0;

      recentTransactions.push({
        id: doc.id,
        date: transaction.date || "N/A",
        amount: transaction.amount || 0,
        status: transaction.status || "unknown",
        customer: transaction.customer || "N/A",
      });
    });

    // Mantiene solo le ultime 5 transazioni
    recentTransactions = recentTransactions
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    res.json({
      totalRevenue,
      receivedPayments,
      pendingPayments,
      recentTransactions,
    });
  } catch (error) {
    console.error("❌ Errore nel recupero dei dati finanziari:", error);
    res.status(500).json({ error: "Errore nel recupero dei dati finanziari" });
  }
});

module.exports = router;
