const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

exports.getBookingsData = require("./bookingsRoutes").getBookingsData;

exports.getBookingsReports =
  require("./bookingsReportsRoutes").getBookingsReports;
exports.syncChannelManager =
  require("./channelManagerRoutes").syncChannelManager;
exports.getCleaningReports =
  require("./cleaningReportsRoutes").getCleaningReports;
exports.getCustomersReports =
  require("./customersReportsRoutes").getCustomersReports;
exports.getCustomers = require("./customersRoutes").getCustomers;
exports.getDashboardOverview =
  require("./dashboardOverviewRoutes").getDashboardOverview;
exports.getExpenses = require("./expensesRoutes").getExpenses;
exports.getFinances = require("./financesRoutes").getFinances;
exports.importFinancialReports =
  require("./financialReportsRoutes").importFinancialReports;
exports.getHousekeepingStatus =
  require("./housekeepingRoutes").getHousekeepingStatus;
exports.getHousekeepingSchedule =
  require("./housekeepingScheduleRoutes").generateHousekeepingSchedule;
exports.getMarketingReports =
  require("./marketingReportsRoutes").getMarketingReports;
exports.getMarketingCampaigns =
  require("./marketingRoutes").getMarketingCampaigns;
exports.getNotifications = require("./notificationsRoutes").getNotifications;
exports.getUnreadNotificationsCount =
  require("./notificationsRoutes").getUnreadNotificationsCount;
exports.getPricingRecommendations =
  require("./pricingRecommendationsRoutes").getPricingRecommendations;
exports.getRoomPricing = require("./pricingRoutes").getRoomPricing;
exports.updateRoomPricing = require("./pricingRoutes").updateRoomPricing;
exports.exportReports = require("./reportsExportRoutes").exportReports;
exports.getReports = require("./reportsRoutes").getReports;
exports.createReport = require("./reportsRoutes").createReport;
exports.getReportsStats = require("./reportsStatsRoutes").getReportsStats;
exports.getReviews = require("./reviewsRoutes").getReviews;
exports.addReview = require("./reviewsRoutes").addReview;
exports.getPreferences = require("./settingsRoutes").getPreferences;
exports.updatePreferences = require("./settingsRoutes").updatePreferences;
exports.getStructureSettings = require("./settingsRoutes").getStructureSettings;
exports.updateStructureSettings =
  require("./settingsRoutes").updateStructureSettings;
exports.getSecuritySettings = require("./settingsRoutes").getSecuritySettings;
exports.getSuppliersReports =
  require("./suppliersReportsRoutes").getSuppliersReports;
exports.addSupplierReport =
  require("./suppliersReportsRoutes").addSupplierReport;
exports.getSuppliers = require("./suppliersRoutes").getSuppliers;
exports.addSupplier = require("./suppliersRoutes").addSupplier;
exports.chatWithAI = require("./aiRoutes").chatWithAI;
