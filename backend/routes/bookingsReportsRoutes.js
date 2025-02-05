const express = require("express");
const router = express.Router();
const admin = require("../firebase"); // ✅ Importa Firebase correttamente

// ✅ Endpoint per ottenere i dati delle prenotazioni per il report
router.get("/", async (req, res) => {
  try {
    const snapshot = await admin
      .firestore()
      .collection("Bookings") // 🔥 Corretta la collezione da "bookingsReports" a "Bookings"
      .get();

    if (snapshot.empty) {
      console.log("⚠️ Nessuna prenotazione trovata.");
      return res.json([]); // ✅ Se non ci sono dati, restituisce un array vuoto
    }

    const bookingsReports = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log("✅ Dati prenotazioni recuperati:", bookingsReports);
    res.json(bookingsReports);
  } catch (error) {
    console.error("❌ Errore nel recupero del report prenotazioni:", error);
    res
      .status(500)
      .json({ error: "Errore nel recupero del report prenotazioni" });
  }
});

module.exports = router;
