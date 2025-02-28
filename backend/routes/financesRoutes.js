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

// 📌 API per ottenere i dati finanziari
router.get("/", limiter, verifyToken, async (req, res) => {
  try {
    if (!admin.apps.length) {
      throw new Error("Firestore non inizializzato correttamente.");
    }

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
        date: transaction.date
          ? transaction.date.toDate().toISOString()
          : "N/A",
        amount: transaction.amount || 0,
        status: transaction.status || "unknown",
        customer: transaction.customer || "N/A",
      });
    });

    // Mantiene solo le ultime 5 transazioni con date valide
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
    logger.error("❌ Errore nel recupero dei dati finanziari:", error);
    res
      .status(500)
      .json({
        error: "Errore nel recupero dei dati finanziari",
        details: error.message,
      });
  }
});

module.exports = router;
