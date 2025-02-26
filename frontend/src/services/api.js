import axios from "axios";

// Crea l'istanza Axios
const api = axios.create({
  baseURL: "http://localhost:3001/api", // URL del backend principale
});

// Interceptor per gestire errori globali
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Errore durante la richiesta:", error);
    return Promise.reject(error);
  }
);

// **Funzioni Firebase**
export const getTestFirebase = () => api.get("/test-firebase");

// **Funzioni Chat (AI)**
export const sendMessageToAI = (message, sessionId) =>
  api.post("/ai/chat", { user_message: message, session_id: sessionId });

// **Funzioni Fornitori (Suppliers)**
export const getSuppliers = () => api.get("/suppliers");
export const addSupplier = (supplierData) =>
  api.post("/suppliers", supplierData);
export const updateSupplier = (supplierId, updatedData) =>
  api.put(`/suppliers/${supplierId}`, updatedData);
export const deleteSupplier = (supplierId) =>
  api.delete(`/suppliers/${supplierId}`);

// **Funzioni Ospiti (Guests)**
export const getGuests = () => api.get("/guests");
export const addGuest = (guestData) => api.post("/guests", guestData);

// **Funzioni Camere (Rooms)**
export const getRooms = () => api.get("/rooms");
export const addRoom = (roomData) => api.post("/rooms", roomData);
export const updateRoom = (roomId, updatedData) =>
  api.put(`/rooms/${roomId}`, updatedData);
export const deleteRoom = (roomId) => api.delete(`/rooms/${roomId}`);

// **Funzioni Prenotazioni (Bookings)**
export const getBookings = () => api.get("/bookings"); // Recupera tutte le prenotazioni
export const addBooking = (bookingData) => api.post("/bookings", bookingData); // Crea una nuova prenotazione
export const updateBooking = (bookingId, updatedData) =>
  api.put(`/bookings/${bookingId}`, updatedData); // Modifica una prenotazione
export const deleteBooking = (bookingId) =>
  api.delete(`/bookings/${bookingId}`); // Elimina una prenotazione

export default api;
