/********************************************************************
 *  StayPro / Hoxyia – Cloud Functions (Node 20, API v1)            *
 *  ✔ Variabili da .env                                             *
 *  ✔ Middleware withCors & verifyToken                             *
 *  ✔ Inizializzazione Admin + Tutte le rotte                       *
 ********************************************************************/

require("dotenv").config();
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Sentry = require("@sentry/google-cloud-serverless");
const { v4: uuidv4 } = require("uuid");

Sentry.init({
  dsn: "https://ed67712db0b24f8430a94545ea545cdd@o4509237214314496.ingest.de.sentry.io/4509237230239824",
  sendDefaultPii: true,
});

if (!admin.apps.length) {
  admin.initializeApp();
}

// 🔐 Middleware
const cors = require("cors")({ origin: true });

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(403).json({ error: "Token mancante" });
  }
  try {
    await admin.auth().verifyIdToken(authHeader.split(" ")[1]);
    return next();
  } catch (error) {
    console.error("verifyIdToken error:", error.message);
    return res.status(401).json({ error: "Token non valido" });
  }
};

const withCors = (handler) =>
  functions.https.onRequest(async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    );
    res.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Request-ID"
    );

    if (req.method === "OPTIONS") {
      return res.status(204).send("");
    }

    const requestId = uuidv4();
    req.requestId = requestId;
    res.setHeader("X-Request-ID", requestId);

    console.log(
      `➡️ [Request ID]: ${requestId} | ${req.method} ${req.originalUrl}`
    );

    await verifyToken(req, res, () => handler(req, res));
  });

// 📦 Importa tutte le rotte
const bookingsRoutes = require("./bookingsRoutes");
const bookingsReportsRoutes = require("./bookingsReportsRoutes");
const roomsRoutes = require("./roomsRoutes");
const customersRoutes = require("./customersRoutes");
const customersReportsRoutes = require("./customersReportsRoutes");
const suppliersRoutes = require("./suppliersRoutes");
const suppliersReportsRoutes = require("./suppliersReportsRoutes");
const reportsRoutes = require("./reportsRoutes");
const reportsExportRoutes = require("./reportsExportRoutes");
const reportsStatsRoutes = require("./reportsStatsRoutes");
const notificationsRoutes = require("./notificationsRoutes");
const settingsRoutes = require("./settingsRoutes");
const marketingRoutes = require("./marketingRoutes");
const marketingReportsRoutes = require("./marketingReportsRoutes");
const expensesRoutes = require("./expensesRoutes");
const housekeepingRoutes = require("./housekeepingRoutes");
const housekeepingScheduleRoutes = require("./housekeepingScheduleRoutes");
const dashboardOverviewRoutes = require("./dashboardOverviewRoutes");
const financialReportsRoutes = require("./financialReportsRoutes");
const reviewsRoutes = require("./reviewsRoutes");
const pricingRoutes = require("./pricingRoutes");
const aiRoutes = require("./aiRoutes");
const propertiesRoutes = require("./propertiesRoutes");
const channelManagerRoutes = require("./channelManagerRoutes");
const announcementRoutes = require("./announcementRoutes");
const adminRoutes = require("./adminRoutes");
const loginRoutes = require("./loginRoutes");
const agentRoutes = require("./agentRoutes");
const backupRoutes = require("./backupRoutes");
const automationTasksRoutes = require("./automationTasksRoutes");
const { sendAutoReminders } = require("./aiReminders");
const { runSchedulerNowHandler } = require("./scheduledDailyTask");
const { getAgentSummaryHandler } = require("./agentSummary");

// Trigger identity v2
const { addDefaultRole } = require("./triggers/onUserCreated");
const { dailyAgentTrigger } = require("./triggers/triggerWatcher");
// 📢 Exports delle Cloud Functions

// 📚 Prenotazioni
exports.getBookings = withCors(bookingsRoutes.getBookings);
exports.getBookingById = withCors(bookingsRoutes.getBookingById);
exports.createBooking = withCors(bookingsRoutes.createBooking);
exports.updateBooking = withCors(bookingsRoutes.updateBooking);
exports.deleteBooking = withCors(bookingsRoutes.deleteBooking);
exports.getBookingsReports = withCors(bookingsReportsRoutes.getBookingsReports);

// 🏨 Camere
exports.getRooms = withCors(roomsRoutes.getRooms);
exports.createRoom = withCors(roomsRoutes.createRoom);
exports.updateRoom = withCors(roomsRoutes.updateRoom);
exports.deleteRoom = withCors(roomsRoutes.deleteRoom);

// 👤 Clienti
exports.getCustomers = withCors(customersRoutes.getCustomers);
exports.addCustomer = withCors(customersRoutes.addCustomer);
exports.updateCustomer = withCors(customersRoutes.updateCustomer);
exports.deleteCustomer = withCors(customersRoutes.deleteCustomer);
exports.getCustomersReports = withCors(
  customersReportsRoutes.getCustomersReports
);
exports.addCustomerReport = withCors(customersReportsRoutes.addCustomerReport);

// 🔗 Fornitori
exports.getSuppliers = withCors(suppliersRoutes.getSuppliers);
exports.addSupplier = withCors(suppliersRoutes.addSupplier);
exports.updateSupplier = withCors(suppliersRoutes.updateSupplier);
exports.deleteSupplier = withCors(suppliersRoutes.deleteSupplier);
exports.getSuppliersReports = withCors(
  suppliersReportsRoutes.getSuppliersReports
);
exports.addSupplierReport = withCors(suppliersReportsRoutes.addSupplierReport);

// 📑 Report
exports.getReports = withCors(reportsRoutes.getReports);
exports.createReport = withCors(reportsRoutes.createReport);
exports.updateReport = withCors(reportsRoutes.updateReport);
exports.deleteReport = withCors(reportsRoutes.deleteReport);
exports.exportReports = withCors(reportsExportRoutes.exportReports);
exports.getReportsStats = withCors(reportsStatsRoutes.getReportsStats);

// 🔔 Notifiche
exports.getNotifications = withCors(
  notificationsRoutes.getNotificationsHandler
);
exports.createNotification = withCors(
  notificationsRoutes.createNotificationHandler
);
exports.markNotificationAsRead = withCors(
  notificationsRoutes.markNotificationAsReadHandler
);
exports.markAllNotificationsAsRead = withCors(
  notificationsRoutes.markAllNotificationsAsReadHandler
);
exports.deleteNotification = withCors(
  notificationsRoutes.deleteNotificationHandler
);
exports.getUnreadNotificationsCount = withCors(
  notificationsRoutes.getUnreadNotificationsCountHandler
);
exports.sendAutoReminders = functions.https.onRequest(async (req, res) => {
  try {
    await sendAutoReminders();
    res.status(200).send("✅ Reminder IA completati");
  } catch (error) {
    console.error("❌ Errore reminder IA:", error);
    res.status(500).send("Errore reminder IA");
  }
});
// ⚙️ Impostazioni
exports.getPreferences = withCors(settingsRoutes.getPreferences);
exports.updatePreferences = withCors(settingsRoutes.updatePreferences);
exports.getStructureSettings = withCors(settingsRoutes.getStructureSettings);
exports.updateStructureSettings = withCors(
  settingsRoutes.updateStructureSettings
);
exports.getSecuritySettings = withCors(settingsRoutes.getSecuritySettings);

// 📈 Marketing
exports.getMarketingReports = withCors(
  marketingReportsRoutes.getMarketingReports
);
exports.getMarketingCampaigns = withCors(marketingRoutes.getMarketingCampaigns);
exports.addMarketingCampaign = withCors(marketingRoutes.addMarketingCampaign);
exports.getSocialMediaPosts = withCors(marketingRoutes.getSocialMediaPosts);
exports.createSocialPost = withCors(marketingRoutes.createSocialPost);
exports.deleteSocialPost = withCors(marketingRoutes.deleteSocialPost);
exports.seoStrategy = withCors(marketingRoutes.seoStrategyHandler);
exports.analyzeMarketingPresence = withCors(
  agentRoutes.analyzeMarketingPresence
);
exports.generateEmailCampaign = withCors(marketingRoutes.generateEmailCampaign);

// 💵 Spese
exports.getExpenses = withCors(expensesRoutes.getExpenses);
exports.addExpense = withCors(expensesRoutes.addExpense);

// 🧹 Housekeeping
exports.getHousekeepingStatus = withCors(
  housekeepingRoutes.getHousekeepingStatus
);
exports.getHousekeepingSchedule = withCors(
  housekeepingScheduleRoutes.generateHousekeepingSchedule
);
exports.updateHousekeepingSchedule = withCors(
  housekeepingScheduleRoutes.updateHousekeepingSchedule
);

// 📊 Dashboard
exports.getDashboardOverview = withCors(
  dashboardOverviewRoutes.getDashboardOverview
);

// 📈 Finanziari
exports.importFinancialReports = withCors(
  financialReportsRoutes.importFinancialReports
);

// 🌟 Recensioni
exports.getReviews = withCors(reviewsRoutes.getReviews);
exports.addReview = withCors(reviewsRoutes.addReview);
exports.updateReview = withCors(reviewsRoutes.updateReview);
exports.deleteReview = withCors(reviewsRoutes.deleteReview);

// 🏷️ Prezzi
exports.getRoomPricing = withCors(pricingRoutes.getRoomPricing);
exports.addRoomPricing = withCors(pricingRoutes.addRoomPricing);
exports.updateRoomPricing = withCors(pricingRoutes.updateRoomPricing);
exports.deleteRoomPricing = withCors(pricingRoutes.deleteRoomPricing);
exports.getPricingRecommendations = withCors(
  aiRoutes.getPricingRecommendations
);

// 🤖 AI Chat
exports.chatWithAI = withCors(aiRoutes.chatWithAI);
exports.sendAgentFeedback = withCors(agentRoutes.sendAgentFeedback);
exports.sendWelcomeCheckin = withCors(agentRoutes.sendWelcomeCheckin);

// 🏡 Properties
exports.getProperties = withCors(propertiesRoutes.getProperties);
exports.createProperty = withCors(propertiesRoutes.createProperty);
exports.updateProperty = withCors(propertiesRoutes.updateProperty);
exports.deleteProperty = withCors(propertiesRoutes.deleteProperty);

// 🔄 Channel Manager
exports.syncChannelManager = withCors(channelManagerRoutes.syncChannelManager);
exports.mapRooms = withCors(channelManagerRoutes.mapRooms);
exports.pushRates = withCors(channelManagerRoutes.pushRates);
exports.pullBookings = withCors(channelManagerRoutes.pullBookings);

// 📢 Annunci ufficiali
exports.getOfficialAnnouncements = withCors(
  announcementRoutes.getOfficialAnnouncements
);
exports.createOfficialAnnouncement = withCors(
  announcementRoutes.createOfficialAnnouncement
);
exports.markAnnouncementAsRead = withCors(
  announcementRoutes.markAnnouncementAsRead
);
exports.archiveAnnouncement = withCors(announcementRoutes.archiveAnnouncement);
exports.deleteAnnouncement = withCors(announcementRoutes.deleteAnnouncement);
exports.suggestUpsell = withCors(agentRoutes.suggestUpsell);
exports.generateUpsellPdfMock = withCors(agentRoutes.generateUpsellPdfMock);
exports.getUnreadNotificationsByType = withCors(
  notificationsRoutes.getUnreadNotificationsByTypeHandler
);

// 🛠️ Admin KPI / Sistema
exports.getRevenueKPI = withCors(adminRoutes.getRevenueKPI);
exports.getActiveSubscriptions = withCors(adminRoutes.getActiveSubscriptions);
exports.getChurnRate = withCors(adminRoutes.getChurnRate);
exports.getSystemStatus = withCors(adminRoutes.getSystemStatus);
exports.getUserInfo = withCors(adminRoutes.getUserInfo);
exports.getAIUsageStats = withCors(adminRoutes.getAIUsageStats);
exports.getSystemLogs = withCors(adminRoutes.getSystemLogs);
exports.getBackupStatus = withCors(adminRoutes.getBackupStatus);
exports.startBackup = withCors(adminRoutes.startBackup);

// 🔐 Backup & Sicurezza
exports.restoreBackup = withCors(backupRoutes.restoreBackup);
exports.updatePassword = withCors(backupRoutes.updatePassword);

// 🔐 Login
exports.login = withCors(loginRoutes.login);

// 🧠 Agent IA – Funzioni principali
exports.dispatchAgentAction = withCors(agentRoutes.dispatchAgentAction);
exports.getAgentActions = withCors(agentRoutes.getAgentActions);
exports.updateAgentAction = withCors(agentRoutes.updateAgentAction);
exports.deleteAgentAction = withCors(agentRoutes.deleteAgentAction);
exports.getAgentSummary = withCors(getAgentSummaryHandler);

// 📄 Documenti IA
exports.uploadAgentReport = withCors(agentRoutes.uploadAgentReport);
exports.getAgentDocuments = withCors(agentRoutes.getAgentDocuments);
exports.generateCheckinPdfMock = withCors(agentRoutes.generateCheckinPdfMock);

// 🧭 Configurazione HUB
exports.getAgentHubStatus = withCors(agentRoutes.getAgentHubStatus);
exports.getAgentConfig = withCors(agentRoutes.getAgentConfig);
exports.saveAgentConfig = withCors(agentRoutes.saveAgentConfig);

// 🧪 Test Sentry
exports.testError = Sentry.wrapHttpFunction((req, res) => {
  throw new Error("🔥 TEST SENTRY: crash volontario StayPro!");
});

// ✅ Trigger
exports.addDefaultRole = addDefaultRole;
exports.dailyAgentTrigger = dailyAgentTrigger;

// 🔁 Automazioni IA
exports.createAutomationTask = withCors(
  automationTasksRoutes.createAutomationTask
);
exports.getAutomationTasks = withCors(automationTasksRoutes.getAutomationTasks);
exports.getAutomationTaskById = withCors(
  automationTasksRoutes.getAutomationTaskById
);
exports.updateAutomationTask = withCors(
  automationTasksRoutes.updateAutomationTask
);
exports.deleteAutomationTask = withCors(
  automationTasksRoutes.deleteAutomationTask
);

exports.eventMatcher = withCors(agentRoutes.eventMatcher);

// 🕐 Scheduler IA giornaliero
exports.runSchedulerNow = withCors(runSchedulerNowHandler);
