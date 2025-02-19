const express = require("express");
const admin = require("../firebase"); // Importa Firebase Admin SDK
const router = express.Router();

// ✅ API per registrare un nuovo utente
router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email e password sono obbligatori" });
  }

  try {
    // Creazione utente su Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email,
      password,
      emailVerified: false,
      disabled: false,
    });

    // Generazione del token di accesso
    const token = await admin.auth().createCustomToken(userRecord.uid);

    // Salva l'utente su Firestore
    await admin.firestore().collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: userRecord.email,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res
      .status(201)
      .json({ uid: userRecord.uid, email: userRecord.email, token });
  } catch (error) {
    console.error("Errore nella registrazione:", error);
    res.status(500).json({ error: "Errore durante la registrazione" });
  }
});

module.exports = router;
