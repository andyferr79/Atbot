// 📁 functions/backupRoutes.js
const express = require("express");
const admin = require("firebase-admin");
const { verifyToken } = require("../middlewares/verifyToken");

const router = express.Router();
const db = admin.firestore();

// 🔐 Middleware di autenticazione
router.use(verifyToken);

/**
 * 📌 POST /backup/start
 * 🔁 Crea un nuovo backup dei dati critici
 */
router.post("/start", async (req, res) => {
  try {
    const snapshot = await db.collection("criticalData").get();
    const backupData = snapshot.docs.map((doc) => ({
      id: doc.id,
      data: doc.data(),
    }));

    const timestamp = new Date().toISOString();
    await db.collection("backups").doc("latestBackup").set({
      timestamp,
      data: backupData,
    });

    return res.status(200).json({ message: "✅ Backup creato", timestamp });
  } catch (error) {
    console.error("❌ Errore startBackup:", error);
    return res.status(500).json({ error: "Errore interno nel backup." });
  }
});

/**
 * 📌 POST /backup/restore
 * 🔄 Ripristina i dati dall'ultimo backup salvato
 */
router.post("/restore", async (req, res) => {
  try {
    const backupDoc = await db.collection("backups").doc("latestBackup").get();

    if (!backupDoc.exists) {
      return res.status(404).json({ error: "❌ Nessun backup trovato." });
    }

    const backupData = backupDoc.data();
    const batch = db.batch();

    backupData.data.forEach((item) => {
      const ref = db.collection("criticalData").doc(item.id);
      batch.set(ref, item.data);
    });

    await batch.commit();
    return res.status(200).json({ message: "✅ Ripristino completato." });
  } catch (error) {
    console.error("❌ Errore restoreBackup:", error);
    return res.status(500).json({ error: "Errore interno nel ripristino." });
  }
});

/**
 * 📌 GET /backup/status
 * 📊 Verifica lo stato dell'ultimo backup
 */
router.get("/status", async (req, res) => {
  try {
    const backupDoc = await db.collection("backups").doc("latestBackup").get();

    if (!backupDoc.exists) {
      return res.status(404).json({ error: "❌ Nessun backup trovato." });
    }

    const { timestamp } = backupDoc.data();
    return res.status(200).json({ message: "✅ Backup trovato", timestamp });
  } catch (error) {
    console.error("❌ Errore getBackupStatus:", error);
    return res
      .status(500)
      .json({ error: "Errore interno nel recupero stato." });
  }
});

/**
 * 📌 PUT /backup/update-password
 * 🔒 Aggiorna la password dell'utente attuale o di un altro (se admin)
 */
router.put("/update-password", async (req, res) => {
  try {
    const { uid: requestedUid, newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ error: "❌ Nuova password obbligatoria." });
    }

    // ✅ Se admin e UID è specificato, modifica password di quel UID
    // Altrimenti modifica solo la propria
    const uid =
      req.user.role === "admin" && requestedUid ? requestedUid : req.user.uid;

    await admin.auth().updateUser(uid, { password: newPassword });

    return res
      .status(200)
      .json({ message: `✅ Password aggiornata per UID: ${uid}` });
  } catch (error) {
    console.error("❌ Errore updatePassword:", error);
    return res
      .status(500)
      .json({ error: "Errore interno nella modifica password." });
  }
});

module.exports = router;
