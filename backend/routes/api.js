/*  src/services/api.js  */
import axios from "axios";
import { getAuth, onAuthStateChanged } from "firebase/auth";

/* ─────────────────────────────────────────────────────────────
   1⃣  BASE-URL: se non c’è la variabile .env usa l’emulatore       */
const API_BASE_URL =
  import.meta.env.VITE_FUNCTIONS_URL ||
  "http://127.0.0.1:5001/autotaskerbot/us-central1";

/* ─────────────────────────────────────────────────────────────
   2⃣  Istanza Axios                                                */
const api = axios.create({ baseURL: API_BASE_URL });

/* ─────────────────────────────────────────────────────────────
   3⃣  Helper: attendi che Firebase Auth emetta l’utente            */
let tokenPromise = null;

const waitForValidToken = () => {
  if (tokenPromise) return tokenPromise;

  const auth = getAuth();
  tokenPromise = new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const idToken = await user.getIdToken(true); // forza refresh
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

/* ─────────────────────────────────────────────────────────────
   4⃣  Interceptor REQUEST                                         */
api.interceptors.request.use(
  async (config) => {
    let token = localStorage.getItem("firebaseToken");
    if (!token) token = await waitForValidToken();

    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

/* ─────────────────────────────────────────────────────────────
   5⃣  Interceptor RESPONSE                                        */
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
        return api(config); // ritenta la stessa richiesta
      }
    }
    return Promise.reject(error);
  }
);

/* ─────────────────────────────────────────────────────────────
   6⃣  FUNZIONI REST — (aggiorna qui quando aggiungi nuove API)    */

/* ------- Test / Utilities ----------------------------------- */
export const getTestFirebase = () => api.get("/getTestFirebase");

/* ------- Chat AI ------------------------------------------- */
export const sendMessageToAI = (message, sessionId) =>
  api.post("/chatWithAI", { user_message: message, session_id: sessionId });

/* ------- Suppliers ----------------------------------------- */
export const getSuppliers = () => api.get("/getSuppliers");
export const addSupplier = (data) => api.post("/addSupplier", data);
export const updateSupplier = (id, data) =>
  api.put(`/updateSupplier/${id}`, data);
export const deleteSupplier = (id) => api.delete(`/deleteSupplier/${id}`);

/* ------- Guests -------------------------------------------- */
export const getGuests = () => api.get("/getGuests");
export const addGuest = (data) => api.post("/addGuest", data);

/* ------- Rooms --------------------------------------------- */
export const getRooms = () => api.get("/getRooms");
export const addRoom = (data) => api.post("/addRoom", data);
export const updateRoom = (id, data) => api.put(`/updateRoom/${id}`, data);
export const deleteRoom = (id) => api.delete(`/deleteRoom/${id}`);

/* ------- Bookings ------------------------------------------ */
export const getBookings = () => api.get("/getBookings");
export const addBooking = (data) => api.post("/addBooking", data);
export const updateBooking = (id, data) =>
  api.put(`/updateBooking/${id}`, data);
export const deleteBooking = (id) => api.delete(`/deleteBooking/${id}`);

/* ----------------------------------------------------------- */
export default api;
