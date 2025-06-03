const admin = require("firebase-admin");
const db = admin.firestore();

/**
 * 1. Entrate mensili (KPI)
 */
exports.getRevenueKPI = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "⛔ Solo admin autorizzati." });
  }

  console.log("📊 [getRevenueKPI] Avvio calcolo entrate mensili");
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

    console.log("✅ [getRevenueKPI] Totale entrate:", total);
    return res.json({ monthlyRevenue: total });
  } catch (error) {
    console.error("❌ Errore getRevenueKPI:", error);
    return res
      .status(500)
      .json({ message: "Errore nel calcolo delle entrate." });
  }
};

/**
 * 2. Abbonamenti attivi (KPI)
 */
exports.getActiveSubscriptions = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "⛔ Solo admin autorizzati." });
  }

  console.log("📦 [getActiveSubscriptions] Conteggio abbonamenti attivi");
  try {
    const usersSnap = await db
      .collection("users")
      .where("subscriptionStatus", "==", "active")
      .get();

    console.log("✅ [getActiveSubscriptions] Attivi:", usersSnap.size);
    return res.json({ activeSubscriptions: usersSnap.size });
  } catch (error) {
    console.error("❌ Errore getActiveSubscriptions:", error);
    return res
      .status(500)
      .json({ message: "Errore nel recupero abbonamenti." });
  }
};

/**
 * 3. Tasso di abbandono (KPI)
 */
exports.getChurnRate = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "⛔ Solo admin autorizzati." });
  }

  console.log("📉 [getChurnRate] Calcolo utenti disdetti");
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

    console.log("✅ [getChurnRate] Utenti disdetti:", snapshot.size);
    return res.json({ churnedUsers: snapshot.size });
  } catch (error) {
    console.error("❌ Errore getChurnRate:", error);
    return res.status(500).json({ message: "Errore nel calcolo churn rate." });
  }
};

/**
 * 4. Stato sistema (KPI dummy)
 */
exports.getSystemStatus = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "⛔ Solo admin autorizzati." });
  }

  console.log("🔧 [getSystemStatus] Recupero stato sistema");
  try {
    return res.json({
      apiUptime: "99.98%",
      lastBackup: "Oggi alle 02:30",
      systemLoad: "Basso",
      status: "✅ Tutto operativo",
    });
  } catch (error) {
    console.error("❌ Errore getSystemStatus:", error);
    return res.status(500).json({ message: "Errore stato sistema." });
  }
};

/**
 * 5. Informazioni utente (ruolo/piano/email)
 */
exports.getUserInfo = async (req, res) => {
  console.log("🔐 [getUserInfo] Recupero dati utente da req.user");
  try {
    const { uid } = req.user;
    console.log("✅ [getUserInfo] UID verificato:", uid);

    const doc = await db.collection("users").doc(uid).get();
    if (!doc.exists) {
      console.warn("⚠️ [getUserInfo] Utente non trovato:", uid);
      return res.status(404).json({ message: "Utente non trovato" });
    }

    const data = doc.data();
    console.log("✅ [getUserInfo] Ruolo:", data.role, " Piano:", data.plan);
    return res.status(200).json({
      uid,
      email: data.email,
      role: data.role,
      plan: data.plan,
    });
  } catch (error) {
    console.error("❌ Errore getUserInfo:", error);
    return res.status(500).json({ message: "Errore durante getUserInfo." });
  }
};

/**
 * 6. Statistiche uso IA (dummy)
 */
exports.getAIUsageStats = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "⛔ Solo admin autorizzati." });
  }

  console.log("🤖 [getAIUsageStats] Recupero dati IA");
  try {
    return res.json({
      totalRequests: 835,
      avgResponseTime: "1.2s",
      topFeature: "Auto Risposte Clienti",
    });
  } catch (error) {
    console.error("❌ Errore getAIUsageStats:", error);
    return res.status(500).json({ message: "Errore statistiche AI." });
  }
};

/**
 * 7. Logs di sistema (dummy)
 */
exports.getSystemLogs = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "⛔ Solo admin autorizzati." });
  }

  console.log("📋 [getSystemLogs] Invio log fittizi");
  try {
    return res.json([
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
  } catch (error) {
    console.error("❌ Errore getSystemLogs:", error);
    return res.status(500).json({ message: "Errore logs sistema." });
  }
};

/**
 * 8. Stato backup (dummy)
 */
exports.getBackupStatus = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "⛔ Solo admin autorizzati." });
  }

  console.log("💾 [getBackupStatus] Stato backup");
  try {
    return res.json({ status: "Ultimo backup: oggi alle 02:30" });
  } catch (error) {
    console.error("❌ Errore getBackupStatus:", error);
    return res.status(500).json({ message: "Errore stato backup." });
  }
};

/**
 * 9. Avvia backup manuale (dummy)
 */
exports.startBackup = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "⛔ Solo admin autorizzati." });
  }

  console.log("🚀 [startBackup] Avvio backup manuale");
  try {
    return res.status(200).json({ message: "Backup manuale avviato." });
  } catch (error) {
    console.error("❌ Errore startBackup:", error);
    return res.status(500).json({ message: "Errore avvio backup." });
  }
};
