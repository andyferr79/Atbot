const functions = require("firebase-functions");
const admin = require("firebase-admin");

// ✅ Inizializza Firebase Admin se non è già attivo
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// 📌 Middleware per verifica token
const verifyToken = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    res.status(403).json({ error: "❌ Token mancante" });
    return false;
  }
  try {
    req.user = await admin.auth().verifyIdToken(token);
    return true;
  } catch (error) {
    functions.logger.error("❌ Token non valido:", error);
    res.status(401).json({ error: "❌ Token non valido" });
    return false;
  }
};

// 📌 Middleware per Rate Limiting con Firestore
const checkRateLimit = async (req, res, windowMs = 10 * 60 * 1000) => {
  const ip =
    req.headers["x-forwarded-for"] ||
    req.connection?.remoteAddress ||
    "unknown_ip";
  const now = Date.now();
  const rateDocRef = db.collection("RateLimits").doc(ip);
  const rateDoc = await rateDocRef.get();

  if (rateDoc.exists && now - rateDoc.data().lastRequest < windowMs) {
    res.status(429).json({ error: "❌ Troppe richieste. Riprova più tardi." });
    return false;
  }

  await rateDocRef.set({ lastRequest: now });
  return true;
};

// 📌 Logging centralizzato
const createLog = async (userId, log) => {
  const logRef = db
    .collection("ChannelManager")
    .doc(userId)
    .collection("logs")
    .doc();
  await logRef.set({
    ...log,
    timestamp: admin.firestore.Timestamp.now(),
  });
};

// 📌 1️⃣ GET /api/channel-manager
exports.getChannelManager = functions.https.onRequest(async (req, res) => {
  if (req.method !== "GET")
    return res.status(405).json({ error: "❌ Usa GET." });
  if (!(await verifyToken(req, res))) return;
  if (!(await checkRateLimit(req, res))) return;

  try {
    const snapshot = await db.collection("ChannelManager").get();
    if (snapshot.empty) return res.json({ channels: [] });

    const channels = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      lastSync: doc.data().lastSync
        ? doc.data().lastSync.toDate().toISOString()
        : "N/A",
    }));

    res.json({ channels });
  } catch (error) {
    functions.logger.error("❌ Errore nel recupero dei canali OTA:", error);
    res.status(500).json({ error: error.message });
  }
});

// 📌 2️⃣ GET /api/channel-manager/:id
exports.getSingleChannel = functions.https.onRequest(async (req, res) => {
  if (req.method !== "GET")
    return res.status(405).json({ error: "❌ Usa GET." });
  if (!(await verifyToken(req, res))) return;

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "❌ ID del canale mancante." });

  try {
    const channelDoc = await db.collection("ChannelManager").doc(id).get();
    if (!channelDoc.exists)
      return res.status(404).json({ error: "❌ Canale non trovato." });

    res.json({ id: channelDoc.id, ...channelDoc.data() });
  } catch (error) {
    functions.logger.error("❌ Errore nel recupero del canale OTA:", error);
    res.status(500).json({ error: error.message });
  }
});

// 📌 3️⃣ POST /api/channel-manager/sync
exports.syncChannelManager = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST")
    return res.status(405).json({ error: "❌ Usa POST." });
  if (!(await verifyToken(req, res))) return;
  if (!(await checkRateLimit(req, res))) return;

  const { channelName } = req.body;
  if (!channelName)
    return res
      .status(400)
      .json({ error: "❌ Il nome del canale è obbligatorio." });

  try {
    const newSync = {
      name: channelName,
      status: "syncing",
      lastSync: admin.firestore.Timestamp.fromDate(new Date()),
    };

    const docRef = await db.collection("ChannelManager").add(newSync);

    await createLog(req.user.uid, {
      action: "syncChannelManager",
      details: `Avviata sync per ${channelName}`,
      action_by: "user",
    });

    res.json({
      message: "✅ Sincronizzazione avviata con successo",
      id: docRef.id,
    });
  } catch (error) {
    functions.logger.error(
      "❌ Errore nella sincronizzazione con le OTA:",
      error
    );
    res.status(500).json({ error: error.message });
  }
});

// 📌 4️⃣ PUT /api/channel-manager/:id
exports.updateChannel = functions.https.onRequest(async (req, res) => {
  if (req.method !== "PUT")
    return res.status(405).json({ error: "❌ Usa PUT." });
  if (!(await verifyToken(req, res))) return;

  const { id } = req.query;
  const { name, status } = req.body;

  if (!id || !name || !status)
    return res.status(400).json({ error: "❌ ID, nome e stato obbligatori." });

  try {
    const channelRef = db.collection("ChannelManager").doc(id);
    await channelRef.update({
      name,
      status,
      lastSync: admin.firestore.Timestamp.fromDate(new Date()),
    });

    await createLog(req.user.uid, {
      action: "updateChannel",
      details: `Aggiornato canale ${name}`,
      action_by: "user",
    });

    res.json({ message: "✅ Canale aggiornato con successo." });
  } catch (error) {
    functions.logger.error(
      "❌ Errore nell'aggiornamento del canale OTA:",
      error
    );
    res.status(500).json({ error: error.message });
  }
});

// 📌 5️⃣ DELETE /api/channel-manager/:id
exports.deleteChannel = functions.https.onRequest(async (req, res) => {
  if (req.method !== "DELETE")
    return res.status(405).json({ error: "❌ Usa DELETE." });
  if (!(await verifyToken(req, res))) return;

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "❌ ID del canale mancante." });

  try {
    const channelRef = db.collection("ChannelManager").doc(id);
    await channelRef.delete();

    await createLog(req.user.uid, {
      action: "deleteChannel",
      details: `Canale ${id} eliminato`,
      action_by: "user",
    });

    res.json({ message: "✅ Canale eliminato con successo." });
  } catch (error) {
    functions.logger.error(
      "❌ Errore nell'eliminazione del canale OTA:",
      error
    );
    res.status(500).json({ error: error.message });
  }
});

// 📌 6️⃣ POST /api/channel-manager/map-rooms
exports.mapRooms = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST")
    return res.status(405).json({ error: "❌ Usa POST." });
  if (!(await verifyToken(req, res))) return;

  const userId = req.user.uid;
  const { mappings } = req.body;

  if (!mappings || typeof mappings !== "object")
    return res.status(400).json({ error: "❌ Mappatura non valida." });

  try {
    await db
      .collection("ChannelManager")
      .doc(userId)
      .collection("room_mappings")
      .doc("map")
      .set({ mappings }, { merge: true });

    await createLog(userId, {
      action: "mapRooms",
      details: "Mappatura camere aggiornata",
      action_by: "user",
    });

    res.json({ message: "✅ Mappatura aggiornata con successo." });
  } catch (error) {
    functions.logger.error("❌ Errore nella mappatura delle camere:", error);
    res.status(500).json({ error: error.message });
  }
});

// 📌 7️⃣ POST /api/channel-manager/push-rates
exports.pushRates = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST")
    return res.status(405).json({ error: "❌ Usa POST." });
  if (!(await verifyToken(req, res))) return;

  const userId = req.user.uid;
  const { roomId, rate, ota, origin = "user" } = req.body;

  if (!roomId || !rate || !ota)
    return res.status(400).json({ error: "❌ Dati mancanti." });

  try {
    await db
      .collection("ChannelManager")
      .doc(userId)
      .collection("pricing_updates")
      .add({
        roomId,
        rate,
        ota,
        origin,
        updatedAt: admin.firestore.Timestamp.now(),
      });

    await createLog(userId, {
      action: "pushRates",
      details: `Tariffa aggiornata per ${ota}: ${rate}€`,
      action_by: origin,
    });

    res.json({ message: "✅ Tariffa sincronizzata con successo." });
  } catch (error) {
    functions.logger.error(
      "❌ Errore nella sincronizzazione delle tariffe:",
      error
    );
    res.status(500).json({ error: error.message });
  }
});

// 📌 8️⃣ POST /api/channel-manager/pull-bookings
exports.pullBookings = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST")
    return res.status(405).json({ error: "❌ Usa POST." });
  if (!(await verifyToken(req, res))) return;

  const userId = req.user.uid;
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

    await createLog(userId, {
      action: "pullBookings",
      details: `Prenotazioni recuperate: ${bookings.length}`,
      action_by: "system",
    });

    res.json({ bookings });
  } catch (error) {
    functions.logger.error("❌ Errore nel recupero delle prenotazioni:", error);
    res.status(500).json({ error: error.message });
  }
});
