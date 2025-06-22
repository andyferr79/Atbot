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
const rateLimit = require("express-rate-limit");
const loginRoutes = require("./loginRoutes");
const listEndpoints = require("express-list-endpoints");

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();
const app = express();

// ✅ Middleware base
app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Log richieste
app.use((req, res, next) => {
  console.log(`📥 [${req.method}] ${req.originalUrl}`);
  next();
});

// ✅ LoginLimiter
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: { error: "❌ Troppe richieste di login. Riprova più tardi." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ✅ Rotte dinamiche (sia /path che /api/path)
const routes = [
  ["bookings", "./bookingsRoutes"],
  ["reports/bookings", "./bookingsReportsRoutes"],
  ["backup", "./backupRoutes"],
  ["customers", "./customersRoutes"],
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
  ["agent-summary", "./agentSummaryRoutes"],
  ["ai/reminders", "./aiRemindersRoutes"],
  ["guests", "./guestsRoutes"],
  ["agent/marketing", "./marketingAssistant"],
  ["feedback", "./feedbackRoutes"],
  ["agent", "./agentRoutes"],
  ["cleaning-reports", "./cleaningReportsRoutes"],
  ["userinfo", "./userInfoRoutes"],
];

routes.forEach(([path, file]) => {
  try {
    const route = require(file);
    // monta su /<path>
    app.use(`/${path}`, route);
    // monta su /api/<path>
    app.use(`/api/${path}`, route);
  } catch (err) {
    console.error(`❌ Errore loading /${path} → ${file}`, err);
  }
});

// ✅ Login
loginRoutes.setApiKey(process.env.PRIVATE_FIREBASE_API_KEY);
app.post("/login", loginLimiter, (req, res) => {
  loginRoutes.login(req, res).catch(async (error) => {
    const ip = req.headers["x-forwarded-for"] || req.ip || "unknown";
    const { email } = req.body;
    await db.collection("LoginFailures").add({
      email: email || "unknown",
      ip,
      reason: error.message,
      timestamp: new Date(),
    });
    res.status(401).json({ error: "❌ Credenziali non valide." });
  });
});

// ─────── LISTA ENDPOINTS ───────
// Deve trovarsi **prima** del middleware 404
console.log("📑 Elenco endpoint:", JSON.stringify(listEndpoints(app), null, 2));
app.get("/routes", (req, res) => {
  res.json(listEndpoints(app));
});
// ────────────────────────────────

// 🔁 Fallback 404 (ultima definizione)
app.use((req, res) => {
  res.status(404).json({ error: "❌ Rotta non trovata." });
});

// 🔥 Errori globali
app.use((err, req, res, next) => {
  console.error("❌ Errore globale:", err);
  res.status(500).json({ error: "Errore interno" });
});

// ✅ Esporta funzione “api”
exports.api = onRequest(
  { timeoutSeconds: 60, memory: "512MiB", region: "europe-west1" },
  app
);
