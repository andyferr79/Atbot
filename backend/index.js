// 📂 E:\ATBot\backend\index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const path = require("path");

// ✅ Inizializza Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = require(path.resolve(
    "E:/ATBot/firebase/serviceAccountKey.json"
  ));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL:
      "https://autotaskerbot-default-rtdb.europe-west1.firebasedatabase.app",
  });
  console.log("✅ Firebase inizializzato correttamente!");
}

// ✅ Crea l'app Express
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// ✅ Middleware di autenticazione Firebase
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(403).send("Token mancante");

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("❌ Errore nella verifica del token:", error);
    res.status(401).send("Token non valido");
  }
};

// ✅ Importa tutte le API disponibili
const apiRoutes = require("./routes/api");
app.use("/api", apiRoutes);

// ✅ Converti Express in Firebase Functions
exports.api = functions.https.onRequest(app);
