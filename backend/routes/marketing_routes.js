const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");

// ==============================
// 📌 GESTIONE POST SOCIAL
// ==============================

// ✅ Recupera tutti i post social
router.get("/social/posts", async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection("SocialPosts").get();
    const posts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(posts);
  } catch (error) {
    console.error("❌ Errore nel recupero dei post social:", error);
    res
      .status(500)
      .json({ message: "Errore nel recupero dei post social", error });
  }
});

// ✅ Aggiunge un nuovo post social
router.post("/social/posts", async (req, res) => {
  try {
    const newPost = {
      ...req.body,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const docRef = await admin
      .firestore()
      .collection("SocialPosts")
      .add(newPost);
    res.json({ id: docRef.id, ...newPost });
  } catch (error) {
    console.error("❌ Errore nell'aggiunta del post social:", error);
    res
      .status(500)
      .json({ message: "Errore nell'aggiunta del post social", error });
  }
});

// ✅ Elimina un post social
router.delete("/social/posts/:id", async (req, res) => {
  try {
    const postId = req.params.id;
    await admin.firestore().collection("SocialPosts").doc(postId).delete();
    res.json({ message: "✅ Post social eliminato con successo", id: postId });
  } catch (error) {
    console.error("❌ Errore nell'eliminazione del post social:", error);
    res
      .status(500)
      .json({ message: "Errore nell'eliminazione del post social", error });
  }
});

// ==============================
// 📌 GESTIONE CAMPAGNE ADS
// ==============================

// ✅ Recupera tutte le campagne pubblicitarie
router.get("/ads", async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection("Ads").get();
    const ads = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(ads);
  } catch (error) {
    console.error("❌ Errore nel recupero delle campagne ads:", error);
    res
      .status(500)
      .json({ message: "Errore nel recupero delle campagne ads", error });
  }
});

// ✅ Aggiunge una nuova campagna pubblicitaria
router.post("/ads", async (req, res) => {
  try {
    const newAd = {
      ...req.body,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const docRef = await admin.firestore().collection("Ads").add(newAd);
    res.json({ id: docRef.id, ...newAd });
  } catch (error) {
    console.error("❌ Errore nell'aggiunta della campagna ads:", error);
    res
      .status(500)
      .json({ message: "Errore nell'aggiunta della campagna ads", error });
  }
});

// ==============================
// 📌 GESTIONE PROMOZIONI
// ==============================

// ✅ Recupera tutte le promozioni attive
router.get("/promotions", async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection("Promotions").get();
    const promotions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.json(promotions);
  } catch (error) {
    console.error("❌ Errore nel recupero delle promozioni:", error);
    res
      .status(500)
      .json({ message: "Errore nel recupero delle promozioni", error });
  }
});

// ✅ Aggiunge una nuova promozione
router.post("/promotions", async (req, res) => {
  try {
    const newPromotion = {
      ...req.body,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const docRef = await admin
      .firestore()
      .collection("Promotions")
      .add(newPromotion);
    res.json({ id: docRef.id, ...newPromotion });
  } catch (error) {
    console.error("❌ Errore nell'aggiunta della promozione:", error);
    res
      .status(500)
      .json({ message: "Errore nell'aggiunta della promozione", error });
  }
});

// ==============================
// 📌 GESTIONE ACCOUNT DI MARKETING
// ==============================

// ✅ Recupera tutti gli account collegati
router.get("/accounts", async (req, res) => {
  try {
    const snapshot = await admin
      .firestore()
      .collection("MarketingAccounts")
      .get();
    const accounts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.json(accounts);
  } catch (error) {
    console.error("❌ Errore nel recupero degli account di marketing:", error);
    res
      .status(500)
      .json({
        message: "Errore nel recupero degli account di marketing",
        error,
      });
  }
});

// ✅ Aggiunge un nuovo account collegato
router.post("/accounts", async (req, res) => {
  try {
    const {
      userId,
      facebookPageId,
      instagramId,
      googleAdsId,
      tiktokAdsId,
      mailchimpApiKey,
    } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "❌ L'ID utente è obbligatorio." });
    }

    const newAccount = {
      userId,
      facebookPageId: facebookPageId || null,
      instagramId: instagramId || null,
      googleAdsId: googleAdsId || null,
      tiktokAdsId: tiktokAdsId || null,
      mailchimpApiKey: mailchimpApiKey || null,
      connectedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await admin
      .firestore()
      .collection("MarketingAccounts")
      .add(newAccount);
    res.json({
      message: "✅ Account di marketing collegato con successo",
      id: docRef.id,
    });
  } catch (error) {
    console.error(
      "❌ Errore nel salvataggio dell'account di marketing:",
      error
    );
    res
      .status(500)
      .json({
        message: "Errore nel salvataggio dell'account di marketing",
        error,
      });
  }
});

module.exports = router;
