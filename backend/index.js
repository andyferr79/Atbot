const express = require("express");
const admin = require("firebase-admin");
const dotenv = require("dotenv");
const cors = require("cors");

// Carica le variabili d'ambiente
dotenv.config();

// Inizializza Firebase Admin SDK
let serviceAccount;
try {
  serviceAccount = require("../firebase/serviceAccountKey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL:
      "https://autotaskerbot-default-rtdb.europe-west1.firebasedatabase.app",
  });
} catch (error) {
  console.warn(
    "⚠️ Warning: Firebase non inizializzato. Controlla il file serviceAccountKey.json."
  );
}

// Crea un'app Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ✅ Prova a caricare express-fileupload (senza crash)
try {
  const fileUpload = require("express-fileupload");
  app.use(fileUpload());
} catch (error) {
  console.warn(
    "⚠️ Warning: express-fileupload non trovato, upload disabilitato."
  );
}

// ✅ Importa le API esistenti
const apiRoutes = require("./routes/api");
app.use("/api", apiRoutes);

// ✅ Importa la nuova API per i report delle prenotazioni
const bookingsReportsRoutes = require("./routes/bookingsReportsRoutes");
app.use("/api/reports/bookings", bookingsReportsRoutes);

// ✅ Importa l'API per i report finanziari
const financialReportsRoutes = require("./routes/financialReportsRoutes");
app.use("/api/reports/financial", financialReportsRoutes);

// ✅ Importa l'API per il report fornitori
const suppliersReportsRoutes = require("./routes/suppliersReportsRoutes");
app.use("/api/reports/suppliers", suppliersReportsRoutes);

// Rotta principale
app.get("/", (req, res) => {
  res.send("✅ Backend ATB è attivo!");
});

// Imposta la porta del server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Server in ascolto sulla porta ${PORT}`);
});
