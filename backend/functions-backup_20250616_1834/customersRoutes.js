// 📁 functions/customersRoutes.js
const express = require("express");
const admin = require("firebase-admin");
const { verifyToken } = require("../middlewares/verifyToken");

const router = express.Router();
const db = admin.firestore();

router.use(verifyToken);

// ✅ GET /customers → Dati clienti dell’utente
router.get("/", async (req, res) => {
  try {
    const snapshot = await db
      .collection("Customers")
      .where("userId", "==", req.userId)
      .get();

    let totalCustomers = 0,
      leads = 0,
      vipCustomers = 0;
    let recentCustomers = [];

    snapshot.forEach((doc) => {
      const c = doc.data();
      totalCustomers++;
      if (c.type === "lead") leads++;
      if (c.isVIP) vipCustomers++;

      const lastBooking = c.lastBooking?.toDate?.() || null;
      if (lastBooking) {
        recentCustomers.push({
          id: doc.id,
          name: c.name || "N/A",
          email: c.email || "N/A",
          phone: c.phone || "N/A",
          lastBooking: lastBooking.toISOString(),
        });
      }
    });

    recentCustomers = recentCustomers
      .sort((a, b) => new Date(b.lastBooking) - new Date(a.lastBooking))
      .slice(0, 5);

    res.json({ totalCustomers, leads, vipCustomers, recentCustomers });
  } catch (err) {
    console.error("❌ Errore clienti:", err);
    res.status(500).json({ error: "Errore interno" });
  }
});

// ✅ POST /customers → Aggiungi cliente
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, type, isVIP, lastBooking } = req.body;
    if (!name || !email || !phone) {
      return res.status(400).json({ error: "❌ Campi obbligatori mancanti." });
    }

    const data = {
      userId: req.userId,
      name,
      email,
      phone,
      type: type || "regular",
      isVIP: isVIP || false,
      lastBooking: lastBooking ? new Date(lastBooking) : null,
      createdAt: new Date(),
    };

    const docRef = await db.collection("Customers").add(data);
    return res.json({ id: docRef.id, ...data });
  } catch (err) {
    console.error("❌ Errore POST cliente:", err);
    res.status(500).json({ error: "Errore interno" });
  }
});

// ✅ PUT /customers → Aggiorna cliente
router.put("/", async (req, res) => {
  try {
    const { customerId, updates } = req.body;
    if (!customerId || !updates) {
      return res
        .status(400)
        .json({ error: "❌ customerId e updates richiesti." });
    }

    const ref = db.collection("Customers").doc(customerId);
    const doc = await ref.get();
    if (!doc.exists || doc.data().userId !== req.userId) {
      return res.status(403).json({ error: "❌ Accesso non autorizzato." });
    }

    if (updates.lastBooking)
      updates.lastBooking = new Date(updates.lastBooking);

    await ref.update({
      ...updates,
      updatedAt: new Date(),
    });

    res.json({ message: "✅ Cliente aggiornato." });
  } catch (err) {
    console.error("❌ Errore PUT cliente:", err);
    res.status(500).json({ error: "Errore interno" });
  }
});

// ✅ DELETE /customers → Elimina cliente
router.delete("/", async (req, res) => {
  try {
    const { customerId } = req.query;
    if (!customerId) {
      return res.status(400).json({ error: "❌ customerId richiesto." });
    }

    const ref = db.collection("Customers").doc(customerId);
    const doc = await ref.get();
    if (!doc.exists || doc.data().userId !== req.userId) {
      return res.status(403).json({ error: "❌ Accesso non autorizzato." });
    }

    await ref.delete();
    res.json({ message: "✅ Cliente eliminato." });
  } catch (err) {
    console.error("❌ Errore DELETE cliente:", err);
    res.status(500).json({ error: "Errore interno" });
  }
});

module.exports = router;
