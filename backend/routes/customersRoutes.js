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

// 📌 API per ottenere i dati dei clienti
router.get("/", limiter, verifyToken, async (req, res) => {
  try {
    if (!admin.apps.length) {
      throw new Error("Firestore non inizializzato correttamente.");
    }

    const db = admin.firestore();
    const customersSnapshot = await db.collection("Customers").get();

    if (customersSnapshot.empty) {
      return res.json({
        totalCustomers: 0,
        leads: 0,
        vipCustomers: 0,
        recentCustomers: [],
      });
    }

    let totalCustomers = 0;
    let leads = 0;
    let vipCustomers = 0;
    let recentCustomers = [];

    customersSnapshot.forEach((doc) => {
      const customer = doc.data();
      totalCustomers++;

      if (customer.type === "lead") leads++;
      if (customer.isVIP) vipCustomers++;

      recentCustomers.push({
        id: doc.id,
        name: customer.name || "N/A",
        email: customer.email || "N/A",
        phone: customer.phone || "N/A",
        lastBooking: customer.lastBooking
          ? customer.lastBooking.toDate().toISOString()
          : "N/A",
      });
    });

    // Mantiene solo gli ultimi 5 clienti con prenotazioni valide
    recentCustomers = recentCustomers
      .filter((c) => c.lastBooking !== "N/A") // Rimuoviamo quelli senza date valide
      .sort((a, b) => new Date(b.lastBooking) - new Date(a.lastBooking))
      .slice(0, 5);

    res.json({
      totalCustomers,
      leads,
      vipCustomers,
      recentCustomers,
    });
  } catch (error) {
    logger.error("❌ Errore nel recupero dei clienti:", error);
    res
      .status(500)
      .json({
        error: "Errore nel recupero dei clienti",
        details: error.message,
      });
  }
});

module.exports = router;
