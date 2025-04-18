// 📂 E:/ATBot/frontend/src/services/api.js
import axios from "axios";
import { getAuth } from "firebase/auth";

/*-------------------------------------------------------------
  BASE URL delle Firebase Functions
  – legge REACT_APP_FUNCTIONS_URL da .env.local
  – ripiega sulla URL dell’emulatore se assente
-------------------------------------------------------------*/
const FUNCTIONS_URL =
  process.env.REACT_APP_FUNCTIONS_URL ||
  "http://127.0.0.1:5001/autotaskerbot/us-central1";

const api = axios.create({ baseURL: FUNCTIONS_URL });

/*-------------------------------------------------------------
  REQUEST INTERCEPTOR – appende il Firebase ID‑Token
-------------------------------------------------------------*/
api.interceptors.request.use(
  async (config) => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      const token = await user.getIdToken(true);
      config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
    } else {
      console.warn("⚠️ Nessun utente autenticato – chiamata senza token.");
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/*-------------------------------------------------------------
  PUBLIC ENDPOINTS
-------------------------------------------------------------*/

/* Chat IA */
export const sendMessageToAI = (msg, sessionId) =>
  api.post("/chatWithAI", { user_message: msg, session_id: sessionId });

/* Fornitori */
export const getSuppliers = () => api.get("/getSuppliers");
export const addSupplier = (d) => api.post("/addSupplier", d);
export const updateSupplier = (id, d) => api.put(`/updateSupplier/${id}`, d);
export const deleteSupplier = (id) => api.delete(`/deleteSupplier/${id}`);

/* Ospiti */
export const getGuests = () => api.get("/getGuests");
export const addGuest = (d) => api.post("/addGuest", d);

/* Camere */
export const getRooms = () => api.get("/getRooms");
export const addRoom = (d) => api.post("/addRoom", d);
export const updateRoom = (id, d) => api.put(`/updateRoom/${id}`, d);
export const deleteRoom = (id) => api.delete(`/deleteRoom/${id}`);

/* Prenotazioni */
export const getBookings = () => api.get("/getBookings");
export const addBooking = (d) => api.post("/createBooking", d);
export const updateBooking = (id, d) => api.patch(`/updateBooking?id=${id}`, d);
export const deleteBooking = (id) => api.delete(`/deleteBooking?id=${id}`);

/* Dashboard */
export const getDashboardOverview = (uid) =>
  api.get(`/getDashboardOverview?userId=${uid}`);

/* Notifiche */
export const getUnreadNotificationsCount = () =>
  api.get("/getUnreadNotificationsCount");

/* Test */
export const getTestFirebase = () => api.get("/getTestFirebase");

export default api;
