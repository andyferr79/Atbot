// 🔥 Hardcoded API key (bypass .env)
const FIREBASE_API_KEY = "AIzaSyDtcXEcXxQJqHzQB5Hjat82grMrOMQiwAM";

// ❌ Disattiviamo dotenv per evitare conflitti
// require("dotenv").config();

const functions = require("firebase-functions");
const admin = require("firebase-admin");

// 🔐 Inizializza Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const cors = require("cors")({ origin: true });

// ✅ Middleware CORS completo con gestione OPTIONS
function withCors(fn) {
  return functions.https.onRequest((req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    );

    if (req.method === "OPTIONS") {
      return res.status(204).send("");
    }

    cors(req, res, () => {
      fn(req, res);
    });
  });
}

// ✅ Importa tutte le route
const bookingsRoutes = require("./bookingsRoutes");
const bookingsReportsRoutes = require("./bookingsReportsRoutes");
const channelManagerRoutes = require("./channelManagerRoutes");
const cleaningReportsRoutes = require("./cleaningReportsRoutes");
const customersRoutes = require("./customersRoutes");
const customersReportsRoutes = require("./customersReportsRoutes");
const dashboardOverviewRoutes = require("./dashboardOverviewRoutes");
const expensesRoutes = require("./expensesRoutes");
const financialReportsRoutes = require("./financialReportsRoutes");
const housekeepingRoutes = require("./housekeepingRoutes");
const housekeepingScheduleRoutes = require("./housekeepingScheduleRoutes");
const marketingReportsRoutes = require("./marketingReportsRoutes");
const marketingRoutes = require("./marketingRoutes");
const notificationsRoutes = require("./notificationsRoutes");
const pricingRecommendationsRoutes = require("./pricingRecommendationsRoutes");
const pricingRoutes = require("./pricingRoutes");
const reportsExportRoutes = require("./reportsExportRoutes");
const reportsRoutes = require("./reportsRoutes");
const reportsStatsRoutes = require("./reportsStatsRoutes");
const reviewsRoutes = require("./reviewsRoutes");
const roomsRoutes = require("./roomsRoutes");
const settingsRoutes = require("./settingsRoutes");
const suppliersReportsRoutes = require("./suppliersReportsRoutes");
const suppliersRoutes = require("./suppliersRoutes");
const aiRoutes = require("./aiRoutes");
const propertiesRoutes = require("./propertiesRoutes");

// 🔐 Login modificato con chiave fissa
const loginRoute = require("./loginRoutes");
loginRoute.setApiKey(FIREBASE_API_KEY);

// ✅ Moduli aggiuntivi
const announcementRoutes = require("./announcementRoutes");
const adminRoutes = require("./adminRoutes");

// ✅ Booking - già strutturate
exports.getBookings = bookingsRoutes.getBookings;
exports.getBookingById = bookingsRoutes.getBookingById;
exports.createBooking = bookingsRoutes.createBooking;
exports.updateBooking = bookingsRoutes.updateBooking;
exports.deleteBooking = bookingsRoutes.deleteBooking;

// ✅ Altro
exports.getBookingsReports = withCors(bookingsReportsRoutes.getBookingsReports);
exports.syncChannelManager = withCors(channelManagerRoutes.syncChannelManager);
exports.getCleaningReports = withCors(cleaningReportsRoutes.getCleaningReports);
exports.addCleaningReport = withCors(cleaningReportsRoutes.addCleaningReport);
exports.getCustomers = withCors(customersRoutes.getCustomersData);
exports.addCustomer = withCors(customersRoutes.addCustomer);
exports.updateCustomer = withCors(customersRoutes.updateCustomer);
exports.deleteCustomer = withCors(customersRoutes.deleteCustomer);
exports.getCustomersReports = withCors(
  customersReportsRoutes.getCustomersReports
);
exports.addCustomerReport = withCors(customersReportsRoutes.addCustomerReport);
exports.getDashboardOverview = withCors(
  dashboardOverviewRoutes.getDashboardOverview
);
exports.getExpenses = withCors(expensesRoutes.getExpenses);
exports.addExpense = withCors(expensesRoutes.addExpense);
exports.importFinancialReports = withCors(
  financialReportsRoutes.importFinancialReports
);
exports.getHousekeepingStatus = withCors(
  housekeepingRoutes.getHousekeepingStatus
);
exports.getHousekeepingSchedule = withCors(
  housekeepingScheduleRoutes.generateHousekeepingSchedule
);
exports.updateHousekeepingSchedule = withCors(
  housekeepingScheduleRoutes.updateHousekeepingSchedule
);
exports.getMarketingReports = withCors(
  marketingReportsRoutes.getMarketingReports
);
exports.addMarketingReport = withCors(
  marketingReportsRoutes.addMarketingReport
);
exports.updateMarketingReport = withCors(
  marketingReportsRoutes.updateMarketingReport
);
exports.deleteMarketingReport = withCors(
  marketingReportsRoutes.deleteMarketingReport
);
exports.getMarketingCampaigns = withCors(marketingRoutes.getMarketingCampaigns);
exports.addMarketingCampaign = withCors(marketingRoutes.addMarketingCampaign);
exports.getSocialMediaPosts = withCors(marketingRoutes.getSocialMediaPosts);
exports.createSocialPost = withCors(marketingRoutes.createSocialPost);
exports.deleteSocialPost = withCors(marketingRoutes.deleteSocialPost);
exports.getNotifications = withCors(notificationsRoutes.getNotifications);
exports.getUnreadNotificationsCount = withCors(
  notificationsRoutes.getUnreadNotificationsCount
);
exports.markNotificationAsRead = withCors(
  notificationsRoutes.markNotificationAsRead
);
exports.markAllNotificationsAsRead = withCors(
  notificationsRoutes.markAllNotificationsAsRead
);
exports.getPricingRecommendations = withCors(
  aiRoutes.getPricingRecommendations
);
exports.getRoomPricing = withCors(pricingRoutes.getRoomPricing);
exports.updateRoomPricing = withCors(pricingRoutes.updateRoomPricing);
exports.addRoomPricing = withCors(pricingRoutes.addRoomPricing);
exports.deleteRoomPricing = withCors(pricingRoutes.deleteRoomPricing);
exports.getReports = withCors(reportsRoutes.getReports);
exports.createReport = withCors(reportsRoutes.createReport);
exports.updateReport = withCors(reportsRoutes.updateReport);
exports.deleteReport = withCors(reportsRoutes.deleteReport);
exports.exportReports = withCors(reportsExportRoutes.exportReports);
exports.getReportsStats = withCors(reportsStatsRoutes.getReportsStats);
exports.getReviews = withCors(reviewsRoutes.getReviews);
exports.addReview = withCors(reviewsRoutes.addReview);
exports.updateReview = withCors(reviewsRoutes.updateReview);
exports.deleteReview = withCors(reviewsRoutes.deleteReview);
exports.getRooms = withCors(roomsRoutes.getRooms);
exports.createRoom = withCors(roomsRoutes.createRoom);
exports.updateRoom = withCors(roomsRoutes.updateRoom);
exports.deleteRoom = withCors(roomsRoutes.deleteRoom);
exports.getPreferences = withCors(settingsRoutes.preferencesSettings);
exports.updatePreferences = withCors(settingsRoutes.preferencesSettings);
exports.getStructureSettings = withCors(settingsRoutes.structureSettings);
exports.updateStructureSettings = withCors(settingsRoutes.structureSettings);
exports.getSecuritySettings = withCors(settingsRoutes.getSecuritySettings);
exports.getSuppliers = withCors(suppliersRoutes.getSuppliers);
exports.addSupplier = withCors(suppliersRoutes.addSupplier);
exports.updateSupplier = withCors(suppliersRoutes.updateSupplier);
exports.deleteSupplier = withCors(suppliersRoutes.deleteSupplier);
exports.getSuppliersReports = withCors(
  suppliersReportsRoutes.getSuppliersReports
);
exports.addSupplierReport = withCors(suppliersReportsRoutes.addSupplierReport);
exports.chatWithAI = withCors(aiRoutes.chatWithAI);
exports.login = withCors(loginRoute.login);

// ✅ Annunci ufficiali
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

// ✅ Admin KPI / Sistema
exports.getRevenueKPI = withCors(adminRoutes.getRevenueKPI);
exports.getActiveSubscriptions = withCors(adminRoutes.getActiveSubscriptions);
exports.getChurnRate = withCors(adminRoutes.getChurnRate);
exports.getSystemStatus = withCors(adminRoutes.getSystemStatus);
exports.getUserInfo = withCors(adminRoutes.getUserInfo);
exports.getAIUsageStats = withCors(adminRoutes.getAIUsageStats);
exports.getSystemLogs = withCors(adminRoutes.getSystemLogs);
exports.getBackupStatus = withCors(adminRoutes.getBackupStatus);
exports.startBackup = withCors(adminRoutes.startBackup);

// ✅ PROPERTIES (Alloggi)
exports.getProperties = withCors(propertiesRoutes.getProperties);
exports.createProperty = withCors(propertiesRoutes.createProperty);
exports.updateProperty = withCors(propertiesRoutes.updateProperty);
exports.deleteProperty = withCors(propertiesRoutes.deleteProperty);
