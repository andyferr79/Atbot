import axios from "axios";
import { getAuth } from "firebase/auth";

// 🔹 Crea l'istanza di Axios con la baseURL delle Firebase Functions
const api = axios.create({
  baseURL: "http://127.0.0.1:5001/autotaskerbot/us-central1", // Cambiare se deployato in produzione
});

// 🔹 Interceptor: inserisce il token Firebase aggiornato in ogni richiesta
api.interceptors.request.use(
  async (config) => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      const token = await user.getIdToken(true); // 🔁 Forza il refresh del token
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ API - Test
export const getTestFirebase = () => api.get("/getTestFirebase");

// ✅ API - Chat AI
export const sendMessageToAI = (message, sessionId) =>
  api.post("/chatWithAI", { user_message: message, session_id: sessionId });

// ✅ API - Fornitori
export const getSuppliers = () => api.get("/getSuppliers");
export const addSupplier = (supplierData) =>
  api.post("/addSupplier", supplierData);
export const updateSupplier = (supplierId, updatedData) =>
  api.put(`/updateSupplier/${supplierId}`, updatedData);
export const deleteSupplier = (supplierId) =>
  api.delete(`/deleteSupplier/${supplierId}`);

// ✅ API - Ospiti
export const getGuests = () => api.get("/getGuests");
export const addGuest = (guestData) => api.post("/addGuest", guestData);

// ✅ API - Camere
export const getRooms = () => api.get("/getRooms");
export const addRoom = (roomData) => api.post("/addRoom", roomData);
export const updateRoom = (roomId, updatedData) =>
  api.put(`/updateRoom/${roomId}`, updatedData);
export const deleteRoom = (roomId) => api.delete(`/deleteRoom/${roomId}`);

// ✅ API - Prenotazioni
export const getBookings = () => api.get("/getBookings");
export const addBooking = (bookingData) => api.post("/addBooking", bookingData);
export const updateBooking = (bookingId, updatedData) =>
  api.put(`/updateBooking/${bookingId}`, updatedData);
export const deleteBooking = (bookingId) =>
  api.delete(`/deleteBooking/${bookingId}`);

// ✅ API - Dashboard Overview (🔧 con userId)
export const getDashboardOverview = (userId) =>
  api.get(`/getDashboardOverview?userId=${userId}`);

// ✅ API - Notifiche
export const getUnreadNotificationsCount = () =>
  api.get("/getUnreadNotificationsCount");

export default api;
