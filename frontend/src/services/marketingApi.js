import axios from "axios";

// Crea l'istanza Axios
const marketingApi = axios.create({
  baseURL: "http://localhost:3001/api/marketing", // Base URL specifico per le API Marketing
});

// Interceptor per gestire errori globali
marketingApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Errore durante la richiesta:", error);
    return Promise.reject(error);
  }
);

// **Funzioni Social Media**
export const getSocialPosts = () => marketingApi.get("/social/posts");
export const addSocialPost = (postData) =>
  marketingApi.post("/social/posts", postData);
export const deleteSocialPost = (postId) =>
  marketingApi.delete(`/social/posts/${postId}`);

// **Funzioni Campagne Ads**
export const getAds = () => marketingApi.get("/ads");
export const addAd = (adData) => marketingApi.post("/ads", adData);

// **Funzioni Promozioni**
export const getPromotions = () => marketingApi.get("/promotions");
export const addPromotion = (promotionData) =>
  marketingApi.post("/promotions", promotionData);

export default marketingApi;
