import api from "../api"; // Usa l'istanza Firebase aggiornata

// **Preferenze Generali**
export const getPreferences = () => api.get("/getPreferences");
export const updatePreferences = (preferences) =>
  api.put("/updatePreferences", preferences);

// **Notifiche**
export const getNotifications = () => api.get("/getNotifications");
export const updateNotifications = (notifications) =>
  api.put("/updateNotifications", notifications);

// **Configurazioni della Struttura**
export const getStructureSettings = () => api.get("/getStructureSettings");
export const updateStructureSettings = (structure) =>
  api.put("/updateStructureSettings", structure);

// **Gestione Utenti e Permessi**
export const getUsers = () => api.get("/getUsers");
export const addUser = (user) => api.post("/addUser", user);
export const deleteUser = (userId) => api.delete(`/deleteUser/${userId}`);

// **Backup e Sicurezza**
export const getSecuritySettings = () => api.get("/getSecuritySettings");
export const updateSecuritySettings = (security) =>
  api.put("/updateSecuritySettings", security);

// **Privacy e GDPR**
export const exportPrivacyData = () => api.get("/exportPrivacyData");
export const deletePrivacyData = () => api.delete("/deletePrivacyData");

// ✅ 🔥 FIX EXPORT - Assegniamo prima a una variabile prima di esportare
const settingsApi = {
  getPreferences,
  updatePreferences,
  getNotifications,
  updateNotifications,
  getStructureSettings,
  updateStructureSettings,
  getUsers,
  addUser,
  deleteUser,
  getSecuritySettings,
  updateSecuritySettings,
  exportPrivacyData,
  deletePrivacyData,
};

export default settingsApi;
