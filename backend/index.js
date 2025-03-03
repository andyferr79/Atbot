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
    origin: "http://localhost:3000",
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
app.use("/api", apiRoutes);

// ✅ IMPORT API REPORT (senza protezione per test)
const bookingsReportsRoutes = require("./routes/bookingsReportsRoutes");
app.use("/api/reports/bookings", bookingsReportsRoutes);

const financialReportsRoutes = require("./routes/financialReportsRoutes");
app.use("/api/reports/financial", financialReportsRoutes);

const suppliersReportsRoutes = require("./routes/suppliersReportsRoutes");
app.use("/api/reports/suppliers", suppliersReportsRoutes);

const customersReportsRoutes = require("./routes/customersReportsRoutes");
app.use("/api/reports/customers", customersReportsRoutes);

// ✅ Importa API di autenticazione
const authRoutes = require("./auth/authRoutes");
app.use("/api/auth", authRoutes);

const loginRoutes = require("./auth/loginRoutes");
app.use("/api/auth/login", loginRoutes);

// ✅ Importa API per la panoramica generale della dashboard
const dashboardOverviewRoutes = require("./routes/dashboardOverviewRoutes");
app.use("/api/dashboard", dashboardOverviewRoutes);

// ✅ Importa API specifiche per StayPro
const bookingsRoutes = require("./routes/bookingsRoutes");
app.use("/api/bookings", bookingsRoutes);

const housekeepingRoutes = require("./routes/housekeepingRoutes");
app.use("/api/housekeeping", housekeepingRoutes);

const customersRoutes = require("./routes/customersRoutes");
app.use("/api/customers", customersRoutes);

const financesRoutes = require("./routes/financesRoutes");
app.use("/api/finances", financesRoutes);

const marketingRoutes = require("./routes/marketingRoutes");
app.use("/api/marketing", marketingRoutes);

const notificationsRoutes = require("./routes/notificationsRoutes");
app.use("/api/notifications", notificationsRoutes);

const reportsRoutes = require("./routes/reportsRoutes");
app.use("/api/reports", reportsRoutes);

const reportsStatsRoutes = require("./routes/reportsStatsRoutes");
app.use("/api/reports/stats", reportsStatsRoutes);

const reportsExportRoutes = require("./routes/reportsExportRoutes");
app.use("/api/reports/export", reportsExportRoutes);

const channelManagerRoutes = require("./routes/channelManagerRoutes");
app.use("/api/channel-manager", channelManagerRoutes);

const channelManagerSyncRoutes = require("./routes/channelManagerSyncRoutes");
app.use("/api/channel-manager/sync", channelManagerSyncRoutes);

const pricingRoutes = require("./routes/pricingRoutes");
app.use("/api/pricing", pricingRoutes);

const pricingRecommendationsRoutes = require("./routes/pricingRecommendationsRoutes");
app.use("/api/pricing/recommendations", pricingRecommendationsRoutes);

const automationTasksRoutes = require("./routes/automationTasksRoutes");
app.use("/api/automation/tasks", automationTasksRoutes);

const housekeepingScheduleRoutes = require("./routes/housekeepingScheduleRoutes");
app.use("/api/housekeeping/schedule", housekeepingScheduleRoutes);

const reviewsRoutes = require("./routes/reviewsRoutes");
app.use("/api/reviews", reviewsRoutes);

const expensesRoutes = require("./routes/expensesRoutes");
app.use("/api/expenses", expensesRoutes);

// ✅ Importa API AI
const aiRoutes = require("./routes/aiRoutes");
app.use("/api/ai", aiRoutes);

// ✅ Rotta di test per verificare lo stato del backend
app.get("/test", (req, res) => {
  console.log("✅ Endpoint /test chiamato correttamente");
  res.send("✅ Backend ATB è attivo e funzionante!");
});

// ✅ Imposta la porta del server su tutte le interfacce
const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `✅ Server in ascolto su tutte le interfacce sulla porta ${PORT}`
  );
});
