import axios from "axios";

// Crea l'istanza Axios
const api = axios.create({
  baseURL: "http://localhost:3001/api", // URL del backend
});

// Interceptor per gestire errori globali
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Errore durante la richiesta:", error);
    return Promise.reject(error);
  }
);

// Funzione per testare Firebase
export const getTestFirebase = () => api.get("/test-firebase");

// Funzione per gestire altri endpoint (esempio)
export const sendMessage = (message) =>
  api.post("/chat/message", { userMessage: message });

export default api;
