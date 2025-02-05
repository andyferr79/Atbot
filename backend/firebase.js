const admin = require("firebase-admin");
const path = require("path");

// ✅ Verifica se Firebase è già stato inizializzato per evitare errori
if (!admin.apps.length) {
  const serviceAccount = require(path.join(
    __dirname,
    "../firebase/serviceAccountKey.json"
  ));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL:
      "https://autotaskerbot-default-rtdb.europe-west1.firebasedatabase.app",
  });
}

module.exports = admin;
