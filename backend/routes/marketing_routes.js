const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");

// Social Media
router.get("/social/posts", async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection("SocialPosts").get();
    const posts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(posts);
  } catch (error) {
    console.error("Errore nel recupero dei post social:", error);
    res
      .status(500)
      .json({ message: "Errore nel recupero dei post social", error });
  }
});

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
    console.error("Errore nell'aggiunta del post social:", error);
    res
      .status(500)
      .json({ message: "Errore nell'aggiunta del post social", error });
  }
});

router.delete("/social/posts/:id", async (req, res) => {
  try {
    const postId = req.params.id;
    await admin.firestore().collection("SocialPosts").doc(postId).delete();
    res.json({ message: "Post social eliminato con successo", id: postId });
  } catch (error) {
    console.error("Errore nell'eliminazione del post social:", error);
    res
      .status(500)
      .json({ message: "Errore nell'eliminazione del post social", error });
  }
});

// Campagne Ads
router.get("/ads", async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection("Ads").get();
    const ads = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(ads);
  } catch (error) {
    console.error("Errore nel recupero delle campagne ads:", error);
    res
      .status(500)
      .json({ message: "Errore nel recupero delle campagne ads", error });
  }
});

router.post("/ads", async (req, res) => {
  try {
    const newAd = {
      ...req.body,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const docRef = await admin.firestore().collection("Ads").add(newAd);
    res.json({ id: docRef.id, ...newAd });
  } catch (error) {
    console.error("Errore nell'aggiunta della campagna ads:", error);
    res
      .status(500)
      .json({ message: "Errore nell'aggiunta della campagna ads", error });
  }
});

// Promozioni
router.get("/promotions", async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection("Promotions").get();
    const promotions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.json(promotions);
  } catch (error) {
    console.error("Errore nel recupero delle promozioni:", error);
    res
      .status(500)
      .json({ message: "Errore nel recupero delle promozioni", error });
  }
});

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
    console.error("Errore nell'aggiunta della promozione:", error);
    res
      .status(500)
      .json({ message: "Errore nell'aggiunta della promozione", error });
  }
});

module.exports = router;
