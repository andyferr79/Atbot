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

// ✅ Recupera tutti i fornitori
router.get("/", limiter, verifyToken, async (req, res) => {
  try {
    if (!admin.apps.length) {
      throw new Error("Firestore non inizializzato correttamente.");
    }

    const snapshot = await admin.firestore().collection("Suppliers").get();
    const suppliers = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt
        ? doc.data().createdAt.toDate().toISOString()
        : "N/A",
    }));

    res.json(suppliers);
  } catch (error) {
    logger.error("❌ Errore nel recupero dei fornitori:", error);
    res
      .status(500)
      .json({
        error: "Errore nel recupero dei fornitori",
        details: error.message,
      });
  }
});

// ✅ Aggiungi un nuovo fornitore
router.post("/", limiter, verifyToken, async (req, res) => {
  try {
    const { name, contact, email, phone } = req.body;

    if (!name || !contact) {
      return res
        .status(400)
        .json({ error: "❌ Nome e contatto sono obbligatori." });
    }

    // Validazione email
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res
          .status(400)
          .json({ error: "❌ Indirizzo email non valido." });
      }
    }

    // Validazione telefono
    if (phone) {
      const phoneRegex = /^[0-9\-\+\s\(\)]{7,15}$/;
      if (!phoneRegex.test(phone)) {
        return res
          .status(400)
          .json({ error: "❌ Numero di telefono non valido." });
      }
    }

    const newSupplier = {
      name,
      contact,
      email: email || null,
      phone: phone || null,
      createdAt: new Date(),
    };

    const docRef = await admin
      .firestore()
      .collection("Suppliers")
      .add(newSupplier);
    res.json({
      message: "✅ Fornitore aggiunto con successo",
      id: docRef.id,
      createdAt: newSupplier.createdAt.toISOString(),
    });
  } catch (error) {
    logger.error("❌ Errore nell'aggiunta del fornitore:", error);
    res
      .status(500)
      .json({
        error: "Errore nell'aggiunta del fornitore",
        details: error.message,
      });
  }
});

module.exports = router;
