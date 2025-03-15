const admin = require("firebase-admin");
const path = require("path");

// Inizializza Firebase Admin SDK con il percorso corretto
const serviceAccount = require(path.join(__dirname, "serviceAccountKey.json"));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://autotaskerbot-default-rtdb.europe-west1.firebasedatabase.app"
    });
}

// ID utente
const userId = "gLSADYgpyLRww3O4AU1huxl8XES2";

// Genera un token valido per autenticazione Firebase
admin.auth().createCustomToken(userId)
    .then((customToken) => {
        console.log("\n✅ TOKEN GENERATO:\n", customToken);
        process.exit(); // Chiude Node.js automaticamente
    })
    .catch((error) => {
        console.error("\n❌ ERRORE NEL GENERARE IL TOKEN:\n", error);
        process.exit(1);
    });
