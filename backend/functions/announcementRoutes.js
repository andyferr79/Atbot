const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// ✅ Middleware autenticazione
async function authenticate(req) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    throw { status: 403, message: "❌ Token mancante" };
  }
  try {
    return await admin.auth().verifyIdToken(token);
  } catch (error) {
    functions.logger.error("❌ Token non valido:", error);
    throw { status: 401, message: "❌ Token non valido" };
  }
}

/**
 * 🔹 GET /getOfficialAnnouncements
 */
const getOfficialAnnouncements = async (req, res) => {
  try {
    const user = await authenticate(req);
    const userId = user.uid;

    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: "Utente non trovato." });
    }

    const userPlan = userDoc.data().plan || "base";
    const announcementsSnapshot = await db
      .collection("official_announcements")
      .orderBy("pinned", "desc")
      .orderBy("date", "desc")
      .get();

    const results = [];

    for (const doc of announcementsSnapshot.docs) {
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

    return res.status(200).json(results);
  } catch (error) {
    functions.logger.error("❌ Errore getOfficialAnnouncements:", error);
    const status = error.status || 500;
    return res
      .status(status)
      .json({ message: error.message || "Errore server" });
  }
};

/**
 * 🔹 POST /createOfficialAnnouncement
 */
const createOfficialAnnouncement = async (req, res) => {
  try {
    const user = await authenticate(req);
    const userId = user.uid;

    const userDoc = await db.collection("users").doc(userId).get();
    const userRole = userDoc.data()?.role || "base";

    if (userRole !== "admin") {
      return res.status(403).json({ message: "Accesso non autorizzato" });
    }

    const { title, message, pinned = false, destinatari = ["all"] } = req.body;

    if (!title || !message) {
      return res
        .status(400)
        .json({ message: "Titolo e messaggio sono obbligatori." });
    }

    await db.collection("official_announcements").add({
      title,
      message,
      date: new Date(),
      pinned,
      destinatari,
      author: userDoc.data()?.email || "admin",
    });

    return res.status(201).json({ message: "Annuncio creato con successo." });
  } catch (error) {
    functions.logger.error("❌ Errore createOfficialAnnouncement:", error);
    const status = error.status || 500;
    return res
      .status(status)
      .json({ message: error.message || "Errore server" });
  }
};

/**
 * 🔹 POST /markAnnouncementAsRead
 */
const markAnnouncementAsRead = async (req, res) => {
  try {
    const user = await authenticate(req);
    const userId = user.uid;
    const { announcementId } = req.body;

    if (!announcementId) {
      return res.status(400).json({ message: "ID annuncio mancante." });
    }

    await db
      .collection("users")
      .doc(userId)
      .collection("announcements_status")
      .doc(announcementId)
      .set({ read: true, readAt: new Date() }, { merge: true });

    return res.status(200).json({ message: "Annuncio segnato come letto." });
  } catch (error) {
    functions.logger.error("❌ Errore markAnnouncementAsRead:", error);
    const status = error.status || 500;
    return res
      .status(status)
      .json({ message: error.message || "Errore interno" });
  }
};

/**
 * 🔹 POST /archiveAnnouncement
 */
const archiveAnnouncement = async (req, res) => {
  try {
    const user = await authenticate(req);
    const userId = user.uid;
    const { announcementId } = req.body;

    if (!announcementId) {
      return res.status(400).json({ message: "ID annuncio mancante." });
    }

    await db
      .collection("users")
      .doc(userId)
      .collection("announcements_status")
      .doc(announcementId)
      .set({ archived: true, archivedAt: new Date() }, { merge: true });

    return res.status(200).json({ message: "Annuncio archiviato." });
  } catch (error) {
    functions.logger.error("❌ Errore archiveAnnouncement:", error);
    const status = error.status || 500;
    return res
      .status(status)
      .json({ message: error.message || "Errore interno" });
  }
};

/**
 * 🔹 POST /deleteAnnouncement
 */
const deleteAnnouncement = async (req, res) => {
  try {
    const user = await authenticate(req);
    const userId = user.uid;
    const { announcementId } = req.body;

    if (!announcementId) {
      return res.status(400).json({ message: "ID annuncio mancante." });
    }

    await db
      .collection("users")
      .doc(userId)
      .collection("announcements_status")
      .doc(announcementId)
      .set({ deleted: true, deletedAt: new Date() }, { merge: true });

    return res.status(200).json({ message: "Annuncio eliminato." });
  } catch (error) {
    functions.logger.error("❌ Errore deleteAnnouncement:", error);
    const status = error.status || 500;
    return res
      .status(status)
      .json({ message: error.message || "Errore interno" });
  }
};

// ✅ Export di tutte le API
module.exports = {
  getOfficialAnnouncements,
  createOfficialAnnouncement,
  markAnnouncementAsRead,
  archiveAnnouncement,
  deleteAnnouncement,
};
