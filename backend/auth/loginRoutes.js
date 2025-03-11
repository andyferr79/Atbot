const express = require("express");
const axios = require("axios"); // ✅ Usa Axios per Firebase REST API
const router = express.Router();

const FIREBASE_AUTH_URL =
  "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword";
const API_KEY = process.env.FIREBASE_API_KEY; // ✅ Prende la chiave da .env

// ✅ API per il login
router.post("/", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email e password sono obbligatori" });
  }

  try {
    // 🔥 Verifica le credenziali con Firebase REST API
    const response = await axios.post(`${FIREBASE_AUTH_URL}?key=${API_KEY}`, {
      email,
      password,
      returnSecureToken: true,
    });

    const { idToken, localId } = response.data;

    // 🔥 Recupera informazioni utente da Firebase Admin SDK
    const userRecord = await admin.auth().getUser(localId);

    res.status(200).json({
      uid: userRecord.uid,
      email: userRecord.email,
      token: idToken, // ✅ Token per autenticazione frontend
    });
  } catch (error) {
    console.error(
      "❌ Errore nel login:",
      error.response?.data || error.message
    );
    res.status(401).json({
      error: "❌ Credenziali non valide o utente inesistente.",
      details: error.response?.data || error.message,
    });
  }
});

module.exports = router;
