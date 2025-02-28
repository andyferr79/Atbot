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

// ✅ Recupera tutti i report dei clienti
router.get("/", limiter, verifyToken, async (req, res) => {
  try {
    if (!admin.apps.length) {
      throw new Error("Firestore non inizializzato correttamente.");
    }

    const snapshot = await admin
      .firestore()
      .collection("CustomersReports")
      .get();

    if (snapshot.empty) {
      return res.json([]);
    }

    const reports = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt
        ? doc.data().createdAt.toDate().toISOString()
        : "N/A",
    }));

    res.json(reports);
  } catch (error) {
    logger.error("❌ Errore nel recupero dei dati clienti:", error);
    res
      .status(500)
      .json({
        error: "Errore nel recupero dei dati clienti",
        details: error.message,
      });
  }
});

// ✅ Aggiunge un nuovo report cliente
router.post("/add", limiter, verifyToken, async (req, res) => {
  try {
    const { name, email, phone, bookings, structureId, structureType } =
      req.body;

    if (!name || !email || !phone || !bookings) {
      return res.status(400).json({ error: "Tutti i campi sono obbligatori" });
    }

    // Validazione Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "❌ Indirizzo email non valido" });
    }

    // Validazione Numero di Telefono
    const phoneRegex = /^[0-9\-\+\s\(\)]{7,15}$/;
    if (!phoneRegex.test(phone)) {
      return res
        .status(400)
        .json({ error: "❌ Numero di telefono non valido" });
    }

    // Validazione Bookings
    const parsedBookings = parseInt(bookings);
    if (isNaN(parsedBookings) || parsedBookings < 0) {
      return res
        .status(400)
        .json({
          error:
            "❌ Il numero di prenotazioni deve essere un numero intero positivo",
        });
    }

    const newReport = {
      name,
      email,
      phone,
      bookings: parsedBookings,
      structureId: structureId || null,
      structureType: structureType || "Generico",
      createdAt: new Date(),
    };

    const docRef = await admin
      .firestore()
      .collection("CustomersReports")
      .add(newReport);

    res.json({
      id: docRef.id,
      ...newReport,
      createdAt: newReport.createdAt.toISOString(),
    });
  } catch (error) {
    logger.error("❌ Errore nell'aggiunta del report cliente:", error);
    res
      .status(500)
      .json({
        error: "Errore nell'aggiunta del report cliente",
        details: error.message,
      });
  }
});

module.exports = router;
