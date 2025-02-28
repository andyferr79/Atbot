const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const rateLimit = require("express-rate-limit");
const winston = require("winston");

// ✅ Configurazione del logging avanzato
const logger = winston.createLogger({
  level: "error",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "logs/api_errors.log" }),
  ],
});

// ✅ Middleware per limitare le richieste di test Firebase (Max 10 richieste per IP ogni 5 minuti)
const testLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: "❌ Troppe richieste. Riprova più tardi.",
});

// ✅ **Verifica connessione Firebase prima di avviare le route**
try {
  admin.firestore();
  console.log("✅ Connessione a Firebase riuscita!");
} catch (error) {
  logger.error("❌ Errore nella connessione a Firebase:", error);
  throw new Error("❌ Impossibile connettersi a Firebase.");
}

// ✅ Importiamo il file aiRoutes.js
const aiRoutes = require("./aiRoutes");

// ✅ Integriamo aiRoutes con l'API principale
router.use("/ai", aiRoutes);

// ✅ **Rotta di test Firebase**
router.get("/test-firebase", testLimiter, async (req, res) => {
  try {
    const db = admin.firestore();
    const docRef = db.collection("test").doc("example");
    await docRef.set({ message: "Connessione a Firebase riuscita!" });
    const doc = await docRef.get();
    res.json(doc.data());
  } catch (error) {
    logger.error("❌ Errore nella connessione a Firebase:", error);
    res
      .status(500)
      .json({
        message: "Errore nella connessione a Firebase",
        details: error.message,
      });
  }
});

// ✅ **Importiamo tutte le altre route**
const bookingsRoutes = require("./bookingsRoutes");
const bookingsReportsRoutes = require("./bookingsReportsRoutes");
const channelManagerRoutes = require("./channelManagerRoutes");
const cleaningReportsRoutes = require("./cleaningReportsRoutes");
const customersReportsRoutes = require("./customersReportsRoutes");
const customersRoutes = require("./customersRoutes");
const dashboardOverviewRoutes = require("./dashboardOverviewRoutes");
const expensesRoutes = require("./expensesRoutes");
const financesRoutes = require("./financesRoutes");
const financialReportsRoutes = require("./financialReportsRoutes");
const housekeepingRoutes = require("./housekeepingRoutes");
const marketingReportsRoutes = require("./marketingReportsRoutes");
const marketingRoutes = require("./marketingRoutes");
const notificationsRoutes = require("./notificationsRoutes");
const pricingRoutes = require("./pricingRoutes");
const reportsRoutes = require("./reportsRoutes");
const reviewsRoutes = require("./reviewsRoutes");
const settingsRoutes = require("./settingsRoutes");
const suppliersReportsRoutes = require("./suppliersReportsRoutes");
const suppliersRoutes = require("./suppliersRoutes");

// ✅ **Definiamo tutte le route**
router.use("/bookings", bookingsRoutes);
router.use("/bookings/reports", bookingsReportsRoutes);
router.use("/channel-manager", channelManagerRoutes);
router.use("/cleaning/reports", cleaningReportsRoutes);
router.use("/customers/reports", customersReportsRoutes);
router.use("/customers", customersRoutes);
router.use("/dashboard", dashboardOverviewRoutes);
router.use("/expenses", expensesRoutes);
router.use("/finances", financesRoutes);
router.use("/finances/reports", financialReportsRoutes);
router.use("/housekeeping", housekeepingRoutes);
router.use("/marketing/reports", marketingReportsRoutes);
router.use("/marketing", marketingRoutes);
router.use("/notifications", notificationsRoutes);
router.use("/pricing", pricingRoutes);
router.use("/reports", reportsRoutes);
router.use("/reviews", reviewsRoutes);
router.use("/settings", settingsRoutes);
router.use("/suppliers/reports", suppliersReportsRoutes);
router.use("/suppliers", suppliersRoutes);

// ✅ **Rimosso il doppio utilizzo di `router.use("/ai", aiRoutes);`**

module.exports = router;
