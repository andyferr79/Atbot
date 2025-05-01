const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");
const { LoggingWinston } = require("@google-cloud/logging-winston");
const winston = require("winston");

// Percorso corretto del service account
const serviceAccountPath = path.join(
  __dirname,
  "../firebase/serviceAccountKey.json"
);

if (!admin.apps.length) {
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL:
        "https://autotaskerbot-default-rtdb.europe-west1.firebasedatabase.app",
    });

    console.log("✅ Firebase Admin inizializzato con serviceAccountKey.json");
  } else {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });

    console.log(
      "⚠️ Firebase Admin inizializzato con credenziali di default (senza chiave JSON)"
    );
  }
}

// Logging con Winston + Cloud Logging
const loggingWinston = new LoggingWinston();
const logger = winston.createLogger({
  level: "info",
  transports: [new winston.transports.Console(), loggingWinston],
});

module.exports = { admin, logger };
