import axios from "axios";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const API_BASE_URL =
  import.meta.env.VITE_FUNCTIONS_URL ||
  "http://127.0.0.1:5001/autotaskerbot/us-central1";

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

    if (response?.status === 401 && !config.__isRetry) {
      config.__isRetry = true;
      localStorage.removeItem("firebaseToken");
      tokenPromise = null;

      const freshToken = await waitForValidToken();
      if (freshToken) {
        config.headers.Authorization = `Bearer ${freshToken}`;
        return api(config);
      }
    }
    return Promise.reject(error);
  }
);

/* ─────────────────────────────────────────────────────────────
   FUNZIONI REST – Rotte aggiornate su Express v2                */

/* ------- Test / Utilities ----------------------------------- */
export const getTestFirebase = () => api.get("/test");

/* ------- Chat IA ------------------------------------------- */
export const sendMessageToAI = (message, sessionId) =>
  api.post("/chat", { user_message: message, session_id: sessionId });

/* ------- Suppliers ------------------------------------------ */
export const getSuppliers = () => api.get("/suppliers");
export const addSupplier = (data) => api.post("/suppliers", data);
export const updateSupplier = (id, data) => api.put(`/suppliers/${id}`, data);
export const deleteSupplier = (id) => api.delete(`/suppliers/${id}`);

/* ------- Guests -------------------------------------------- */
export const getGuests = () => api.get("/guests");
export const addGuest = (data) => api.post("/guests", data);
export const updateGuest = (id, data) => api.put(`/guests/${id}`, data);
export const deleteGuest = (id) => api.delete(`/guests/${id}`);

/* ------- Rooms --------------------------------------------- */
export const getRooms = () => api.get("/rooms");
export const addRoom = (data) => api.post("/rooms", data);
export const updateRoom = (id, data) => api.put(`/rooms/${id}`, data);
export const deleteRoom = (id) => api.delete(`/rooms/${id}`);

/* ------- Bookings ------------------------------------------ */
export const getBookings = () => api.get("/bookings");
export const addBooking = (data) => api.post("/bookings", data);
export const updateBooking = (id, data) => api.put(`/bookings/${id}`, data);
export const deleteBooking = (id) => api.delete(`/bookings/${id}`);

/* ------- Stripe -------------------------------------------- */
export const createStripeLink = (data) => api.post("/stripe/create-link", data);

/* ------- Settings ------------------------------------------ */
export const getPreferencesSettings = () => api.get("/settings/preferences");
export const updatePreferencesSettings = (data) =>
  api.put("/settings/preferences", data);
export const getStructureSettings = () => api.get("/settings/structure");
export const updateStructureSettings = (data) =>
  api.put("/settings/structure", data);
export const getSecuritySettings = () => api.get("/settings/security");
export const updateSecuritySettings = (data) =>
  api.put("/settings/security", data);

/* ------- Reviews ------------------------------------------- */
export const getReviews = () => api.get("/reviews");
export const addReview = (data) => api.post("/reviews", data);
export const updateReview = (data) => api.put("/reviews", data);
export const deleteReview = (id) => api.delete(`/reviews?reviewId=${id}`);

/* ------- Suppliers Reports --------------------------------- */
export const getSuppliersReports = () => api.get("/suppliers-reports");
export const addSupplierReport = (data) => api.post("/suppliers-reports", data);
export const updateSuppliersReport = (data) =>
  api.put("/suppliers-reports", data);
export const deleteSuppliersReport = (id) =>
  api.delete(`/suppliers-reports?reportId=${id}`);

/* ------- SEO Strategy -------------------------------------- */
export const runSEOStrategy = (data) => api.post("/ai/seo-strategy", data);

/* ------- Scheduler Manuale -------------------------------- */
export const runDailyScheduler = () => api.post("/ai/run-scheduler");

export default api;
