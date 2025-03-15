const admin = require("firebase-admin");
const path = require("path");

// Inizializza Firebase Admin SDK con il percorso assoluto del file serviceAccountKey.json
const serviceAccount = require(path.join(__dirname, "serviceAccountKey.json"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://autotaskerbot-default-rtdb.europe-west1.firebasedatabase.app"
});

// ID utente per cui generare il token
const userId = "gLSADYgpyLRww3O4AU1huxl8XES2";

admin.auth().createCustomToken(userId)
  .then((customToken) => {
    console.log("\n✅ TOKEN GENERATO:\n", customToken);
  })
  .catch((error) => {
    console.error("\n❌ ERRORE NEL GENERARE IL TOKEN:\n", error);
  });
