// 📁 backupRoutes.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Inizializzazione Firebase
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// 🔒 Middleware autenticazione (opzionale, da attivare se vuoi proteggere backup)
async function authenticate(req) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) throw { status: 403, message: "❌ Token mancante." };
  try {
    return await admin.auth().verifyIdToken(token);
  } catch (error) {
    functions.logger.error("❌ Errore autenticazione:", error);
    throw { status: 401, message: "❌ Token non valido." };
  }
}

// ✅ POST: Avvia backup manuale
exports.startBackup = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "❌ Usa POST." });
  }

  try {
    const snapshot = await db.collection("criticalData").get();
    const backupData = [];

    snapshot.forEach((doc) => {
      backupData.push({ id: doc.id, data: doc.data() });
    });

    const timestamp = new Date().toISOString();
    await db.collection("backups").doc("latestBackup").set({
      timestamp,
      data: backupData,
    });

    res.status(200).json({ message: "✅ Backup creato", timestamp });
  } catch (error) {
    functions.logger.error("❌ Errore startBackup:", error);
    res.status(500).json({ error: error.message || "Errore interno." });
  }
});

// ✅ POST: Ripristina dati da backup
exports.restoreBackup = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "❌ Usa POST." });
  }

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
    res.status(200).json({ message: "✅ Ripristino completato." });
  } catch (error) {
    functions.logger.error("❌ Errore restoreBackup:", error);
    res.status(500).json({ error: error.message || "Errore interno." });
  }
});

// ✅ GET: Controlla stato backup
exports.getBackupStatus = functions.https.onRequest(async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "❌ Usa GET." });
  }

  try {
    const backupDoc = await db.collection("backups").doc("latestBackup").get();

    if (!backupDoc.exists) {
      return res.status(404).json({ error: "❌ Nessun backup trovato." });
    }

    const { timestamp } = backupDoc.data();
    res.status(200).json({ message: "✅ Backup trovato", timestamp });
  } catch (error) {
    functions.logger.error("❌ Errore getBackupStatus:", error);
    res.status(500).json({ error: error.message || "Errore interno." });
  }
});

// ✅ PUT: Cambia password utente
exports.updatePassword = functions.https.onRequest(async (req, res) => {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "❌ Usa PUT." });
  }

  try {
    const { uid, newPassword } = req.body;

    if (!uid || !newPassword) {
      return res
        .status(400)
        .json({ error: "❌ uid e newPassword obbligatori." });
    }

    await admin.auth().updateUser(uid, { password: newPassword });
    res.status(200).json({ message: "✅ Password aggiornata con successo." });
  } catch (error) {
    functions.logger.error("❌ Errore updatePassword:", error);
    res.status(500).json({ error: error.message || "Errore interno." });
  }
});
