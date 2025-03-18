const express = require("express");
const axios = require("axios");
const admin = require("firebase-admin"); // ✅ Importa Firebase Admin SDK
const router = express.Router();

const FIREBASE_AUTH_URL =
  "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword";
const API_KEY = process.env.FIREBASE_API_KEY; // ✅ Prende la chiave da .env

// ✅ API per il login
router.post("/", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "❌ Email e password obbligatori" });
  }

  try {
    // 🔥 Verifica le credenziali con Firebase REST API
    const response = await axios.post(`${FIREBASE_AUTH_URL}?key=${API_KEY}`, {
      email,
      password,
      returnSecureToken: true,
    });

    const { idToken, localId } = response.data;

    // 🔥 Recupera le informazioni dell'utente da Firebase Admin SDK
    const userRecord = await admin.auth().getUser(localId);

    // 🔥 Recupera i dati utente da Firestore
    const db = admin.firestore();
    const userDoc = await db.collection("users").doc(localId).get();

    let userData = {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName || "",
      photoURL: userRecord.photoURL || "",
      createdAt: userRecord.metadata.creationTime,
      lastLogin: userRecord.metadata.lastSignInTime,
      role: "user", // Default role
    };

    if (userDoc.exists) {
      userData.role = userDoc.data().role || "user"; // ✅ Recupera il ruolo
    } else {
      // Se l'utente non esiste in Firestore, lo salva con un ruolo predefinito
      await db.collection("users").doc(localId).set({
        uid: userRecord.uid,
        email: userRecord.email,
        role: "user",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    res.status(200).json({
      ...userData,
      token: idToken, // ✅ Token per autenticazione frontend
      message: "✅ Login avvenuto con successo.",
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
