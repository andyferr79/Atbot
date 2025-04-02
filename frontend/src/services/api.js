// 📂 src/services/api.js

import axios from "axios";

// 🔹 Imposta la base URL per le Firebase Cloud Functions locali o di produzione
const api = axios.create({
  baseURL: "http://127.0.0.1:5001/autotaskerbot/us-central1", // 🔁 Cambiare se deployato
});

// 🔹 Interceptor: aggiunge il token Firebase alle richieste (se presente)
api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem("firebaseToken"); // 🔐 Recupera il token dopo login
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ TEST API
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

export default api;
