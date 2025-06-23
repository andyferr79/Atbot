/**************************************************************
 *  StayPro / Hoxy – Cloud Functions (Node.js 20 – API v2)   *
 *  ✅ Caricamento Express app con tutte le rotte             *
 *  ✅ Middleware, logging e gestione errori globali          *
 **************************************************************/

const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const rateLimit = require("express-rate-limit");
const loginRoutes = require("./loginRoutes");
const listEndpoints = require("express-list-endpoints");
const { v4: uuidv4 } = require("uuid");
const helmet = require("helmet");

// ✅ Inizializza Firebase Admin con configurazione dinamica
const projectId = functions.config().hoxy.firebase_project_id;
const clientEmail = functions.config().hoxy.firebase_client_email;
const privateKey = functions
  .config()
  .hoxy.firebase_private_key.replace(/\\n/g, "\n");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

const db = admin.firestore();
const app = express();

// ✅ Helmet per sicurezza avanzata
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

// ✅ CORS più sicuro
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? ["https://hoxy.ai"]
    : ["http://localhost:3000", "http://localhost:5173"];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// ✅ Limite richieste globale
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Troppe richieste. Riprova più tardi." },
});
app.use(globalLimiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ✅ Log richieste + requestId
app.use((req, res, next) => {
  req.requestId = uuidv4();
  const startTime = Date.now();
  console.log(
    JSON.stringify({
      type: "request_start",
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      ip: req.headers["x-forwarded-for"] || req.ip,
      timestamp: new Date().toISOString(),
    })
  );
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    console.log(
      JSON.stringify({
        type: "request_end",
        requestId: req.requestId,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      })
    );
  });
  next();
});

// ✅ Limite login
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: { error: "❌ Troppe richieste di login. Riprova più tardi." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ✅ Monta tutte le rotte in modo pulito
const mountRoute = (app, paths, handler) => {
  const pathArray = Array.isArray(paths) ? paths : [paths];
  pathArray.forEach((path) => {
    app.use(path, handler);
    app.use(`/api${path}`, handler);
  });
};

// ✅ Definizione rotte
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
    mountRoute(app, `/${path}`, route);
    console.log(`✅ Mounted: /${path} and /api/${path}`);
  } catch (err) {
    console.error(`❌ Failed to load /${path} from ${file}:`, err.message);
    mountRoute(app, `/${path}`, (req, res) => {
      res.status(503).json({
        error: `Servizio ${path} non disponibile`,
        timestamp: new Date().toISOString(),
      });
    });
  }
});

// ✅ Login personalizzato
const loginHandler = (req, res) => {
  loginRoutes.login(req, res).catch(async (error) => {
    const ip = req.headers["x-forwarded-for"] || req.ip || "unknown";
    const { email } = req.body;
    const sanitizedReason = error.code || "AUTH_FAILED";
    await db.collection("LoginFailures").add({
      email: email || "unknown",
      ip,
      reason: sanitizedReason,
      timestamp: new Date(),
    });
    res.status(401).json({ error: "❌ Credenziali non valide." });
  });
};
app.post(["/login", "/api/login"], loginLimiter, loginHandler);

// ✅ Debug rotte
app.get(["/routes", "/api/routes"], (req, res) => {
  res.json(listEndpoints(app));
});
app.get(["/debug/routes", "/api/debug/routes"], (req, res) => {
  const endpoints = listEndpoints(app);
  const grouped = endpoints.map((endpoint) => {
    const hasApi = endpoints.some(
      (e) => e.path === `/api${endpoint.path.replace("/api", "")}`
    );
    const hasRoot = endpoints.some(
      (e) => e.path === endpoint.path.replace("/api", "")
    );
    return {
      path: endpoint.path,
      methods: endpoint.methods,
      hasApiVersion: hasApi,
      hasRootVersion: hasRoot,
    };
  });
  res.json({
    total: endpoints.length,
    routes: grouped,
    missing_api_prefix: grouped.filter(
      (r) => !r.hasApiVersion && !r.path.startsWith("/api")
    ),
  });
});

// ✅ Health check
app.get(["/health", "/api/health"], async (req, res) => {
  try {
    await db.collection("_health").limit(1).get();
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      error: "Database connection failed",
    });
  }
});

// 🔁 Fallback 404
app.use((req, res) => {
  res.status(404).json({ error: "❌ Rotta non trovata." });
});

// 🔥 Errori globali
app.use((err, req, res, next) => {
  const isDev = process.env.NODE_ENV !== "production";
  if (isDev) {
    console.error("❌ Errore completo:", err);
  } else {
    console.error("❌ Errore produzione:", {
      message: err.message,
      stack: err.stack?.split("\n")[0],
      requestId: req.requestId,
    });
  }
  res.status(err.status || 500).json({
    error: isDev ? err.message : "Errore interno del server",
  });
});

// ✅ Reverse proxy per FastAPI
const proxy = require("./proxy/index");
app.use("/", proxy);

// ✅ Export per Cloud Functions
exports.api = functions.region("europe-west1").https.onRequest(app);
