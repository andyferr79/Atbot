// 📁 functions/proxy/index.js
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");
const { verifyToken } = require("./middleware/auth");
const { requestLogger } = require("./middleware/logging");

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());
app.use(requestLogger);
app.use(verifyToken);

// 🔵 Firebase backend
const firebaseRoutes = [
  "/api/admin/revenue",
  "/api/admin/subscriptions",
  "/api/admin/churn",
  "/api/admin/status",
  "/api/admin/ai-usage",
  "/api/admin/logs",
  "/api/admin/backup",
  "/api/userinfo",
  "/api/bookings",
  "/api/customers",
  "/api/rooms",
  "/api/suppliers",
  "/api/notifications",
  "/api/settings",
  "/api/reviews",
  "/api/financial",
  "/api/properties",
];

// 🔶 FastAPI backend (AI)
const fastapiRoutes = ["/api/chat", "/api/agent", "/api/admin/ia"];

// 🔁 Proxy Firebase
firebaseRoutes.forEach((route) => {
  app.use(
    route,
    createProxyMiddleware({
      target: process.env.FIREBASE_FUNCTIONS_URL,
      changeOrigin: true,
      timeout: 30000,
      onError: (err, req, res) => {
        console.error(`❌ Firebase Error [${route}]:`, err.message);
        res.status(503).json({ error: "Firebase service unavailable" });
      },
    })
  );
});

// 🔁 Proxy FastAPI
fastapiRoutes.forEach((route) => {
  app.use(
    route,
    createProxyMiddleware({
      target: process.env.FASTAPI_URL,
      changeOrigin: true,
      pathRewrite: {
        "^/api/chat": "/chat",
        "^/api/agent": "/agent",
        "^/api/admin/ia": "/admin/ia",
      },
      timeout: 60000,
      onError: (err, req, res) => {
        console.error(`❌ FastAPI Error [${route}]:`, err.message);
        res.status(503).json({ error: "FastAPI service unavailable" });
      },
    })
  );
});

// 🔍 Health check
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    firebase: process.env.FIREBASE_FUNCTIONS_URL,
    fastapi: process.env.FASTAPI_URL,
  });
});

// 🚫 Rotte non trovate
app.use("/api/*", (req, res) => {
  console.warn(`⚠️ Unmatched API route: ${req.path}`);
  res.status(404).json({
    error: "API endpoint not found",
    path: req.path,
    suggestion: "Check API documentation",
  });
});

module.exports = app;
