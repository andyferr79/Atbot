const admin = require("firebase-admin");
const path = require("path");
const { LoggingWinston } = require("@google-cloud/logging-winston");
const winston = require("winston");

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

// ✅ Configura il logging con Cloud Logging di Firebase
const loggingWinston = new LoggingWinston();
const logger = winston.createLogger({
  level: "info",
  transports: [
    new winston.transports.Console(),
    loggingWinston, // ✅ Invia i log a Firebase Logging
  ],
});

module.exports = { admin, logger };
