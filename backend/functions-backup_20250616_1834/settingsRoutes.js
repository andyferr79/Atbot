// 📁 functions/settingsRoutes.js
const express = require("express");
const { admin } = require("../firebase");
const { verifyToken } = require("../middlewares/verifyToken");
const withRateLimit = require("./middlewares/withRateLimit");

const db = admin.firestore();
const router = express.Router();

// 🔐 Middleware globale
router.use(verifyToken);
router.use(withRateLimit(50, 10 * 60 * 1000));

// ✅ Funzione generica per recuperare impostazioni
async function getSettings(docName) {
  const doc = await db.collection("Settings").doc(docName).get();
  if (!doc.exists)
    throw { status: 404, message: "⚠️ Impostazioni non trovate." };
  return doc.data();
}

// ✅ Funzione generica per aggiornare impostazioni
async function updateSettings(docName, data) {
  await db.collection("Settings").doc(docName).set(data, { merge: true });
}

// 📌 GET/PUT /settings/preferences
router
  .route("/preferences")
  .get(async (req, res) => {
    try {
      const preferences = await getSettings("preferences");
      res.json(preferences);
    } catch (error) {
      console.error("❌ Errore GET preferences:", error);
      res
        .status(error.status || 500)
        .json({ error: error.message || "Errore interno" });
    }
  })
  .put(async (req, res) => {
    try {
      const preferences = req.body;
      if (!preferences || typeof preferences !== "object") {
        return res
          .status(400)
          .json({ error: "❌ Dati preferenze non validi." });
      }
      await updateSettings("preferences", preferences);
      res.json({ message: "✅ Preferenze aggiornate." });
    } catch (error) {
      console.error("❌ Errore PUT preferences:", error);
      res
        .status(error.status || 500)
        .json({ error: error.message || "Errore interno" });
    }
  });

// 📌 GET/PUT /settings/structure
router
  .route("/structure")
  .get(async (req, res) => {
    try {
      const structure = await getSettings("structure");
      res.json(structure);
    } catch (error) {
      console.error("❌ Errore GET structure:", error);
      res
        .status(error.status || 500)
        .json({ error: error.message || "Errore interno" });
    }
  })
  .put(async (req, res) => {
    try {
      const structure = req.body;
      if (!structure || typeof structure !== "object") {
        return res.status(400).json({ error: "❌ Dati struttura non validi." });
      }
      await updateSettings("structure", structure);
      res.json({ message: "✅ Configurazione struttura aggiornata." });
    } catch (error) {
      console.error("❌ Errore PUT structure:", error);
      res
        .status(error.status || 500)
        .json({ error: error.message || "Errore interno" });
    }
  });

// 📌 GET/PUT /settings/security
router
  .route("/security")
  .get(async (req, res) => {
    try {
      const security = await getSettings("security");
      res.json(security);
    } catch (error) {
      console.error("❌ Errore GET security:", error);
      res
        .status(error.status || 500)
        .json({ error: error.message || "Errore interno" });
    }
  })
  .put(async (req, res) => {
    try {
      const security = req.body;
      if (!security || typeof security !== "object") {
        return res.status(400).json({ error: "❌ Dati sicurezza non validi." });
      }
      await updateSettings("security", security);
      res.json({ message: "✅ Impostazioni sicurezza aggiornate." });
    } catch (error) {
      console.error("❌ Errore PUT security:", error);
      res
        .status(error.status || 500)
        .json({ error: error.message || "Errore interno" });
    }
  });

module.exports = router;
