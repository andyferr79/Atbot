// 📁 functions/stripeRoutes.js
const express = require("express");
const { admin } = require("./firebase");
const { verifyToken } = require("../middlewares/verifyToken");

const withRateLimit = require("./middlewares/withRateLimit");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY); // ✅ Usa variabile env

const router = express.Router();
const db = admin.firestore();

// 🔐 Middleware globale
router.use(verifyToken);
router.use(withRateLimit(10, 10 * 60 * 1000)); // Max 10 ogni 10 minuti

// 📌 POST /stripe/account-link
router.post("/account-link", async (req, res) => {
  try {
    const userId = req.user.uid;
    const userRef = db.collection("users").doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).json({ error: "❌ Utente non trovato" });
    }

    const userData = userSnap.data();
    let stripeAccountId = userData?.stripeAccountId;

    // 🔁 Crea account Stripe se non esiste
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "IT",
        email: userData.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      stripeAccountId = account.id;
      await userRef.update({ stripeAccountId });
    }

    // 🔗 Link per onboarding Express
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: "https://hoxy-demo.web.app/stripe/refresh",
      return_url: "https://hoxy-demo.web.app/dashboard",
      type: "account_onboarding",
    });

    res.status(200).json({ url: accountLink.url });
  } catch (err) {
    console.error("❌ Errore Stripe:", err);
    res.status(500).json({ error: "Errore generazione link Stripe" });
  }
});

module.exports = router;
