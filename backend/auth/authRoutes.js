const express = require("express");
const admin = require("firebase-admin");
const router = express.Router();

// ✅ API per registrare un nuovo utente
router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email e password sono obbligatori" });
  }

  try {
    // 🔥 Crea l'utente in Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email,
      password,
    });

    // 🔥 Genera un Custom Token per l'accesso
    const token = await admin.auth().createCustomToken(userRecord.uid);

    res.status(201).json({
      uid: userRecord.uid,
      email: userRecord.email,
      token,
    });
  } catch (error) {
    console.error("❌ Errore nella registrazione:", error);
    res.status(500).json({ error: "Errore durante la registrazione" });
  }
});

module.exports = router;
