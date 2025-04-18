const admin = require("firebase-admin");
const functions = require("firebase-functions");

// 🔐 Inizializza Firebase Admin se non già fatto
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// ✅ Middleware autenticazione
async function authenticate(req) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) throw { status: 403, message: "❌ Token mancante" };
  try {
    await admin.auth().verifyIdToken(token);
  } catch (error) {
    functions.logger.error("❌ Token non valido:", error);
    throw { status: 401, message: "❌ Token non valido" };
  }
}

// ✅ Middleware Rate Limiting
async function checkRateLimit(ip, maxRequests, windowMs) {
  const rateDocRef = db.collection("RateLimits").doc(ip);
  const rateDoc = await rateDocRef.get();
  const now = Date.now();

  let data = rateDoc.exists ? rateDoc.data() : { count: 0, firstRequest: now };

  if (now - data.firstRequest < windowMs) {
    if (data.count >= maxRequests) {
      throw { status: 429, message: "❌ Troppe richieste. Riprova più tardi." };
    }
    data.count++;
  } else {
    data = { count: 1, firstRequest: now };
  }

  await rateDocRef.set(data);
}

// 📌 GET - Recupera tutte le camere
exports.getRooms = async (req, res) => {
  if (req.method !== "GET")
    return res.status(405).json({ error: "❌ Usa GET." });

  try {
    await authenticate(req);
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown_ip";
    await checkRateLimit(ip, 50, 10 * 60 * 1000);

    const roomsSnapshot = await db.collection("Rooms").get();
    const rooms = roomsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString() || "N/A",
    }));

    res.json({ totalRooms: rooms.length, rooms });
  } catch (error) {
    functions.logger.error("❌ Errore recupero camere:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
};

// 📌 POST - Crea nuova camera
exports.createRoom = async (req, res) => {
  if (req.method !== "POST")
    return res.status(405).json({ error: "❌ Usa POST." });

  try {
    await authenticate(req);
    const { name, type, price, status } = req.body;
    if (!name || !type || !price || !status) {
      return res.status(400).json({ error: "❌ Tutti i campi obbligatori." });
    }

    const newRoom = {
      name,
      type,
      price: parseFloat(price),
      status,
      createdAt: new Date(),
    };

    const docRef = await db.collection("Rooms").add(newRoom);
    res.status(201).json({ id: docRef.id, ...newRoom });
  } catch (error) {
    functions.logger.error("❌ Errore creazione camera:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
};

// 📌 PUT - Aggiorna camera
exports.updateRoom = async (req, res) => {
  if (req.method !== "PUT")
    return res.status(405).json({ error: "❌ Usa PUT." });

  try {
    await authenticate(req);
    const { roomId, updates } = req.body;
    if (!roomId || !updates) {
      return res
        .status(400)
        .json({ error: "❌ roomId e aggiornamenti richiesti." });
    }

    await db
      .collection("Rooms")
      .doc(roomId)
      .update({
        ...updates,
        updatedAt: new Date(),
      });

    res.json({ message: "✅ Camera aggiornata." });
  } catch (error) {
    functions.logger.error("❌ Errore aggiornamento camera:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
};

// 📌 DELETE - Elimina camera
exports.deleteRoom = async (req, res) => {
  if (req.method !== "DELETE")
    return res.status(405).json({ error: "❌ Usa DELETE." });

  try {
    await authenticate(req);
    const { roomId } = req.query;
    if (!roomId) return res.status(400).json({ error: "❌ roomId richiesto." });

    await db.collection("Rooms").doc(roomId).delete();
    res.json({ message: "✅ Camera eliminata." });
  } catch (error) {
    functions.logger.error("❌ Errore eliminazione camera:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
};
