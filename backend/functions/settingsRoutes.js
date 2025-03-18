const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// ✅ Middleware autenticazione riutilizzabile
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

// ✅ Middleware Rate Limiting avanzato
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

// ✅ Funzione generica per recuperare impostazioni
async function getSettings(docName) {
  const doc = await db.collection("Settings").doc(docName).get();
  if (!doc.exists)
    throw { status: 404, message: "⚠️ Impostazioni non trovate." };
  return doc.data();
}

// ✅ Funzione generica per aggiornare impostazioni
async function updateSettings(docName, data) {
  await db.collection("Settings").doc(docName).set(data, { merge: true });
}

// 📌 GET/PUT - Preferenze generali
exports.preferencesSettings = functions.https.onRequest(async (req, res) => {
  try {
    await authenticate(req);
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown_ip";
    await checkRateLimit(ip, 50, 10 * 60 * 1000);

    if (req.method === "GET") {
      const preferences = await getSettings("preferences");
      res.json(preferences);
    } else if (req.method === "PUT") {
      const preferences = req.body;
      if (!preferences || typeof preferences !== "object") {
        return res
          .status(400)
          .json({ error: "❌ Dati preferenze non validi." });
      }
      await updateSettings("preferences", preferences);
      res.json({ message: "✅ Preferenze aggiornate." });
    } else {
      res.status(405).json({ error: "❌ Metodo non consentito." });
    }
  } catch (error) {
    functions.logger.error("❌ Errore preferenze:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

// 📌 GET/PUT - Configurazione struttura
exports.structureSettings = functions.https.onRequest(async (req, res) => {
  try {
    await authenticate(req);
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown_ip";
    await checkRateLimit(ip, 50, 10 * 60 * 1000);

    if (req.method === "GET") {
      const structure = await getSettings("structure");
      res.json(structure);
    } else if (req.method === "PUT") {
      const structure = req.body;
      if (!structure || typeof structure !== "object") {
        return res.status(400).json({ error: "❌ Dati struttura non validi." });
      }
      await updateSettings("structure", structure);
      res.json({ message: "✅ Configurazione struttura aggiornata." });
    } else {
      res.status(405).json({ error: "❌ Metodo non consentito." });
    }
  } catch (error) {
    functions.logger.error("❌ Errore configurazione struttura:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

// 📌 GET/PUT - Impostazioni sicurezza
exports.securitySettings = functions.https.onRequest(async (req, res) => {
  try {
    await authenticate(req);
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown_ip";
    await checkRateLimit(ip, 50, 10 * 60 * 1000);

    if (req.method === "GET") {
      const security = await getSettings("security");
      res.json(security);
    } else if (req.method === "PUT") {
      const security = req.body;
      if (!security || typeof security !== "object") {
        return res.status(400).json({ error: "❌ Dati sicurezza non validi." });
      }
      await updateSettings("security", security);
      res.json({ message: "✅ Impostazioni sicurezza aggiornate." });
    } else {
      res.status(405).json({ error: "❌ Metodo non consentito." });
    }
  } catch (error) {
    functions.logger.error("❌ Errore impostazioni sicurezza:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});
