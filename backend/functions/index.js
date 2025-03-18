const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

// ✅ Importazione di tutti i file delle route aggiornate
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

// ==================== 🚀 ESPORTAZIONE API ==================== //

// 📌 Bookings
exports.getBookings = functions.https.onRequest(bookingsRoutes.getBookings);
exports.getBookingsReports = functions.https.onRequest(
  bookingsRoutes.getBookingsReports
);

// 📌 Channel Manager
exports.syncChannelManager = functions.https.onRequest(
  channelManagerRoutes.syncChannelManager
);

// 📌 Cleaning Reports
exports.getCleaningReports = functions.https.onRequest(
  cleaningReportsRoutes.getCleaningReports
);
exports.addCleaningReport = functions.https.onRequest(
  cleaningReportsRoutes.addCleaningReport
);

// 📌 Customers
exports.getCustomers = functions.https.onRequest(
  customersRoutes.getCustomersData
);
exports.addCustomer = functions.https.onRequest(customersRoutes.addCustomer);
exports.updateCustomer = functions.https.onRequest(
  customersRoutes.updateCustomer
);
exports.deleteCustomer = functions.https.onRequest(
  customersRoutes.deleteCustomer
);

// 📌 Customers Reports
exports.getCustomersReports = functions.https.onRequest(
  customersReportsRoutes.getCustomersReports
);
exports.addCustomerReport = functions.https.onRequest(
  customersReportsRoutes.addCustomerReport
);

// 📌 Dashboard Overview
exports.getDashboardOverview = functions.https.onRequest(
  dashboardOverviewRoutes.getDashboardOverview
);

// 📌 Expenses
exports.getExpenses = functions.https.onRequest(expensesRoutes.getExpenses);
exports.addExpense = functions.https.onRequest(expensesRoutes.addExpense);

// 📌 Financial Reports
exports.importFinancialReports = functions.https.onRequest(
  financialReportsRoutes.importFinancialReports
);

// 📌 Housekeeping
exports.getHousekeepingStatus = functions.https.onRequest(
  housekeepingRoutes.getHousekeepingStatus
);

// 📌 Housekeeping Schedule
exports.getHousekeepingSchedule = functions.https.onRequest(
  housekeepingScheduleRoutes.generateHousekeepingSchedule
);
exports.updateHousekeepingSchedule = functions.https.onRequest(
  housekeepingScheduleRoutes.updateHousekeepingSchedule
);

// 📌 Marketing Reports
exports.getMarketingReports = functions.https.onRequest(
  marketingReportsRoutes.getMarketingReports
);
exports.addMarketingReport = functions.https.onRequest(
  marketingReportsRoutes.addMarketingReport
);
exports.updateMarketingReport = functions.https.onRequest(
  marketingReportsRoutes.updateMarketingReport
);
exports.deleteMarketingReport = functions.https.onRequest(
  marketingReportsRoutes.deleteMarketingReport
);

// 📌 Marketing (Campagne, Post Social)
exports.getMarketingCampaigns = functions.https.onRequest(
  marketingRoutes.getMarketingCampaigns
);
exports.addMarketingCampaign = functions.https.onRequest(
  marketingRoutes.addMarketingCampaign
);
exports.getSocialMediaPosts = functions.https.onRequest(
  marketingRoutes.getSocialMediaPosts
);
exports.createSocialPost = functions.https.onRequest(
  marketingRoutes.createSocialPost
);
exports.deleteSocialPost = functions.https.onRequest(
  marketingRoutes.deleteSocialPost
);

// 📌 Notifications
exports.getNotifications = functions.https.onRequest(
  notificationsRoutes.getNotifications
);
exports.getUnreadNotificationsCount = functions.https.onRequest(
  notificationsRoutes.getUnreadNotificationsCount
);
exports.markNotificationAsRead = functions.https.onRequest(
  notificationsRoutes.markNotificationAsRead
);
exports.markAllNotificationsAsRead = functions.https.onRequest(
  notificationsRoutes.markAllNotificationsAsRead
);

// 📌 Pricing
exports.getPricingRecommendations = functions.https.onRequest(
  aiRoutes.getPricingRecommendations
);
exports.getRoomPricing = functions.https.onRequest(
  pricingRoutes.getRoomPricing
);
exports.updateRoomPricing = functions.https.onRequest(
  pricingRoutes.updateRoomPricing
);
exports.addRoomPricing = functions.https.onRequest(
  pricingRoutes.addRoomPricing
);
exports.deleteRoomPricing = functions.https.onRequest(
  pricingRoutes.deleteRoomPricing
);

// 📌 Reports
exports.getReports = functions.https.onRequest(reportsRoutes.getReports);
exports.createReport = functions.https.onRequest(reportsRoutes.createReport);
exports.updateReport = functions.https.onRequest(reportsRoutes.updateReport);
exports.deleteReport = functions.https.onRequest(reportsRoutes.deleteReport);

// 📌 Reports Export
exports.exportReports = functions.https.onRequest(
  reportsExportRoutes.exportReports
);

// 📌 Reports Stats
exports.getReportsStats = functions.https.onRequest(
  reportsStatsRoutes.getReportsStats
);

// 📌 Reviews
exports.getReviews = functions.https.onRequest(reviewsRoutes.getReviews);
exports.addReview = functions.https.onRequest(reviewsRoutes.addReview);
exports.updateReview = functions.https.onRequest(reviewsRoutes.updateReview);
exports.deleteReview = functions.https.onRequest(reviewsRoutes.deleteReview);

// 📌 Rooms
exports.getRooms = functions.https.onRequest(roomsRoutes.getRooms);
exports.createRoom = functions.https.onRequest(roomsRoutes.createRoom);
exports.updateRoom = functions.https.onRequest(roomsRoutes.updateRoom);
exports.deleteRoom = functions.https.onRequest(roomsRoutes.deleteRoom);

// 📌 Settings
exports.getPreferences = functions.https.onRequest(
  settingsRoutes.preferencesSettings
);
exports.updatePreferences = functions.https.onRequest(
  settingsRoutes.preferencesSettings
);
exports.getStructureSettings = functions.https.onRequest(
  settingsRoutes.structureSettings
);
exports.updateStructureSettings = functions.https.onRequest(
  settingsRoutes.structureSettings
);
exports.getSecuritySettings = functions.https.onRequest(
  settingsRoutes.securitySettings
);

// 📌 Suppliers
exports.getSuppliers = functions.https.onRequest(suppliersRoutes.getSuppliers);
exports.addSupplier = functions.https.onRequest(suppliersRoutes.addSupplier);
exports.updateSupplier = functions.https.onRequest(
  suppliersRoutes.updateSupplier
);
exports.deleteSupplier = functions.https.onRequest(
  suppliersRoutes.deleteSupplier
);

// 📌 Suppliers Reports
exports.getSuppliersReports = functions.https.onRequest(
  suppliersReportsRoutes.getSuppliersReports
);
exports.addSupplierReport = functions.https.onRequest(
  suppliersReportsRoutes.addSupplierReport
);

// 📌 AI Chat (hub e chat dell'AI)
exports.chatWithAI = functions.https.onRequest(aiRoutes.chatWithAI);
