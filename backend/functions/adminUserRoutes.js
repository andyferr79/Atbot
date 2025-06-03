// 📁 E:/ATBot/backend/functions/adminUserRoutes.js

const admin = require("firebase-admin");
const db = admin.firestore();
const { verifyToken } = require("../middlewares/verifyToken");
const { checkAdminRole } = require("../middlewares/checkAdminRole");

// ✅ 1. Recupera tutti gli utenti
exports.getAllUsers = async (req, res) => {
  if (!(await verifyToken(req, res))) return;
  if (!(await checkAdminRole(req, res))) return;

  try {
    const snapshot = await db.collection("users").get();
    const users = snapshot.docs.map((doc) => doc.data());

    return res.status(200).json(users);
  } catch (error) {
    console.error("❌ Errore getAllUsers:", error);
    return res.status(500).json({ error: "Errore nel recupero utenti." });
  }
};

// ✅ 2. Modifica ruolo o piano di un utente
exports.updateUser = async (req, res) => {
  if (!(await verifyToken(req, res))) return;
  if (!(await checkAdminRole(req, res))) return;

  const uid = req.params.uid;
  const { role, plan } = req.body;

  try {
    const userRef = db.collection("users").doc(uid);
    await userRef.update({ role, plan });

    // Aggiorna anche i custom claims se servono
    await admin.auth().setCustomUserClaims(uid, {
      role,
      plan,
    });

    return res
      .status(200)
      .json({ message: "✅ Utente aggiornato con successo" });
  } catch (error) {
    console.error("❌ Errore updateUser:", error);
    return res.status(500).json({ error: "Errore aggiornamento utente." });
  }
};

// ✅ 3. Elimina un utente
exports.deleteUser = async (req, res) => {
  if (!(await verifyToken(req, res))) return;
  if (!(await checkAdminRole(req, res))) return;

  const uid = req.params.uid;

  try {
    await db.collection("users").doc(uid).delete();
    await admin.auth().deleteUser(uid);

    return res
      .status(200)
      .json({ message: "✅ Utente eliminato con successo" });
  } catch (error) {
    console.error("❌ Errore deleteUser:", error);
    return res.status(500).json({ error: "Errore eliminazione utente." });
  }
};
