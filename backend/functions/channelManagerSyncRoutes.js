const express = require("express");
const admin = require("firebase-admin");

const router = express.Router();
const db = admin.firestore();

// ✅ Middleware di autenticazione token (riutilizzabile)
const authenticateRequest = async (req) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) throw { status: 403, message: "❌ Token mancante" };

  try {
    return await admin.auth().verifyIdToken(token);
  } catch (error) {
    console.error("❌ Token non valido:", error);
    throw { status: 401, message: "❌ Token non valido" };
  }
};

// ✅ Rate Limiting per IP (massimo 30 richieste ogni 10 minuti)
const checkRateLimit = async (
  ip,
  maxRequests = 30,
  windowMs = 10 * 60 * 1000
) => {
  const ref = db.collection("RateLimits").doc(ip);
  const snap = await ref.get();
  const now = Date.now();

  if (snap.exists) {
    const requests = snap.data().requests || [];
    const recent = requests.filter((t) => now - t < windowMs);

    if (recent.length >= maxRequests) {
      throw {
        status: 429,
        message: "❌ Troppe richieste. Attendi prima di riprovare.",
      };
    }

    recent.push(now);
    await ref.set({ requests: recent });
  } else {
    await ref.set({ requests: [now] });
  }
};

// 📌 POST /channel-manager/sync-ota → Avvia sync globale OTA
router.post("/sync-ota", async (req, res) => {
  try {
    await authenticateRequest(req);

    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown_ip";
    await checkRateLimit(ip);

    await db.collection("ChannelManager").doc("sync_status").set({
      status: "syncing",
      lastSync: admin.firestore.Timestamp.now(),
      requestedBy: ip,
    });

    console.log(`✅ Sync OTA avviata da ${ip}`);
    res.json({ message: "✅ Sincronizzazione avviata con successo!" });
  } catch (err) {
    console.error("❌ Errore syncOTA:", err);
    res
      .status(err.status || 500)
      .json({ error: err.message || "Errore interno del server." });
  }
});

module.exports = router;
