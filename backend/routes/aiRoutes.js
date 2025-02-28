const express = require("express");
const router = express.Router();
const axios = require("axios");
const rateLimit = require("express-rate-limit");
const winston = require("winston");

const AI_BACKEND_URL = "http://127.0.0.1:8000"; // URL locale del backend AI

// ✅ Configurazione del logging avanzato
const logger = winston.createLogger({
  level: "error",
  format: winston.format.json(),
  transports: [new winston.transports.File({ filename: "logs/ai_errors.log" })],
});

// ✅ Middleware per limitare le richieste API (Max 50 richieste per IP ogni 10 minuti)
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minuti
  max: 50,
  message: "❌ Troppe richieste. Riprova più tardi.",
});

// ✅ Rotta per la chat con l'AI
router.post("/chat", limiter, async (req, res) => {
  try {
    const { user_message, session_id } = req.body;

    if (!user_message || !session_id) {
      return res
        .status(400)
        .json({
          error: "❌ I campi user_message e session_id sono obbligatori.",
        });
    }

    const response = await axios.post(
      `${AI_BACKEND_URL}/chat`,
      {
        user_message,
        session_id,
      },
      { timeout: 10000 }
    ); // ✅ Timeout di 10 secondi

    res.json(response.data);
  } catch (error) {
    if (error.response) {
      // Errore HTTP dal backend AI
      logger.error(
        `❌ Errore AI (${error.response.status}): ${error.response.data}`
      );
      return res.status(error.response.status).json({
        message: "❌ Errore nella comunicazione con l'AI",
        error: error.response.data,
      });
    } else if (error.code === "ECONNABORTED") {
      // Timeout nella richiesta
      logger.error("❌ Timeout nella comunicazione con l'AI.");
      return res
        .status(504)
        .json({ message: "❌ Timeout nella comunicazione con l'AI." });
    } else {
      // Errore generico
      logger.error(`❌ Errore AI: ${error.message}`);
      return res
        .status(500)
        .json({
          message: "❌ Errore nella comunicazione con l'AI",
          error: error.message,
        });
    }
  }
});

module.exports = router;
