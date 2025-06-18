/**************************************************************
 * Backup & Restore –  Cloud Firestore → Cloud Storage        *
 *  - POST /backup/start        salva JSON nel bucket         *
 *  - POST /backup/restore      ripristina dall’ultimo file   *
 *  - GET  /backup/status       data/ora ultimo backup        *
 *  - PUT  /backup/update-password  cambia password Firebase  *
 **************************************************************/

require("dotenv").config();
const express = require("express");
const admin = require("firebase-admin");
const { Storage } = require("@google-cloud/storage");
const { verifyToken } = require("../middlewares/verifyToken");

const router = express.Router();
const db = admin.firestore();

// 👉  bucket dove scriveremo il file
const BUCKET_NAME =
  process.env.FIRESTORE_BACKUP_BUCKET || "autotaskerbot.appspot.com";
const storage = new Storage();
const bucket = storage.bucket(BUCKET_NAME);

// 🔐 Middleware auth
router.use(verifyToken);

/*───────────────────────────  POST /backup/start  ───────────────────────────*/
router.post("/start", async (req, res) => {
  try {
    // 1. leggi la collection “criticalData”
    const snapshot = await db.collection("criticalData").get();
    const backupData = snapshot.docs.map((d) => ({ id: d.id, data: d.data() }));

    // 2. scrivi JSON su Cloud Storage
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `firestore_backup_${timestamp}.json`;
    const file = bucket.file(`backups/${fileName}`);

    await file.save(JSON.stringify(backupData, null, 2), {
      contentType: "application/json",
      gzip: true,
    });

    // 3. metadato in Firestore
    await db.collection("backups").doc("latestBackup").set({
      timestamp,
      filePath: file.name,
      itemCount: backupData.length,
    });

    return res
      .status(200)
      .json({ message: "✅ Backup creato", timestamp, file: file.name });
  } catch (err) {
    console.error("❌ startBackup:", err);
    return res.status(500).json({ error: "Errore interno nel backup." });
  }
});

/*───────────────────────────  POST /backup/restore  ─────────────────────────*/
router.post("/restore", async (req, res) => {
  try {
    const meta = await db.collection("backups").doc("latestBackup").get();
    if (!meta.exists)
      return res.status(404).json({ error: "❌ Nessun backup trovato." });

    // 1. scarica il file JSON dal bucket
    const { filePath } = meta.data();
    const [contents] = await bucket.file(filePath).download();
    const backupData = JSON.parse(contents.toString());

    // 2. ripristina in batch
    const batch = db.batch();
    backupData.forEach(({ id, data }) =>
      batch.set(db.collection("criticalData").doc(id), data)
    );
    await batch.commit();

    return res.status(200).json({ message: "✅ Ripristino completato." });
  } catch (err) {
    console.error("❌ restoreBackup:", err);
    return res.status(500).json({ error: "Errore interno nel ripristino." });
  }
});

/*────────────────────────────  GET /backup/status  ──────────────────────────*/
router.get("/status", async (req, res) => {
  try {
    const meta = await db.collection("backups").doc("latestBackup").get();
    if (!meta.exists)
      return res.status(404).json({ error: "❌ Nessun backup trovato." });

    const { timestamp, filePath, itemCount } = meta.data();
    return res.status(200).json({ timestamp, filePath, itemCount });
  } catch (err) {
    console.error("❌ getBackupStatus:", err);
    return res
      .status(500)
      .json({ error: "Errore interno nel recupero stato." });
  }
});

/*──────────────────────  PUT /backup/update-password  ───────────────────────*/
router.put("/update-password", async (req, res) => {
  try {
    const { uid: requestedUid, newPassword } = req.body;
    if (!newPassword)
      return res.status(400).json({ error: "❌ Nuova password obbligatoria." });

    const uid =
      req.user.role === "admin" && requestedUid ? requestedUid : req.user.uid;
    await admin.auth().updateUser(uid, { password: newPassword });

    return res
      .status(200)
      .json({ message: `✅ Password aggiornata per UID: ${uid}` });
  } catch (err) {
    console.error("❌ updatePassword:", err);
    return res
      .status(500)
      .json({ error: "Errore interno nella modifica password." });
  }
});

module.exports = router;
