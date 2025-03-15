const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

// Funzione per verificare il token con log dettagliati
const verifyToken = async (req, res, next) => {
  console.log("📌 Header ricevuto:", req.headers);

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.error("❌ Token mancante o malformato!");
    return res.status(403).json({ error: "❌ Token mancante o malformato" });
  }

  const token = authHeader.split(" ")[1];
  console.log("📌 Token ricevuto:", token);

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log(
      "✅ Token verificato con successo. Dati ricevuti:",
      decodedToken
    );

    // Log extra per verificare i dati importanti del token
    console.log("🔹 UID:", decodedToken.uid);
    console.log("🔹 Email:", decodedToken.email);
    console.log("🔹 Expira:", new Date(decodedToken.exp * 1000).toISOString());

    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("❌ Errore nella verifica del token:", error);
    return res
      .status(401)
      .json({ error: "❌ Token non valido", details: error.message });
  }
};

// Middleware per rimuovere il Rate Limiting temporaneamente
const disableRateLimit = (req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Authorization, Content-Type");

  console.log("🔄 Bypass Rate Limit per questa richiesta.");
  next();
};

// 🔹 Correzione per la funzione `secureFunction`
const secureFunction = (handler) =>
  onRequest(async (req, res) => {
    try {
      await new Promise((resolve, reject) => {
        disableRateLimit(req, res, async () => {
          await verifyToken(req, res, (err) => {
            if (err) return reject(err);
            resolve();
          });
        });
      });

      return handler(req, res);
    } catch (error) {
      console.error("❌ Errore in `secureFunction`:", error);
      return res
        .status(500)
        .json({ error: "❌ Errore interno", details: error.message });
    }
  });

exports.getBookingsData = secureFunction(
  require("./bookingsRoutes").getBookingsData
);
exports.getBookingsReports = secureFunction(
  require("./bookingsReportsRoutes").getBookingsReports
);
exports.syncChannelManager = secureFunction(
  require("./channelManagerRoutes").syncChannelManager
);
exports.getCleaningReports = secureFunction(
  require("./cleaningReportsRoutes").getCleaningReports
);
exports.getCustomersReports = secureFunction(
  require("./customersReportsRoutes").getCustomersReports
);
exports.getCustomers = secureFunction(
  require("./customersRoutes").getCustomersData
);
exports.getDashboardOverview = secureFunction(
  require("./dashboardOverviewRoutes").getDashboardOverview
);
exports.getExpenses = secureFunction(require("./expensesRoutes").getExpenses);
exports.getFinances = secureFunction(require("./financesRoutes").getFinances);
exports.importFinancialReports = secureFunction(
  require("./financialReportsRoutes").importFinancialReports
);
exports.getHousekeepingStatus = secureFunction(
  require("./housekeepingRoutes").getHousekeepingStatus
);
exports.getHousekeepingSchedule = secureFunction(
  require("./housekeepingScheduleRoutes").generateHousekeepingSchedule
);
exports.getMarketingReports = secureFunction(
  require("./marketingReportsRoutes").getMarketingReports
);
exports.getMarketingCampaigns = secureFunction(
  require("./marketingRoutes").getMarketingCampaigns
);
exports.getNotifications = secureFunction(
  require("./notificationsRoutes").getNotifications
);
exports.getUnreadNotificationsCount = secureFunction(
  require("./notificationsRoutes").getUnreadNotificationsCount
);
exports.getPricingRecommendations = secureFunction(
  require("./pricingRecommendationsRoutes").getPricingRecommendations
);
exports.getRoomPricing = secureFunction(
  require("./pricingRoutes").getRoomPricing
);
exports.updateRoomPricing = secureFunction(
  require("./pricingRoutes").updateRoomPricing
);
exports.exportReports = secureFunction(
  require("./reportsExportRoutes").exportReports
);
exports.getReports = secureFunction(require("./reportsRoutes").getReports);
exports.createReport = secureFunction(require("./reportsRoutes").createReport);
exports.getReportsStats = secureFunction(
  require("./reportsStatsRoutes").getReportsStats
);
exports.getReviews = secureFunction(require("./reviewsRoutes").getReviews);
exports.addReview = secureFunction(require("./reviewsRoutes").addReview);
exports.getPreferences = secureFunction(
  require("./settingsRoutes").getPreferences
);
exports.updatePreferences = secureFunction(
  require("./settingsRoutes").updatePreferences
);
exports.getStructureSettings = secureFunction(
  require("./settingsRoutes").getStructureSettings
);
exports.updateStructureSettings = secureFunction(
  require("./settingsRoutes").updateStructureSettings
);
exports.getSecuritySettings = secureFunction(
  require("./settingsRoutes").getSecuritySettings
);
exports.getSuppliersReports = secureFunction(
  require("./suppliersReportsRoutes").getSuppliersReports
);
exports.addSupplierReport = secureFunction(
  require("./suppliersReportsRoutes").addSupplierReport
);
exports.getSuppliers = secureFunction(
  require("./suppliersRoutes").getSuppliers
);
exports.addSupplier = secureFunction(require("./suppliersRoutes").addSupplier);
exports.chatWithAI = secureFunction(require("./aiRoutes").chatWithAI);
