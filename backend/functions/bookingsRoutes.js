const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Inizializzazione Firebase
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// 🔒 Middleware autenticazione
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

// ✅ GET: Recupera tutte le prenotazioni dell'utente autenticato
exports.getBookings = functions.https.onRequest(async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "❌ Usa GET." });
  }

  try {
    const user = await authenticate(req);
    const snapshot = await db
      .collection("Bookings")
      .where("userId", "==", user.uid)
      .get();

    const bookings = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString(),
    }));

    res.json({ bookings });
  } catch (error) {
    functions.logger.error("❌ Errore getBookings:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno." });
  }
});

// ✅ GET: Ottieni singola prenotazione per ID
exports.getBookingById = functions.https.onRequest(async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "❌ Usa GET." });
  }

  try {
    const user = await authenticate(req);
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: "❌ ID prenotazione mancante." });
    }

    const doc = await db.collection("Bookings").doc(id).get();
    if (!doc.exists || doc.data().userId !== user.uid) {
      return res.status(404).json({ error: "❌ Prenotazione non trovata." });
    }

    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    functions.logger.error("❌ Errore getBookingById:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno." });
  }
});

// ✅ POST: Creazione nuova prenotazione
exports.createBooking = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "❌ Usa POST." });
  }

  try {
    const user = await authenticate(req);
    const { customerName, checkInDate, checkOutDate, amount, status } =
      req.body;

    if (!customerName || !checkInDate || !checkOutDate || !amount || !status) {
      return res.status(400).json({ error: "❌ Tutti i campi obbligatori." });
    }

    const bookingData = {
      customerName,
      checkInDate: admin.firestore.Timestamp.fromDate(new Date(checkInDate)),
      checkOutDate: admin.firestore.Timestamp.fromDate(new Date(checkOutDate)),
      amount,
      status,
      userId: user.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const bookingRef = await db.collection("Bookings").add(bookingData);
    const savedDoc = await bookingRef.get();
    const savedData = savedDoc.data();

    res.status(201).json({
      id: savedDoc.id,
      ...savedData,
      checkInDate: savedData.checkInDate?.toDate().toISOString(),
      checkOutDate: savedData.checkOutDate?.toDate().toISOString(),
      createdAt: savedData.createdAt?.toDate().toISOString(),
    });
  } catch (error) {
    functions.logger.error("❌ Errore createBooking:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno." });
  }
});

// ✅ PATCH: Aggiornamento prenotazione esistente
exports.updateBooking = functions.https.onRequest(async (req, res) => {
  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "❌ Usa PATCH." });
  }

  try {
    const user = await authenticate(req);
    const { id } = req.query;
    const updates = req.body;

    if (!id) {
      return res.status(400).json({ error: "❌ ID prenotazione mancante." });
    }

    const bookingRef = db.collection("Bookings").doc(id);
    const doc = await bookingRef.get();

    if (!doc.exists || doc.data().userId !== user.uid) {
      return res.status(404).json({ error: "❌ Prenotazione non trovata." });
    }

    if (updates.checkInDate)
      updates.checkInDate = admin.firestore.Timestamp.fromDate(
        new Date(updates.checkInDate)
      );
    if (updates.checkOutDate)
      updates.checkOutDate = admin.firestore.Timestamp.fromDate(
        new Date(updates.checkOutDate)
      );

    await bookingRef.update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.json({ message: "✅ Prenotazione aggiornata." });
  } catch (error) {
    functions.logger.error("❌ Errore updateBooking:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno." });
  }
});

// ✅ DELETE: Elimina prenotazione
exports.deleteBooking = functions.https.onRequest(async (req, res) => {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "❌ Usa DELETE." });
  }

  try {
    const user = await authenticate(req);
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: "❌ ID prenotazione mancante." });
    }

    const bookingRef = db.collection("Bookings").doc(id);
    const doc = await bookingRef.get();

    if (!doc.exists || doc.data().userId !== user.uid) {
      return res.status(404).json({ error: "❌ Prenotazione non trovata." });
    }

    await bookingRef.delete();
    res.json({ message: "✅ Prenotazione eliminata." });
  } catch (error) {
    functions.logger.error("❌ Errore deleteBooking:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno." });
  }
});
