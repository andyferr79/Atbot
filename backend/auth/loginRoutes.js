const express = require("express");
const admin = require("firebase-admin");
const router = express.Router();

// ✅ API per il login dell'utente
router.post("/", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email e password sono obbligatori" });
  }

  try {
    // Verifica se l'utente esiste in Firebase Authentication
    const userRecord = await admin.auth().getUserByEmail(email);
    if (!userRecord) {
      return res.status(404).json({ error: "Utente non trovato" });
    }

    // Genera un token di accesso per l'utente
    const token = await admin.auth().createCustomToken(userRecord.uid);

    res
      .status(200)
      .json({ uid: userRecord.uid, email: userRecord.email, token });
  } catch (error) {
    console.error("Errore nel login:", error);
    res.status(500).json({ error: "Errore durante il login" });
  }
});

module.exports = router;
