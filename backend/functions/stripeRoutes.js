// 📁 E:/ATBot/backend/functions/stripeRoutes.js

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripe = require("stripe")("sk_test_laTuaChiaveSegreta"); // 🔁 METTI QUI la tua SECRET KEY Stripe test

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// 🎯 Crea link di collegamento Stripe Express per strutture
exports.createStripeAccountLink = functions.https.onRequest(
  async (req, res) => {
    if (req.method !== "POST") return res.status(405).send("❌ Usa POST");

    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "❌ userId richiesto" });

    try {
      const userRef = db.collection("users").doc(userId);
      const userSnap = await userRef.get();

      if (!userSnap.exists)
        return res.status(404).json({ error: "❌ Utente non trovato" });

      const userData = userSnap.data();
      let stripeAccountId = userData?.stripeAccountId;

      // 🔁 Se non esiste l'account Stripe, lo creiamo
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

      return res.status(200).json({ url: accountLink.url });
    } catch (err) {
      functions.logger.error("❌ Errore Stripe:", err);
      return res.status(500).json({ error: "Errore generazione link Stripe" });
    }
  }
);
