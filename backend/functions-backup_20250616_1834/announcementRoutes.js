// 📁 functions/announcementRoutes.js

const express = require("express");
const router = express.Router();
const { admin } = require("../firebase");

const db = admin.firestore();

// 🔐 Middleware autenticazione
async function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(403).json({ message: "❌ Token mancante" });

  try {
    req.user = await admin.auth().verifyIdToken(token);
    next();
  } catch (error) {
    console.error("❌ Token non valido:", error);
    res.status(401).json({ message: "❌ Token non valido" });
  }
}

// 🔒 Middleware admin
async function checkAdminRole(req, res, next) {
  const userDoc = await db.collection("users").doc(req.user.uid).get();
  if (userDoc.exists && userDoc.data().role === "admin") {
    req.userDoc = userDoc.data();
    next();
  } else {
    res.status(403).json({ message: "Accesso non autorizzato" });
  }
}

// 🔹 GET /announcements → visibili per piano
router.get("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists)
      return res.status(404).json({ message: "Utente non trovato" });

    const userPlan = userDoc.data().plan || "base";
    const snapshot = await db
      .collection("official_announcements")
      .orderBy("pinned", "desc")
      .orderBy("date", "desc")
      .get();

    const results = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const destinatari = data.destinatari || ["all"];

      if (
        destinatari.includes("all") ||
        destinatari.includes(userPlan.toLowerCase())
      ) {
        const statusDocRef = db
          .collection("users")
          .doc(userId)
          .collection("announcements_status")
          .doc(doc.id);

        const statusDoc = await statusDocRef.get();
        const status = statusDoc.exists
          ? statusDoc.data()
          : { read: false, archived: false, deleted: false };

        if (!status.deleted) {
          results.push({
            id: doc.id,
            ...data,
            status,
          });
        }
      }
    }

    res.status(200).json(results);
  } catch (err) {
    console.error("❌ Errore getOfficialAnnouncements:", err);
    res.status(500).json({ message: "Errore server" });
  }
});

// 🔹 POST /announcements → creazione (solo admin)
router.post("/", verifyToken, checkAdminRole, async (req, res) => {
  const { title, message, pinned = false, destinatari = ["all"] } = req.body;
  if (!title || !message)
    return res.status(400).json({ message: "Titolo e messaggio obbligatori." });

  try {
    await db.collection("official_announcements").add({
      title,
      message,
      date: new Date(),
      pinned,
      destinatari,
      author: req.userDoc.email || "admin",
    });

    res.status(201).json({ message: "✅ Annuncio creato con successo." });
  } catch (err) {
    console.error("❌ Errore createOfficialAnnouncement:", err);
    res.status(500).json({ message: "Errore server" });
  }
});

// 🔹 POST /announcements/mark-read
router.post("/mark-read", verifyToken, async (req, res) => {
  const { announcementId } = req.body;
  if (!announcementId)
    return res.status(400).json({ message: "ID annuncio mancante" });

  try {
    await db
      .collection("users")
      .doc(req.user.uid)
      .collection("announcements_status")
      .doc(announcementId)
      .set({ read: true, readAt: new Date() }, { merge: true });

    res.status(200).json({ message: "✅ Annuncio segnato come letto." });
  } catch (err) {
    console.error("❌ Errore markAnnouncementAsRead:", err);
    res.status(500).json({ message: "Errore interno" });
  }
});

// 🔹 POST /announcements/archive
router.post("/archive", verifyToken, async (req, res) => {
  const { announcementId } = req.body;
  if (!announcementId)
    return res.status(400).json({ message: "ID annuncio mancante" });

  try {
    await db
      .collection("users")
      .doc(req.user.uid)
      .collection("announcements_status")
      .doc(announcementId)
      .set({ archived: true, archivedAt: new Date() }, { merge: true });

    res.status(200).json({ message: "✅ Annuncio archiviato." });
  } catch (err) {
    console.error("❌ Errore archiveAnnouncement:", err);
    res.status(500).json({ message: "Errore interno" });
  }
});

// 🔹 POST /announcements/delete
router.post("/delete", verifyToken, async (req, res) => {
  const { announcementId } = req.body;
  if (!announcementId)
    return res.status(400).json({ message: "ID annuncio mancante" });

  try {
    await db
      .collection("users")
      .doc(req.user.uid)
      .collection("announcements_status")
      .doc(announcementId)
      .set({ deleted: true, deletedAt: new Date() }, { merge: true });

    res.status(200).json({ message: "✅ Annuncio eliminato." });
  } catch (err) {
    console.error("❌ Errore deleteAnnouncement:", err);
    res.status(500).json({ message: "Errore interno" });
  }
});

module.exports = router;
