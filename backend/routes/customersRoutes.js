const express = require("express");
const router = express.Router();
const admin = require("../firebase"); // Connessione a Firestore

// 📌 API per ottenere i dati dei clienti
router.get("/", async (req, res) => {
  try {
    const db = admin.firestore();
    const customersSnapshot = await db.collection("Customers").get();

    if (customersSnapshot.empty) {
      return res.json({
        totalCustomers: 0,
        leads: 0,
        vipCustomers: 0,
        recentCustomers: [],
      });
    }

    let totalCustomers = 0;
    let leads = 0;
    let vipCustomers = 0;
    let recentCustomers = [];

    customersSnapshot.forEach((doc) => {
      const customer = doc.data();
      totalCustomers++;

      if (customer.type === "lead") leads++;
      if (customer.isVIP) vipCustomers++;

      recentCustomers.push({
        id: doc.id,
        name: customer.name || "N/A",
        email: customer.email || "N/A",
        phone: customer.phone || "N/A",
        lastBooking: customer.lastBooking || "N/A",
      });
    });

    // Mantiene solo gli ultimi 5 clienti
    recentCustomers = recentCustomers
      .sort((a, b) => new Date(b.lastBooking) - new Date(a.lastBooking))
      .slice(0, 5);

    res.json({
      totalCustomers,
      leads,
      vipCustomers,
      recentCustomers,
    });
  } catch (error) {
    console.error("❌ Errore nel recupero dei clienti:", error);
    res.status(500).json({ error: "Errore nel recupero dei clienti" });
  }
});

module.exports = router;
