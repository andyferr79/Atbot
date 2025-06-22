import axios from "axios";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const API_BASE_URL =
  process.env.REACT_APP_FUNCTIONS_URL || "https://api-yux5b3ux4q-ew.a.run.app";
console.log("🔗 API Base URL:", API_BASE_URL);
const api = axios.create({ baseURL: API_BASE_URL });

let tokenPromise = null;

const waitForValidToken = () => {
  if (tokenPromise) return tokenPromise;

  const auth = getAuth();
  tokenPromise = new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const idToken = await user.getIdToken(true);
        localStorage.setItem("firebaseToken", idToken);
        resolve(idToken);
      } else {
        resolve(null);
      }
      unsub();
    });
  });

  return tokenPromise;
};

api.interceptors.request.use(
  async (config) => {
    let token = localStorage.getItem("firebaseToken");
    if (!token) token = await waitForValidToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { response, config } = error;

    if (response) {
      const msg = `❌ API ERROR ${
        response.status
      } on ${config.method?.toUpperCase()} ${config.url}`;
      console.error(msg);
    } else if (error.request) {
      console.error(`❌ API ERROR – Nessuna risposta da ${config.url}`);
    } else {
      console.error(`❌ API ERROR – Problema richiesta:`, error.message);
    }

    return Promise.reject(error);
  }
);

/* ------- Test / Utilities ----------------------------------- */
export const getTestFirebase = () => api.get("/api/test");

/* ------- Chat IA ------------------------------------------- */
export const sendMessageToAI = (message, sessionId) =>
  api.post("/api/chat", { user_message: message, session_id: sessionId });

/* ------- Suppliers ------------------------------------------ */
export const getSuppliers = () => api.get("/api/suppliers");
export const addSupplier = (data) => api.post("/api/suppliers", data);
export const updateSupplier = (id, data) =>
  api.put(`/api/suppliers/${id}`, data);
export const deleteSupplier = (id) => api.delete(`/api/suppliers/${id}`);

// 🔐 Privacy & GDPR
export const getConsents = (uid) => api.get(`/privacy/consents?uid=${uid}`);
export const saveConsents = (uid, consents) =>
  api.post(`/privacy/consents`, { uid, consents });
export const getGDPRRequests = (uid) => api.get(`/privacy/requests?uid=${uid}`);
export const createGDPRRequest = (data) => api.post(`/privacy/requests`, data);

/* ------- Guests -------------------------------------------- */
export const getGuests = () => api.get("/api/guests");
export const addGuest = (data) => api.post("/api/guests", data);
export const updateGuest = (id, data) => api.put(`/api/guests/${id}`, data);
export const deleteGuest = (id) => api.delete(`/api/guests/${id}`);

/* ------- Rooms --------------------------------------------- */
export const getRooms = () => api.get("/api/rooms");
export const addRoom = (data) => api.post("/api/rooms", data);
export const updateRoom = (id, data) => api.put(`/api/rooms/${id}`, data);
export const deleteRoom = (id) => api.delete(`/api/rooms/${id}`);

/* ------- Settings ------------------------------------------ */
export const getPreferencesSettings = () =>
  api.get("/api/settings/preferences");
export const updatePreferencesSettings = (data) =>
  api.put("/api/settings/preferences", data);

// 📦 Configurazione della Struttura
export const getStructureSettings = async (uid) => {
  const res = await api.get(`/structure/settings?uid=${uid}`);
  return res.data;
};

export const saveStructureSettings = async (uid, settings) => {
  const res = await api.post("/structure/settings", { uid, ...settings });
  return res.data;
};

export const getSecuritySettings = () => api.get("/api/settings/security");
export const updateSecuritySettings = (data) =>
  api.put("/api/settings/security", data);

// 🔌 Integrazioni
export const getIntegrations = async (uid) => {
  const res = await api.get(`/integrations?uid=${uid}`);
  return res.data;
};
export const addIntegration = async (integration) => {
  const res = await api.post("/integrations", integration);
  return res.data;
};
export const removeIntegration = async (id, uid) => {
  const res = await api.delete(`/integrations/${id}?uid=${uid}`);
  return res.data;
};

/* ------- Reviews ------------------------------------------- */
export const getReviews = () => api.get("/api/reviews");
export const addReview = (data) => api.post("/api/reviews", data);
export const updateReview = (data) => api.put("/api/reviews", data);
export const deleteReview = (id) => api.delete(`/api/reviews?reviewId=${id}`);

/* ------- Suppliers Reports --------------------------------- */
export const getSuppliersReports = () => api.get("/api/suppliers-reports");
export const addSupplierReport = (data) =>
  api.post("/api/suppliers-reports", data);
export const updateSuppliersReport = (data) =>
  api.put("/api/suppliers-reports", data);
export const deleteSuppliersReport = (id) =>
  api.delete(`/api/suppliers-reports?reportId=${id}`);

/* ------- SEO Strategy -------------------------------------- */
export const runSEOStrategy = (data) => api.post("/api/ai/seo-strategy", data);

/* ------- Scheduler Manuale -------------------------------- */
export const runDailyScheduler = () => api.post("/api/ai/run-scheduler");

/* ------- Dashboard ----------------------------------------- */
export const getDashboardOverview = () => api.get("/api/dashboard");

/* ------- Admin Logs ---------------------------------------- */
export const getSystemAlerts = () => api.get("/api/admin/system-alerts");
export const getUserInfo = () => api.get("/api/getUserInfo");
export const getAdminAIUsage = () => api.get("/api/admin/ai-usage");
export const getGPTSpendingToday = () =>
  api.get("/api/admin/ia/spending-today");

/* ------- Admin: Annunci ------------------------------------ */
export const getAdminAnnouncements = () => api.get("/api/admin/announcements");
export const createAdminAnnouncement = (data) =>
  api.post("/api/admin/announcements", data);
export const getAdminAutomations = () => api.get("/api/admin/automations");
export const getAdminBenchmarkStats = () =>
  api.get("/api/admin/benchmark-stats");

/* ------- Admin: KPI ---------------------------------------- */
export const getKPIRevenue = () => api.get("/api/admin/kpi/revenue");
export const getKPIActiveUsers = () => api.get("/api/admin/kpi/active-users");
export const getKPIChurnRate = () => api.get("/api/admin/kpi/churn-rate");
export const getKPISystemStatus = () => api.get("/api/admin/kpi/system-status");

/* ------- Admin: Logs & Backup ------------------------------ */
export const getSystemLogs = () => api.get("/api/admin/system-logs");
export const getBackupStatus = () => api.get("/api/admin/backup-status");
export const startManualBackup = () => api.post("/api/admin/start-backup");

/* ------- Admin: Reports ------------------------------------ */
export const downloadAdminReport = () =>
  api.get("/api/admin/reports/export", { responseType: "blob" });
export const sendLatestReport = () =>
  api.post("/api/admin/reports/send-latest");
export const getReportHistory = () => api.get("/api/admin/reports/history");

/* ------- Admin: Cronologia utenti -------------------------- */
export const getAllAdminUsers = () => api.get("/api/admin/users");
export const getUserTimeline = (userId) =>
  api.get(`/api/admin/user-timeline?userId=${userId}`);

// 🔔 Notifiche
export const getNotifications = (uid) => api.get(`/notifications?uid=${uid}`);
export const saveNotifications = (data) => api.post(`/notifications`, data);

// 📦 Abbonamento
export const getSubscription = () => api.get("/api/user/subscription");
export const updateSubscription = (data) =>
  api.put("/api/user/subscription", data);

export const getInvoices = () => api.get("/api/user/invoices");

export const getAccountant = () => api.get("/api/user/accountant");
export const updateAccountant = (data) => api.put("/api/user/accountant", data);

export default api;
