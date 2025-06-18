// 📁 functions/loginRoutes.js
const axios = require("axios");
const admin = require("firebase-admin");

let API_KEY = process.env.PRIVATE_FIREBASE_API_KEY;

function setApiKey(key) {
  API_KEY = key;
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "❌ Email e password obbligatori" });
  }

  try {
    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
      {
        email,
        password,
        returnSecureToken: true,
      }
    );

    const { idToken, localId } = response.data;
    const userRecord = await admin.auth().getUser(localId);

    const db = admin.firestore();
    const userDocRef = db.collection("users").doc(localId);
    const userDoc = await userDocRef.get();

    let userData = {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName || "",
      photoURL: userRecord.photoURL || "",
      createdAt: userRecord.metadata.creationTime,
      lastLogin: userRecord.metadata.lastSignInTime,
      role: "user",
      plan: "BASE",
    };

    if (userDoc.exists) {
      const userInfo = userDoc.data();
      userData.role = userInfo.role || "user";
      userData.plan = userInfo.plan || "BASE";
    } else {
      await userDocRef.set({
        uid: userRecord.uid,
        email: userRecord.email,
        role: "user",
        plan: "BASE",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return res.status(200).json({
      ...userData,
      firebaseToken: idToken, // ✅ CAMPO CORRETTO per lo script PowerShell
      message: "✅ Login avvenuto con successo.",
    });
  } catch (error) {
    console.error(
      "❌ Errore nel login:",
      error.response?.data || error.message
    );
    return res.status(401).json({
      error: "❌ Credenziali non valide o utente inesistente.",
      details: error.response?.data || error.message,
    });
  }
}

module.exports = {
  setApiKey,
  login,
};
