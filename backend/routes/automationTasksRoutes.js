const express = require("express");
const router = express.Router();
const admin = require("../firebase");
const rateLimit = require("express-rate-limit");
const winston = require("winston");

// ✅ Logging avanzato
const logger = winston.createLogger({
  level: "error",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "logs/automation_errors.log" }),
  ],
});

// ✅ Protezione API con rate limit
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: "❌ Troppe richieste. Attendi prima di riprovare.",
});

// ✅ API per creare task automatici
router.post("/tasks", limiter, async (req, res) => {
  try {
    const { taskType, assignedTo, dueDate } = req.body;

    if (!taskType || !assignedTo || !dueDate) {
      return res
        .status(400)
        .json({ error: "❌ Tutti i campi sono obbligatori." });
    }

    const db = admin.firestore();
    await db.collection("AutomationTasks").add({
      taskType,
      assignedTo,
      dueDate: new Date(dueDate),
      createdAt: new Date(),
    });

    res.json({ message: "✅ Task creato con successo!" });
  } catch (error) {
    logger.error("❌ Errore nella creazione del task automatico:", error);
    res.status(500).json({ error: "Errore nella creazione del task" });
  }
});

module.exports = router;
