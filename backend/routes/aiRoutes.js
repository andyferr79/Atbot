const express = require("express");
const router = express.Router();
const axios = require("axios");

const AI_BACKEND_URL = "http://127.0.0.1:8000"; // URL locale del backend AI

// ✅ Rotta per la chat con l'AI
router.post("/chat", async (req, res) => {
  try {
    const { user_message, session_id } = req.body;

    const response = await axios.post(`${AI_BACKEND_URL}/chat`, {
      user_message,
      session_id,
    });

    res.json(response.data);
  } catch (error) {
    console.error("Errore nella comunicazione con l'AI:", error.message);
    res
      .status(500)
      .json({
        message: "Errore nella comunicazione con l'AI",
        error: error.message,
      });
  }
});

module.exports = router;
