const express = require("express");
const admin = require("firebase-admin");
const router = express.Router();

// ✅ API per registrare un nuovo utente con salvataggio in Firestore
router.post("/register", async (req, res) => {
  const { email, password, role = "user" } = req.body; // Ruolo di default: "user"

  if (!email || !password) {
    return res
      .status(400)
      .json({ error: "❌ Email e password sono obbligatori" });
  }

  try {
    // 🔥 Crea l'utente in Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email,
      password,
    });

    // 🔥 Genera un Custom Token per l'accesso
    const token = await admin.auth().createCustomToken(userRecord.uid);

    // 🔥 Salva i dettagli dell’utente in Firestore
    const db = admin.firestore();
    await db.collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: userRecord.email,
      role, // Ruolo dell'utente (admin, user, staff)
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({
      uid: userRecord.uid,
      email: userRecord.email,
      role,
      token,
      message: "✅ Registrazione completata e utente salvato su Firestore.",
    });
  } catch (error) {
    console.error("❌ Errore nella registrazione:", error);
    res.status(500).json({ error: "Errore durante la registrazione" });
  }
});

// ✅ API per ottenere i dettagli dell'utente autenticato
router.get("/user", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "❌ Token mancante" });
    }

    // 🔥 Verifica il token JWT con Firebase
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userRecord = await admin.auth().getUser(decodedToken.uid);

    // 🔥 Recupera i dati aggiuntivi da Firestore
    const db = admin.firestore();
    const userDoc = await db.collection("users").doc(userRecord.uid).get();

    if (!userDoc.exists) {
      return res
        .status(404)
        .json({ error: "❌ Utente non trovato in Firestore" });
    }

    res.status(200).json({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName || "",
      photoURL: userRecord.photoURL || "",
      createdAt: userRecord.metadata.creationTime,
      lastLogin: userRecord.metadata.lastSignInTime,
      role: userDoc.data().role || "user", // Recupera il ruolo da Firestore
    });
  } catch (error) {
    console.error("❌ Errore nel recupero dell'utente:", error);
    res.status(500).json({ error: "Errore nel recupero dei dati utente" });
  }
});

// ✅ API per il logout dell'utente
router.post("/logout", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "❌ Token mancante" });
    }

    // 🔥 Verifica il token con Firebase
    const decodedToken = await admin.auth().verifyIdToken(token);

    // 🔥 Revoca il token per invalidarlo (logout effettivo)
    await admin.auth().revokeRefreshTokens(decodedToken.uid);

    res.status(200).json({ message: "✅ Logout effettuato con successo" });
  } catch (error) {
    console.error("❌ Errore durante il logout:", error);
    res.status(500).json({ error: "Errore nel logout" });
  }
});

module.exports = router;
