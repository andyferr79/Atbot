const express = require("express");
const admin = require("firebase-admin");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

// Carica le variabili d'ambiente
dotenv.config();

// Inizializza Firebase Admin SDK
let serviceAccount;
try {
  serviceAccount = require(path.resolve(
    "E:/ATBot/firebase/serviceAccountKey.json"
  ));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL:
      "https://autotaskerbot-default-rtdb.europe-west1.firebasedatabase.app",
  });
  console.log("✅ Firebase inizializzato correttamente!");
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

// ✅ Importa API generali con protezione
const apiRoutes = require("./routes/api");
app.use("/api", verifyToken, apiRoutes);

// ✅ Importa API per i report con protezione
const bookingsReportsRoutes = require("./routes/bookingsReportsRoutes");
app.use("/api/reports/bookings", verifyToken, bookingsReportsRoutes);

const financialReportsRoutes = require("./routes/financialReportsRoutes");
app.use("/api/reports/financial", verifyToken, financialReportsRoutes);

const suppliersReportsRoutes = require("./routes/suppliersReportsRoutes");
app.use("/api/reports/suppliers", verifyToken, suppliersReportsRoutes);

const customersReportsRoutes = require("./routes/customersReportsRoutes");
app.use("/api/reports/customers", verifyToken, customersReportsRoutes);

// ✅ Importa API di autenticazione
const authRoutes = require("./auth/authRoutes");
app.use("/api/auth", authRoutes);

const loginRoutes = require("./auth/loginRoutes");
app.use("/api/auth/login", loginRoutes);

// ✅ Importa API per la panoramica generale della dashboard
const dashboardOverviewRoutes = require("./routes/dashboardOverviewRoutes");
app.use("/api/dashboard", dashboardOverviewRoutes);

// ✅ Importa API specifiche per la gestione di StayPro
const bookingsRoutes = require("./routes/bookingsRoutes");
app.use("/api/bookings", verifyToken, bookingsRoutes);

const housekeepingRoutes = require("./routes/housekeepingRoutes");
app.use("/api/housekeeping", verifyToken, housekeepingRoutes);

const customersRoutes = require("./routes/customersRoutes");
app.use("/api/customers", verifyToken, customersRoutes);

const financesRoutes = require("./routes/financesRoutes");
app.use("/api/finances", verifyToken, financesRoutes);

const marketingRoutes = require("./routes/marketingRoutes");
app.use("/api/marketing", verifyToken, marketingRoutes);

const notificationsRoutes = require("./routes/notificationsRoutes");
app.use("/api/notifications", verifyToken, notificationsRoutes);

const reportsRoutes = require("./routes/reportsRoutes");
app.use("/api/reports", verifyToken, reportsRoutes);

const channelManagerRoutes = require("./routes/channelManagerRoutes");
app.use("/api/channel-manager", verifyToken, channelManagerRoutes);

const pricingRoutes = require("./routes/pricingRoutes");
app.use("/api/pricing", verifyToken, pricingRoutes);

const reviewsRoutes = require("./routes/reviewsRoutes");
app.use("/api/reviews", verifyToken, reviewsRoutes);

const expensesRoutes = require("./routes/expensesRoutes");
app.use("/api/expenses", verifyToken, expensesRoutes);

// ✅ Importa API AI
const aiRoutes = require("./routes/aiRoutes");
app.use("/api/ai", aiRoutes); // 🔥 AI INTEGRATA

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
