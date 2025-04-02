const axios = require("axios");
const admin = require("firebase-admin");

const FIREBASE_AUTH_URL =
  "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword";

// 🔧 Verrà settata da index.js
let API_KEY = "";

// ✅ Metodo per ricevere la chiave API da index.js
exports.setApiKey = (key) => {
  API_KEY = key;
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "❌ Email e password obbligatori" });
  }

  try {
    const response = await axios.post(`${FIREBASE_AUTH_URL}?key=${API_KEY}`, {
      email,
      password,
      returnSecureToken: true,
    });

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

    res.status(200).json({
      ...userData,
      token: idToken,
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
};
