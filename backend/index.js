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

// ✅ CORS: Ora accetta solo richieste dal frontend autorizzato
app.use(
  cors({
    origin: "http://localhost:3000", // Solo il frontend autorizzato può accedere
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// ✅ Middleware di autenticazione per proteggere le API
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(403).send("Token mancante");

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("❌ Errore durante la verifica del token:", error);
    res.status(401).send("Token non valido");
  }
};

// ✅ Importa API generali (Rooms, Guests, Bookings, Suppliers) con protezione
const apiRoutes = require("./routes/api");
app.use("/api", verifyToken, apiRoutes);

// ✅ Importa API specifiche per i report con protezione
const bookingsReportsRoutes = require("./routes/bookingsReportsRoutes");
app.use("/api/reports/bookings", verifyToken, bookingsReportsRoutes);

const financialReportsRoutes = require("./routes/financialReportsRoutes");
app.use("/api/reports/financial", verifyToken, financialReportsRoutes);

const suppliersReportsRoutes = require("./routes/suppliersReportsRoutes");
app.use("/api/reports/suppliers", verifyToken, suppliersReportsRoutes);

// Rotta principale (senza protezione per verificare lo stato del server)
app.get("/", (req, res) => {
  res.send("✅ Backend ATB è attivo e protetto!");
});

// ✅ Imposta la porta del server su tutte le interfacce
const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `✅ Server in ascolto su tutte le interfacce sulla porta ${PORT}`
  );
});
