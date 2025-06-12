// 📁 E:/ATBot/backend/functions/adminUserRoutes.js

const express = require("express");
const admin = require("firebase-admin");
const router = express.Router();
const db = admin.firestore();

// 🔐 Middleware
const { verifyToken } = require("../middlewares/verifyToken");
const { checkAdminRole } = require("../middlewares/checkAdminRole");

router.use(verifyToken);
router.use(checkAdminRole);

// ✅ 1. Recupera tutti gli utenti
router.get("/", async (req, res) => {
  console.log("👤 [GET /admin-users] Recupero lista utenti");

  try {
    const snapshot = await db.collection("users").get();
    const users = snapshot.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
    }));

    console.log("✅ Utenti recuperati:", users.length);
    return res.status(200).json(users);
  } catch (error) {
    console.error("❌ Errore getAllUsers:", error);
    return res.status(500).json({ error: "Errore nel recupero utenti." });
  }
});

// ✅ 2. Modifica ruolo o piano di un utente
router.put("/:uid", async (req, res) => {
  const uid = req.params.uid;
  const { role, plan } = req.body;

  console.log(`🔧 [PUT /admin-users/${uid}] Modifica ruolo/piano →`, {
    role,
    plan,
  });

  try {
    const userRef = db.collection("users").doc(uid);
    await userRef.update({ role, plan });

    await admin.auth().setCustomUserClaims(uid, { role, plan });

    console.log("✅ Utente aggiornato con successo:", uid);
    return res.status(200).json({ message: "Utente aggiornato con successo." });
  } catch (error) {
    console.error("❌ Errore updateUser:", error);
    return res.status(500).json({ error: "Errore aggiornamento utente." });
  }
});

// ✅ 3. Elimina un utente
router.delete("/:uid", async (req, res) => {
  const uid = req.params.uid;

  console.log(`🗑️ [DELETE /admin-users/${uid}] Eliminazione utente`);

  try {
    await db.collection("users").doc(uid).delete();
    await admin.auth().deleteUser(uid);

    console.log("✅ Utente eliminato:", uid);
    return res.status(200).json({ message: "Utente eliminato con successo." });
  } catch (error) {
    console.error("❌ Errore deleteUser:", error);
    return res.status(500).json({ error: "Errore eliminazione utente." });
  }
});

module.exports = router;
