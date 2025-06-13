// 📁 userInfoRoutes.js
const express = require("express");
const admin = require("firebase-admin");
const { verifyToken } = require("./middlewares/verifyToken");

const router = express.Router();

// ✅ Middleware di sicurezza
router.use(verifyToken);

// ✅ GET /userinfo → restituisce dati dell’utente autenticato
router.get("/", async (req, res) => {
  const uid = req.user.uid;
  const db = admin.firestore();

  try {
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "Utente non trovato" });
    }

    const userData = userDoc.data();
    return res.status(200).json({
      uid,
      email: userData.email || "",
      role: userData.role || "user",
      plan: userData.plan || "BASE",
    });
  } catch (error) {
    console.error("❌ Errore nel recupero dati utente:", error);
    return res.status(500).json({ error: "Errore nel recupero dati utente" });
  }
});

module.exports = router;
