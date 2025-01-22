// settingsApi.js - Servizi per la pagina Settings
import axios from "axios";

// Crea l'istanza Axios
const settingsApi = axios.create({
  baseURL: "http://localhost:3001/api/settings", // Base URL per le API Settings
});

// Interceptor per gestire errori globali
settingsApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Errore durante la richiesta:", error);
    return Promise.reject(error);
  }
);

// **Funzioni Preferenze Generali**
export const getPreferences = () => settingsApi.get("/preferences");
export const updatePreferences = (preferences) =>
  settingsApi.put("/preferences", preferences);

// **Funzioni Notifiche**
export const getNotifications = () => settingsApi.get("/notifications");
export const updateNotifications = (notifications) =>
  settingsApi.put("/notifications", notifications);

// **Funzioni Configurazioni della Struttura**
export const getStructureSettings = () => settingsApi.get("/structure");
export const updateStructureSettings = (structure) =>
  settingsApi.put("/structure", structure);

// **Funzioni Utenti e Permessi**
export const getUsers = () => settingsApi.get("/users");
export const addUser = (user) => settingsApi.post("/users", user);
export const deleteUser = (userId) => settingsApi.delete(`/users/${userId}`);

// **Funzioni Backup e Sicurezza**
export const getSecuritySettings = () => settingsApi.get("/security");
export const updateSecuritySettings = (security) =>
  settingsApi.put("/security", security);

// **Funzioni Privacy e GDPR**
export const exportPrivacyData = () => settingsApi.get("/privacy/export");
export const deletePrivacyData = () => settingsApi.delete("/privacy/delete");

export default settingsApi;
