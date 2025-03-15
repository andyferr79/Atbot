import api from "../api"; // Usa l'istanza Firebase aggiornata

// ✅ Recupera i post sui social media
export const getSocialPosts = () => api.get("/getSocialPosts");

// ✅ Aggiunge un nuovo post sui social
export const addSocialPost = (postData) => api.post("/addSocialPost", postData);

// ✅ Elimina un post
export const deleteSocialPost = (postId) =>
  api.delete(`/deleteSocialPost/${postId}`);

// ✅ Recupera le campagne pubblicitarie
export const getAds = () => api.get("/getAds");

// ✅ Crea una nuova campagna pubblicitaria
export const addAd = (adData) => api.post("/addAd", adData);

// ✅ Recupera le promozioni attive
export const getPromotions = () => api.get("/getPromotions");

// ✅ Aggiunge una nuova promozione
export const addPromotion = (promotionData) =>
  api.post("/addPromotion", promotionData);

export default api;
