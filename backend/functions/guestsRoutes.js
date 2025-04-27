/**
 * Guests Routes – StayPro
 * Collezione: /Guests
 * Campi minimi richiesti: name, email
 */

const admin = require("firebase-admin");
const db = admin.firestore();

// ▶ GET /getGuests
const getGuests = async (req, res) => {
  try {
    const snap = await db.collection("Guests").get();
    const guests = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return res.json(guests);
  } catch (err) {
    console.error("getGuests error:", err.message);
    return res.status(500).json({ error: "Impossibile recuperare gli ospiti" });
  }
};

// ▶ POST /addGuest
const addGuest = async (req, res) => {
  try {
    const { name, email, phone = "", roomType = "" } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: "name ed email sono obbligatori" });
    }
    const doc = await db.collection("Guests").add({
      name,
      email,
      phone,
      roomType,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return res.status(201).json({ id: doc.id, message: "Guest creato" });
  } catch (err) {
    console.error("addGuest error:", err.message);
    return res.status(500).json({ error: "Creazione guest fallita" });
  }
};

// ▶ PUT /updateGuest/:guestId
const updateGuest = async (req, res) => {
  try {
    const { guestId } = req.params;
    await db.collection("Guests").doc(guestId).update(req.body);
    return res.json({ message: "Guest aggiornato" });
  } catch (err) {
    console.error("updateGuest error:", err.message);
    return res.status(500).json({ error: "Aggiornamento guest fallito" });
  }
};

// ▶ DELETE /deleteGuest/:guestId
const deleteGuest = async (req, res) => {
  try {
    const { guestId } = req.params;
    await db.collection("Guests").doc(guestId).delete();
    return res.json({ message: "Guest eliminato" });
  } catch (err) {
    console.error("deleteGuest error:", err.message);
    return res.status(500).json({ error: "Eliminazione guest fallita" });
  }
};

module.exports = { getGuests, addGuest, updateGuest, deleteGuest };
