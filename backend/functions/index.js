/**************************************************************
 *  StayPro / Hoxy – Cloud Functions (Node.js 20 – API v2)   *
 *  ✅ Caricamento Express app con tutte le rotte             *
 *  ✅ Middleware, logging e gestione errori globali          *
 **************************************************************/

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const { onRequest } = require("firebase-functions/v2/https");
const { rateLimiter } = require("./middlewares/rateLimiter");
const loginRoutes = require("./loginRoutes");

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();
const app = express();

// ✅ Middleware base
app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Middleware log richieste
app.use((req, res, next) => {
  console.log(`📥 [${req.method}] ${req.originalUrl}`);
  next();
});

// ✅ LoginLimiter corretto
const loginLimiter = rateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 10,
});

// ✅ Lista rotte modulari
const routes = [
  ["bookings", "./bookingsRoutes"],
  ["reports/bookings", "./bookingsReportsRoutes"],
  ["backup", "./backupRoutes"],
  ["customers", "./customersRoutes"],
  // ["reports/customers", "./reportsCustomersRoutes"], // ⏳ Da creare se necessario
  ["reports-export", "./reportsExportRoutes"],
  ["reports", "./reportsRoutes"],
  ["reports-stats", "./reportsStatsRoutes"],
  ["channel-manager", "./channelManagerRoutes"],
  ["channel-manager-sync", "./channelManagerSyncRoutes"],
  ["rooms", "./roomsRoutes"],
  ["suppliers", "./suppliersRoutes"],
  ["suppliers-reports", "./suppliersReportsRoutes"],
  ["notifications", "./notificationsRoutes"],
  ["announcements", "./announcementRoutes"],
  ["settings", "./settingsRoutes"],
  ["marketing", "./marketingRoutes"],
  ["marketing-reports", "./marketingReportsRoutes"],
  ["expenses", "./expensesRoutes"],
  ["housekeeping", "./housekeepingRoutes"],
  ["housekeeping-schedule", "./housekeepingScheduleRoutes"],
  ["dashboard", "./dashboardOverviewRoutes"],
  ["financial/reports", "./financialReportsRoutes"],
  ["financial", "./financesRoutes"],
  ["reviews", "./reviewsRoutes"],
  ["pricing", "./pricingRoutes"],
  ["pricing-recommendations", "./pricingRecommendationsRoutes"],
  ["ai", "./aiRoutes"],
  ["properties", "./propertiesRoutes"],
  ["admin", "./adminRoutes"],
  ["admin-users", "./adminUserRoutes"],
  ["automation", "./automationTasksRoutes"],
  // ["stripe", "./stripeRoutes"], // ⏳ In attesa chiave STRIPE
  ["agent-summary", "./agentSummaryRoutes"],
  ["ai/reminders", "./aiRemindersRoutes"],
  ["guests", "./guestsRoutes"],
  ["agent/marketing", "./marketingAssistant"],
  ["feedback", "./feedbackRoutes"],
  ["agent", "./agentRoutes"],
  ["cleaning-reports", "./cleaningReportsRoutes"],
  ["scheduler", "./scheduledDailyTask"],
  ["seo-strategy", "./seoStrategy"],
];

// ✅ Caricamento dinamico delle rotte
routes.forEach(([path, file]) => {
  try {
    const route = require(file);
    app.use(`/${path}`, route);
    console.log(`✅ Loaded route /${path} → ${file}`);
  } catch (error) {
    console.error(`❌ Failed to load route /${path} → ${file}`);
    console.error(error);
  }
});

// ✅ Login con protezione e logging
loginRoutes.setApiKey(process.env.FIREBASE_API_KEY);

app.post("/login", loginLimiter, async (req, res) => {
  const { email } = req.body;
  try {
    await loginRoutes.login(req, res);
  } catch (error) {
    const ip = req.headers["x-forwarded-for"] || req.ip || "unknown";
    await db.collection("LoginFailures").add({
      email: email || "unknown",
      ip,
      reason: error.message || "Errore login",
      timestamp: new Date(),
    });
    console.error("❌ Tentativo login fallito:", email, error.message);
    return res.status(401).json({
      error: "❌ Credenziali non valide o utente inesistente.",
    });
  }
});
console.log("✅ Loaded route /login → loginRoutes.js (protetta + logging)");

// 🔁 Catch-all per rotte non trovate
app.use((req, res) => {
  res.status(404).json({ error: "❌ Rotta non trovata." });
});

// 🔥 Gestione errori non gestiti
app.use((err, req, res, next) => {
  console.error("❌ Errore globale:", err);
  res.status(500).json({ error: "Errore interno" });
});

// ✅ Esportazione finale
exports.api = onRequest(
  {
    timeoutSeconds: 60,
    memory: "512MiB",
    region: "europe-west1", // 🇪🇺 Ottimizzato per EU
  },
  app
);
