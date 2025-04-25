// 📂 E:/ATBot/frontend/src/services/api.js
import axios from "axios";
import { getAuth } from "firebase/auth"; // ✅ import mancante aggiunto ora!

/*-------------------------------------------------------------
  BASE URL delle Firebase Functions
  – legge REACT_APP_FUNCTIONS_URL da .env.local
  – ripiega sulla URL dell’emulatore se assente
-------------------------------------------------------------*/
const FUNCTIONS_URL =
  process.env.REACT_APP_FUNCTIONS_URL ||
  "http://127.0.0.1:5001/autotaskerbot/us-central1";

const api = axios.create({ baseURL: FUNCTIONS_URL });

/*-------------------------------------------------------------
  REQUEST INTERCEPTOR – token Firebase aggiornato automaticamente
-------------------------------------------------------------*/
api.interceptors.request.use(
  async (config) => {
    let token = localStorage.getItem("firebaseToken");

    // Aspetta brevemente il token aggiornato, se non disponibile subito
    if (!token) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      token = localStorage.getItem("firebaseToken");
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn("⚠️ Nessun token disponibile, richiesta non autorizzata");
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/*-------------------------------------------------------------
  RESPONSE INTERCEPTOR – refresh token automatico su errore 401
-------------------------------------------------------------*/
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      const user = getAuth().currentUser;
      if (user) {
        const token = await user.getIdToken(true);
        localStorage.setItem("firebaseToken", token);
        originalRequest.headers["Authorization"] = `Bearer ${token}`;
        return api(originalRequest);
      }
    }
    return Promise.reject(error);
  }
);

/*-------------------------------------------------------------
  PUBLIC ENDPOINTS
-------------------------------------------------------------*/

/* Chat IA */
export const sendMessageToAI = (msg, sessionId) =>
  api.post("/chatWithAI", { user_message: msg, session_id: sessionId });

/* Fornitori */
export const getSuppliers = () => api.get("/getSuppliers");
export const addSupplier = (data) => api.post("/addSupplier", data);
export const updateSupplier = (id, data) =>
  api.put(`/updateSupplier/${id}`, data);
export const deleteSupplier = (id) => api.delete(`/deleteSupplier/${id}`);

/* Ospiti */
export const getGuests = () => api.get("/getGuests");
export const addGuest = (data) => api.post("/addGuest", data);

/* Camere */
export const getRooms = () => api.get("/getRooms");
export const addRoom = (data) => api.post("/addRoom", data);
export const updateRoom = (id, data) => api.put(`/updateRoom/${id}`, data);
export const deleteRoom = (id) => api.delete(`/deleteRoom/${id}`);

/* Prenotazioni */
export const getBookings = () => api.get("/getBookings");
export const addBooking = (data) => api.post("/createBooking", data);
export const updateBooking = (id, data) =>
  api.patch(`/updateBooking?id=${id}`, data);
export const deleteBooking = (id) => api.delete(`/deleteBooking?id=${id}`);

/* Dashboard */
export const getDashboardOverview = (uid) =>
  api.get(`/getDashboardOverview?userId=${uid}`);

/* Notifiche */
// Recupera tutte le notifiche dell’utente
export const fetchNotifications = () =>
  api.get("/getNotifications").then((res) => res.data.notifications);

// Crea una nuova notifica
export const createNotification = ({ userId, message, type }) =>
  api
    .post("/createNotification", { userId, message, type })
    .then((res) => res.data);

// Segna una notifica come letta
export const markNotificationAsRead = (notificationId) =>
  api
    .put("/markNotificationAsRead", { notificationId })
    .then((res) => res.data);

// Segna tutte le notifiche come lette
export const markAllNotificationsAsRead = () =>
  api.put("/markAllNotificationsAsRead").then((res) => res.data);

// Elimina una notifica
export const deleteNotification = (notificationId) =>
  api
    .delete(`/deleteNotification?notificationId=${notificationId}`)
    .then((res) => res.data);

// Recupera il conteggio delle notifiche non lette
export const getUnreadNotificationsCount = () =>
  api.get("/getUnreadNotificationsCount").then((res) => res.data.unreadCount);

/* Annunci Ufficiali */
export const getOfficialAnnouncements = () =>
  api.get("/getOfficialAnnouncements");
export const markAnnouncementAsRead = (announcementId) =>
  api.post("/markAnnouncementAsRead", { announcementId });
export const archiveAnnouncement = (announcementId) =>
  api.post("/archiveAnnouncement", { announcementId });
export const deleteAnnouncement = (announcementId) =>
  api.post("/deleteAnnouncement", { announcementId });

/* Test (opzionale) */
export const getTestFirebase = () => api.get("/getTestFirebase");

export default api;
