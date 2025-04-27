/********************************************************************
 *  StayPro – Cloud Functions (Node 20, v1 API)                     *
 *  ✔ carica variabili da .env                                      *
 *  ✔ middleware withCors & verifyToken                             *
 *  ✔ inizializzazione base + tutte le rotte funzionanti            *
 *******************************************************************/

require("dotenv").config();

const functions = require("firebase-functions");
const admin = require("firebase-admin");
if (!admin.apps.length) admin.initializeApp();

// 🔹 Middleware
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(403).json({ error: "Token mancante" });
  }
  try {
    await admin.auth().verifyIdToken(authHeader.split(" ")[1]);
    return next();
  } catch (err) {
    console.error("verifyIdToken error:", err.message);
    return res.status(401).json({ error: "Token non valido" });
  }
};

const withCors = (handler) =>
  functions.https.onRequest(async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    );
    if (req.method === "OPTIONS") return res.status(204).send("");
    await verifyToken(req, res, () => handler(req, res));
  });

// 🔹 Imports
const bookingsRoutes = require("./bookingsRoutes");
const bookingsReportsRoutes = require("./bookingsReportsRoutes");
const channelManagerRoutes = require("./channelManagerRoutes");
const cleaningReportsRoutes = require("./cleaningReportsRoutes");
const housekeepingRoutes = require("./housekeepingRoutes");
const housekeepingScheduleRoutes = require("./housekeepingScheduleRoutes");
const customersRoutes = require("./customersRoutes");
const customersReportsRoutes = require("./customersReportsRoutes");
const suppliersRoutes = require("./suppliersRoutes");
const suppliersReportsRoutes = require("./suppliersReportsRoutes");
const dashboardOverviewRoutes = require("./dashboardOverviewRoutes");
const expensesRoutes = require("./expensesRoutes");
const marketingRoutes = require("./marketingRoutes");
const marketingReportsRoutes = require("./marketingReportsRoutes");
const notificationsRoutes = require("./notificationsRoutes");
const announcementRoutes = require("./announcementRoutes");
const pricingRoutes = require("./pricingRoutes");
const reportsRoutes = require("./reportsRoutes");
const reportsExportRoutes = require("./reportsExportRoutes");
const reportsStatsRoutes = require("./reportsStatsRoutes");
const reviewsRoutes = require("./reviewsRoutes");
const roomsRoutes = require("./roomsRoutes");
const settingsRoutes = require("./settingsRoutes");
const propertiesRoutes = require("./propertiesRoutes");
const aiRoutes = require("./aiRoutes");
const loginRoute = require("./loginRoutes");
const adminRoutes = require("./adminRoutes");
const { addDefaultRole } = require("./triggers/onUserCreated");
const guestsRoutes = require("./guestsRoutes");

// 🔹 Export delle rotte
exports.getBookings = withCors(bookingsRoutes.getBookings);
exports.getBookingById = withCors(bookingsRoutes.getBookingById);
exports.createBooking = withCors(bookingsRoutes.createBooking);
exports.updateBooking = withCors(bookingsRoutes.updateBooking);
exports.deleteBooking = withCors(bookingsRoutes.deleteBooking);
exports.getBookingsReports = withCors(bookingsReportsRoutes.getBookingsReports);
exports.syncChannelManager = withCors(channelManagerRoutes.syncChannelManager);

exports.getCleaningReports = withCors(cleaningReportsRoutes.getCleaningReports);
exports.addCleaningReport = withCors(cleaningReportsRoutes.addCleaningReport);
exports.getHousekeepingStatus = withCors(
  housekeepingRoutes.getHousekeepingStatus
);
exports.getHousekeepingSchedule = withCors(
  housekeepingScheduleRoutes.generateHousekeepingSchedule
);
exports.updateHousekeepingSchedule = withCors(
  housekeepingScheduleRoutes.updateHousekeepingSchedule
);

exports.getCustomers = withCors(customersRoutes.getCustomersData);
exports.addCustomer = withCors(customersRoutes.addCustomer);
exports.updateCustomer = withCors(customersRoutes.updateCustomer);
exports.deleteCustomer = withCors(customersRoutes.deleteCustomer);
exports.getCustomersReports = withCors(
  customersReportsRoutes.getCustomersReports
);
exports.addCustomerReport = withCors(customersReportsRoutes.addCustomerReport);

exports.getSuppliers = withCors(suppliersRoutes.getSuppliers);
exports.addSupplier = withCors(suppliersRoutes.addSupplier);
exports.updateSupplier = withCors(suppliersRoutes.updateSupplier);
exports.deleteSupplier = withCors(suppliersRoutes.deleteSupplier);
exports.getSuppliersReports = withCors(
  suppliersReportsRoutes.getSuppliersReports
);
exports.addSupplierReport = withCors(suppliersReportsRoutes.addSupplierReport);

exports.getDashboardOverview = withCors(
  dashboardOverviewRoutes.getDashboardOverview
);
exports.getExpenses = withCors(expensesRoutes.getExpenses);
exports.addExpense = withCors(expensesRoutes.addExpense);

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

exports.getPreferences = withCors(settingsRoutes.getPreferences);
exports.updatePreferences = withCors(settingsRoutes.updatePreferences);
exports.getStructureSettings = withCors(settingsRoutes.getStructureSettings);
exports.updateStructureSettings = withCors(
  settingsRoutes.updateStructureSettings
);
exports.getSecuritySettings = withCors(settingsRoutes.getSecuritySettings);

exports.getProperties = withCors(propertiesRoutes.getProperties);
exports.createProperty = withCors(propertiesRoutes.createProperty);
exports.updateProperty = withCors(propertiesRoutes.updateProperty);
exports.deleteProperty = withCors(propertiesRoutes.deleteProperty);

exports.chatWithAI = withCors(aiRoutes.chatWithAI);
exports.login = withCors(loginRoute.login);

exports.getRevenueKPI = withCors(adminRoutes.getRevenueKPI);
exports.getActiveSubscriptions = withCors(adminRoutes.getActiveSubscriptions);
exports.getChurnRate = withCors(adminRoutes.getChurnRate);
exports.getSystemStatus = withCors(adminRoutes.getSystemStatus);
exports.getUserInfo = withCors(adminRoutes.getUserInfo);
exports.getAIUsageStats = withCors(adminRoutes.getAIUsageStats);
exports.getSystemLogs = withCors(adminRoutes.getSystemLogs);
exports.getBackupStatus = withCors(adminRoutes.getBackupStatus);
exports.startBackup = withCors(adminRoutes.startBackup);

// --- Trigger identity v2 --------------------------------------------------
exports.addDefaultRole = addDefaultRole;

// Guests ----------------------------------------------------------
exports.getGuests = withCors(guestsRoutes.getGuests);
exports.addGuest = withCors(guestsRoutes.addGuest);
exports.updateGuest = withCors(guestsRoutes.updateGuest);
exports.deleteGuest = withCors(guestsRoutes.deleteGuest);
