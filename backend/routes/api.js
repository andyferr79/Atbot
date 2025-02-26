const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");

// ✅ Importiamo il file aiRoutes.js
const aiRoutes = require("./aiRoutes");

// ✅ Integriamo aiRoutes con l'API principale
router.use("/ai", aiRoutes);

// **Rotta di test Firebase**
router.get("/test-firebase", async (req, res) => {
  try {
    const db = admin.firestore();
    const docRef = db.collection("test").doc("example");
    await docRef.set({ message: "Connessione a Firebase riuscita!" });
    const doc = await docRef.get();
    res.json(doc.data());
  } catch (error) {
    console.error("Errore nella connessione a Firebase:", error);
    res.status(500).send("Errore nella connessione a Firebase");
  }
});

// ✅ **Manteniamo tutte le altre API come sono**
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

// ✅ **Manteniamo le route esistenti**
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

// ✅ **Integriamo l'AI**
router.use("/ai", aiRoutes); // 🔥 AI INTEGRATA

module.exports = router;
