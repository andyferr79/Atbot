const functions = require("firebase-functions");
const admin = require("firebase-admin");

// ✅ Inizializza Firebase Admin se non è già attivo
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// ✅ API per ottenere tutte le prenotazioni
exports.getBookingsData = functions.https.onRequest(async (req, res) => {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ error: "❌ Metodo non consentito. Usa GET." });
  }

  try {
    const bookingsSnapshot = await db.collection("Bookings").get();
    if (bookingsSnapshot.empty) {
      return res.json({
        totalBookings: 0,
        activeBookings: 0,
        confirmedBookings: 0,
        cancelledBookings: 0,
        recentBookings: [],
      });
    }

    let totalBookings = 0,
      activeBookings = 0,
      confirmedBookings = 0,
      cancelledBookings = 0,
      recentBookings = [];

    bookingsSnapshot.forEach((doc) => {
      const booking = doc.data();
      totalBookings++;

      if (booking.status === "active") activeBookings++;
      if (booking.status === "confirmed") confirmedBookings++;
      if (booking.status === "cancelled") cancelledBookings++;

      recentBookings.push({
        id: doc.id,
        customerName: booking.customerName || "N/A",
        checkInDate: booking.checkInDate?.toDate()?.toISOString() || null,
        checkOutDate: booking.checkOutDate?.toDate()?.toISOString() || null,
        amount: booking.amount || 0,
        status: booking.status || "unknown",
      });
    });

    recentBookings = recentBookings
      .filter((b) => b.checkInDate !== null)
      .sort((a, b) => new Date(b.checkInDate) - new Date(a.checkInDate))
      .slice(0, 5);

    return res.json({
      totalBookings,
      activeBookings,
      confirmedBookings,
      cancelledBookings,
      recentBookings,
    });
  } catch (error) {
    functions.logger.error("❌ Errore nel recupero delle prenotazioni:", error);
    return res
      .status(500)
      .json({
        error: "Errore nel recupero delle prenotazioni",
        details: error.message,
      });
  }
});

// ✅ API per ottenere una singola prenotazione
exports.getBookingById = functions.https.onRequest(async (req, res) => {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ error: "❌ Metodo non consentito. Usa GET." });
  }

  try {
    const { id } = req.query;
    if (!id) {
      return res
        .status(400)
        .json({ error: "❌ ID della prenotazione mancante" });
    }

    const bookingRef = db.collection("Bookings").doc(id);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) {
      return res.status(404).json({ error: "❌ Prenotazione non trovata" });
    }

    return res.status(200).json({ id: bookingDoc.id, ...bookingDoc.data() });
  } catch (error) {
    functions.logger.error("❌ Errore nel recupero della prenotazione:", error);
    return res
      .status(500)
      .json({ error: "Errore nel recupero della prenotazione" });
  }
});

// ✅ API per creare una nuova prenotazione
exports.createBooking = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ error: "❌ Metodo non consentito. Usa POST." });
  }

  try {
    const { customerName, checkInDate, checkOutDate, amount, status } =
      req.body;
    if (!customerName || !checkInDate || !checkOutDate || !amount || !status) {
      return res
        .status(400)
        .json({ error: "❌ Tutti i campi sono obbligatori" });
    }

    const newBooking = {
      customerName,
      checkInDate: admin.firestore.Timestamp.fromDate(new Date(checkInDate)),
      checkOutDate: admin.firestore.Timestamp.fromDate(new Date(checkOutDate)),
      amount,
      status,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const bookingRef = await db.collection("Bookings").add(newBooking);
    return res
      .status(201)
      .json({ message: "✅ Prenotazione creata", id: bookingRef.id });
  } catch (error) {
    functions.logger.error(
      "❌ Errore nella creazione della prenotazione:",
      error
    );
    return res
      .status(500)
      .json({ error: "Errore nella creazione della prenotazione" });
  }
});

// ✅ API per aggiornare una prenotazione esistente
exports.updateBooking = functions.https.onRequest(async (req, res) => {
  if (req.method !== "PATCH") {
    return res
      .status(405)
      .json({ error: "❌ Metodo non consentito. Usa PATCH." });
  }

  try {
    const { id } = req.query;
    if (!id) {
      return res
        .status(400)
        .json({ error: "❌ ID della prenotazione mancante" });
    }

    const { customerName, checkInDate, checkOutDate, amount, status } =
      req.body;
    if (!customerName && !checkInDate && !checkOutDate && !amount && !status) {
      return res.status(400).json({ error: "❌ Nessun dato da aggiornare" });
    }

    const bookingRef = db.collection("Bookings").doc(id);
    const bookingDoc = await bookingRef.get();
    if (!bookingDoc.exists) {
      return res.status(404).json({ error: "❌ Prenotazione non trovata" });
    }

    const updateData = {};
    if (customerName) updateData.customerName = customerName;
    if (checkInDate)
      updateData.checkInDate = admin.firestore.Timestamp.fromDate(
        new Date(checkInDate)
      );
    if (checkOutDate)
      updateData.checkOutDate = admin.firestore.Timestamp.fromDate(
        new Date(checkOutDate)
      );
    if (amount) updateData.amount = amount;
    if (status) updateData.status = status;

    await bookingRef.update(updateData);
    return res
      .status(200)
      .json({ message: "✅ Prenotazione aggiornata con successo", id });
  } catch (error) {
    functions.logger.error(
      "❌ Errore nell'aggiornamento della prenotazione:",
      error
    );
    return res
      .status(500)
      .json({ error: "Errore nell'aggiornamento della prenotazione" });
  }
});

// ✅ API per eliminare una prenotazione
exports.deleteBooking = functions.https.onRequest(async (req, res) => {
  if (req.method !== "DELETE") {
    return res
      .status(405)
      .json({ error: "❌ Metodo non consentito. Usa DELETE." });
  }

  try {
    const { id } = req.query;
    if (!id) {
      return res
        .status(400)
        .json({ error: "❌ ID della prenotazione mancante" });
    }

    const bookingRef = db.collection("Bookings").doc(id);
    const bookingDoc = await bookingRef.get();
    if (!bookingDoc.exists) {
      return res.status(404).json({ error: "❌ Prenotazione non trovata" });
    }

    await bookingRef.delete();
    return res
      .status(200)
      .json({ message: "✅ Prenotazione eliminata con successo" });
  } catch (error) {
    functions.logger.error(
      "❌ Errore nell'eliminazione della prenotazione:",
      error
    );
    return res
      .status(500)
      .json({ error: "Errore nell'eliminazione della prenotazione" });
  }
});
