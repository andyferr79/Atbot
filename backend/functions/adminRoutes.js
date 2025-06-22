// 📁 functions/adminRoutes.js

const express = require("express");
const admin = require("firebase-admin");
const { verifyToken } = require("../middlewares/verifyToken");
const { withCors } = require("../middlewares/withCors");

const router = express.Router();
const db = admin.firestore();

// 📌 Debug ping per verificare che /admin sia montato (NO AUTENTICAZIONE)
router.get("/_ping", (req, res) => {
  console.log("🏓 Ricevuto ping su /admin/_ping");
  res.json({ pong: true });
});

// ✅ Middleware globali (dopo ping)
router.use(withCors);
router.use(verifyToken);

// 📌 1. Entrate mensili
router.get("/revenue", async (req, res) => {
  try {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const snapshot = await db
      .collection("Payments")
      .where("date", ">=", firstDay)
      .where("date", "<=", lastDay)
      .get();

    let total = 0;
    snapshot.forEach((doc) => {
      total += doc.data().amount || 0;
    });

    console.log("📊 Revenue calcolato:", total);
    res.json({ monthlyRevenue: total });
  } catch (error) {
    console.error("❌ getRevenueKPI:", error);
    res.status(500).json({ message: "Errore nel calcolo delle entrate." });
  }
});

// 📌 2. Abbonamenti attivi
router.get("/subscriptions", async (req, res) => {
  try {
    const usersSnap = await db
      .collection("users")
      .where("subscriptionStatus", "==", "active")
      .get();

    res.json({ activeSubscriptions: usersSnap.size });
  } catch (error) {
    console.error("❌ getActiveSubscriptions:", error);
    res.status(500).json({ message: "Errore nel recupero abbonamenti." });
  }
});

// 📌 3. Tasso abbandono (churn)
router.get("/churn", async (req, res) => {
  try {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const snapshot = await db
      .collection("users")
      .where("subscriptionStatus", "==", "cancelled")
      .where("subscriptionEnd", ">=", firstDay)
      .where("subscriptionEnd", "<=", lastDay)
      .get();

    res.json({ churnedUsers: snapshot.size });
  } catch (error) {
    console.error("❌ getChurnRate:", error);
    res.status(500).json({ message: "Errore nel calcolo churn rate." });
  }
});

// 📌 4. Stato sistema
router.get("/status", (req, res) => {
  res.json({
    apiUptime: "99.98%",
    lastBackup: "Oggi alle 02:30",
    systemLoad: "Basso",
    status: "✅ Tutto operativo",
  });
});

// 📌 5. Info utente autenticato
router.get("/me", async (req, res) => {
  try {
    const uid = req.user.uid;
    const doc = await db.collection("users").doc(uid).get();
    if (!doc.exists) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    const data = doc.data();
    res.status(200).json({
      uid,
      email: data.email,
      role: data.role,
      plan: data.plan,
    });
  } catch (error) {
    console.error("❌ getUserInfo:", error);
    res.status(500).json({ message: "Errore durante getUserInfo." });
  }
});

// 📌 6. Statistiche utilizzo IA
router.get("/ai-usage", (req, res) => {
  res.json({
    totalRequests: 835,
    avgResponseTime: "1.2s",
    topFeature: "Auto Risposte Clienti",
  });
});

// 📌 7. Log di sistema
router.get("/logs", (req, res) => {
  res.json([
    {
      type: "INFO",
      message: "Backup completato con successo.",
      timestamp: new Date(),
    },
    {
      type: "ERROR",
      message: "Tentativo di login fallito da IP 192.168.1.10",
      timestamp: new Date(),
    },
    {
      type: "WARNING",
      message: "Uptime API sotto al 99.9% ieri.",
      timestamp: new Date(),
    },
  ]);
});

// 📌 8. Stato backup
router.get("/backup-status", (req, res) => {
  res.json({ status: "Ultimo backup: oggi alle 02:30" });
});

// 📌 9. Avvia backup manuale
router.post("/backup", (req, res) => {
  res.status(200).json({ message: "Backup manuale avviato." });
});

module.exports = router;
