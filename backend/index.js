const express = require("express");
const admin = require("firebase-admin");
const dotenv = require("dotenv");

// Carica le variabili d'ambiente
dotenv.config();

// Percorso del file serviceAccountKey.json
const serviceAccount = require("../firebase/serviceAccountKey.json");

// Inizializza Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://autotaskerbot-default-rtdb.europe-west1.firebasedatabase.app",
});

// Crea un'app Express
const app = express();

// Middleware per parsing del corpo delle richieste JSON
app.use(express.json());

// Importa le API
const apiRoutes = require("./routes/api");
app.use("/api", apiRoutes);

// Rotta principale
app.get("/", (req, res) => {
  res.send("Backend ATB è attivo!");
});

// Imposta la porta del server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server in ascolto sulla porta ${PORT}`);
});

