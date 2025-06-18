// 📁 functions/channelManagerRoutes.js
const express = require("express");
const admin = require("firebase-admin");
const { verifyToken } = require("../middlewares/verifyToken");

const db = admin.firestore();
const router = express.Router();

router.use(verifyToken);

// 📌 Rate limit Firestore
const checkRateLimit = async (req, res, windowMs = 10 * 60 * 1000) => {
  const ip =
    req.headers["x-forwarded-for"] ||
    req.connection?.remoteAddress ||
    "unknown_ip";
  const now = Date.now();
  const rateDocRef = db.collection("RateLimits").doc(ip);
  const rateDoc = await rateDocRef.get();

  if (rateDoc.exists && now - rateDoc.data().lastRequest < windowMs) {
    return res
      .status(429)
      .json({ error: "❌ Troppe richieste. Riprova più tardi." });
  }

  await rateDocRef.set({ lastRequest: now });
  return true;
};

// 📌 Log centralizzato
const createLog = async (userId, log) => {
  const ref = db
    .collection("ChannelManager")
    .doc(userId)
    .collection("logs")
    .doc();
  await ref.set({ ...log, timestamp: admin.firestore.Timestamp.now() });
};

// 1️⃣ GET /channel-manager → Elenco canali
router.get("/", async (req, res) => {
  if (!(await checkRateLimit(req, res))) return;

  try {
    const snapshot = await db.collection("ChannelManager").get();
    const channels = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      lastSync: doc.data().lastSync?.toDate().toISOString() || "N/A",
    }));

    res.json({ channels });
  } catch (err) {
    console.error("❌ Errore getChannelManager:", err);
    res.status(500).json({ error: "Errore nel recupero canali." });
  }
});

// 2️⃣ GET /channel-manager/:id → Singolo canale
router.get("/:id", async (req, res) => {
  try {
    const doc = await db.collection("ChannelManager").doc(req.params.id).get();
    if (!doc.exists)
      return res.status(404).json({ error: "❌ Canale non trovato." });

    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    console.error("❌ Errore getSingleChannel:", err);
    res.status(500).json({ error: "Errore nel recupero canale." });
  }
});

// 3️⃣ POST /channel-manager/sync → Avvia sync canale
router.post("/sync", async (req, res) => {
  if (!(await checkRateLimit(req, res))) return;

  const { channelName } = req.body;
  if (!channelName)
    return res.status(400).json({ error: "❌ Nome canale obbligatorio." });

  try {
    const newDoc = {
      name: channelName,
      status: "syncing",
      lastSync: admin.firestore.Timestamp.now(),
    };

    const ref = await db.collection("ChannelManager").add(newDoc);

    await createLog(req.user.uid, {
      action: "syncChannelManager",
      details: `Avviata sync per ${channelName}`,
      action_by: "user",
    });

    res.json({ message: "✅ Sync avviata", id: ref.id });
  } catch (err) {
    console.error("❌ Errore syncChannel:", err);
    res.status(500).json({ error: "Errore sincronizzazione." });
  }
});

// 4️⃣ PUT /channel-manager/:id → Aggiorna canale
router.put("/:id", async (req, res) => {
  const { name, status } = req.body;
  if (!name || !status)
    return res.status(400).json({ error: "❌ Nome e stato obbligatori." });

  try {
    const ref = db.collection("ChannelManager").doc(req.params.id);
    await ref.update({
      name,
      status,
      lastSync: admin.firestore.Timestamp.now(),
    });

    await createLog(req.user.uid, {
      action: "updateChannel",
      details: `Aggiornato canale ${name}`,
      action_by: "user",
    });

    res.json({ message: "✅ Canale aggiornato." });
  } catch (err) {
    console.error("❌ Errore updateChannel:", err);
    res.status(500).json({ error: "Errore aggiornamento canale." });
  }
});

// 5️⃣ DELETE /channel-manager/:id → Elimina canale
router.delete("/:id", async (req, res) => {
  try {
    const ref = db.collection("ChannelManager").doc(req.params.id);
    await ref.delete();

    await createLog(req.user.uid, {
      action: "deleteChannel",
      details: `Canale ${req.params.id} eliminato`,
      action_by: "user",
    });

    res.json({ message: "✅ Canale eliminato." });
  } catch (err) {
    console.error("❌ Errore deleteChannel:", err);
    res.status(500).json({ error: "Errore eliminazione canale." });
  }
});

// 6️⃣ POST /channel-manager/map-rooms → Mappa camere
router.post("/map-rooms", async (req, res) => {
  const { mappings } = req.body;
  if (!mappings || typeof mappings !== "object") {
    return res.status(400).json({ error: "❌ Mappatura non valida." });
  }

  try {
    await db
      .collection("ChannelManager")
      .doc(req.user.uid)
      .collection("room_mappings")
      .doc("map")
      .set({ mappings }, { merge: true });

    await createLog(req.user.uid, {
      action: "mapRooms",
      details: "Mappatura camere aggiornata",
      action_by: "user",
    });

    res.json({ message: "✅ Mappatura aggiornata." });
  } catch (err) {
    console.error("❌ Errore mapRooms:", err);
    res.status(500).json({ error: "Errore mappatura camere." });
  }
});

// 7️⃣ POST /channel-manager/push-rates → Invia tariffe
router.post("/push-rates", async (req, res) => {
  const { roomId, rate, ota, origin = "user" } = req.body;
  if (!roomId || !rate || !ota)
    return res.status(400).json({ error: "❌ Dati mancanti." });

  try {
    await db
      .collection("ChannelManager")
      .doc(req.user.uid)
      .collection("pricing_updates")
      .add({
        roomId,
        rate,
        ota,
        origin,
        updatedAt: admin.firestore.Timestamp.now(),
      });

    await createLog(req.user.uid, {
      action: "pushRates",
      details: `Tariffa aggiornata per ${ota}: ${rate}€`,
      action_by: origin,
    });

    res.json({ message: "✅ Tariffa sincronizzata." });
  } catch (err) {
    console.error("❌ Errore pushRates:", err);
    res.status(500).json({ error: "Errore sincronizzazione tariffe." });
  }
});

// 8️⃣ POST /channel-manager/pull-bookings → Recupera prenotazioni (mock)
router.post("/pull-bookings", async (req, res) => {
  const { mock = false } = req.body;

  try {
    const bookings = mock
      ? [
          {
            guest: "Mario Rossi",
            room: "102",
            ota: "Booking.com",
            date: "2025-05-24",
          },
          {
            guest: "Alice Tanaka",
            room: "201",
            ota: "Agoda",
            date: "2025-05-25",
          },
        ]
      : [];

    await createLog(req.user.uid, {
      action: "pullBookings",
      details: `Prenotazioni recuperate: ${bookings.length}`,
      action_by: "system",
    });

    res.json({ bookings });
  } catch (err) {
    console.error("❌ Errore pullBookings:", err);
    res.status(500).json({ error: "Errore recupero prenotazioni." });
  }
});

module.exports = router;
