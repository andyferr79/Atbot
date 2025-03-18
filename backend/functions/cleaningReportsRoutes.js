const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// ✅ Middleware autenticazione (riutilizzabile)
async function authenticate(req) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    throw { status: 403, message: "❌ Token mancante" };
  }
  try {
    return await admin.auth().verifyIdToken(token);
  } catch (error) {
    functions.logger.error("❌ Token non valido:", error);
    throw { status: 401, message: "❌ Token non valido" };
  }
}

// ✅ Middleware Rate Limiting (riutilizzabile)
async function checkRateLimit(ip, maxRequests, windowMs) {
  const rateDocRef = db.collection("RateLimits").doc(ip);
  const rateDoc = await rateDocRef.get();
  const now = Date.now();

  if (rateDoc.exists) {
    const requestTimestamps = rateDoc.data().requests || [];
    const recentRequests = requestTimestamps.filter(
      (timestamp) => now - timestamp < windowMs
    );

    if (recentRequests.length >= maxRequests) {
      throw { status: 429, message: "❌ Troppe richieste. Riprova più tardi." };
    }

    recentRequests.push(now);
    await rateDocRef.set({ requests: recentRequests });
  } else {
    await rateDocRef.set({ requests: [now] });
  }
}

// 📌 GET - Recupera i report delle pulizie
exports.getCleaningReports = functions.https.onRequest(async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "❌ Usa GET." });
  }

  try {
    await authenticate(req);
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown_ip";
    await checkRateLimit(ip, 50, 10 * 60 * 1000);

    const { structureId } = req.query;
    let query = db.collection("CleaningReports");
    if (structureId) {
      query = query.where("structureId", "==", structureId);
    }

    const snapshot = await query.get();
    const reports = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      lastCleaned: doc.data().lastCleaned?.toDate().toISOString() || "N/A",
      createdAt: doc.data().createdAt?.toDate().toISOString() || "N/A",
    }));

    return res.json(reports);
  } catch (error) {
    functions.logger.error("❌ Errore nel recupero dati pulizie:", error);
    const status = error.status || 500;
    return res
      .status(status)
      .json({ error: error.message || "Errore interno" });
  }
});

// 📌 POST - Aggiunge un nuovo report di pulizia
exports.addCleaningReport = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "❌ Usa POST." });
  }

  try {
    await authenticate(req);
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown_ip";
    await checkRateLimit(ip, 50, 10 * 60 * 1000);

    const {
      structureId,
      structureType,
      roomNumber,
      address,
      status,
      lastCleaned,
      assignedTo,
    } = req.body;

    if (
      !structureId ||
      !structureType ||
      !roomNumber ||
      !status ||
      !lastCleaned ||
      !assignedTo
    ) {
      return res.status(400).json({ error: "❌ Campi obbligatori mancanti" });
    }

    const newReport = {
      structureId,
      structureType,
      roomNumber,
      address: ["appartamento", "villa"].includes(structureType)
        ? address
        : null,
      status,
      lastCleaned: new Date(lastCleaned),
      assignedTo,
      createdAt: new Date(),
    };

    const docRef = await db.collection("CleaningReports").add(newReport);
    return res.json({ id: docRef.id, ...newReport });
  } catch (error) {
    functions.logger.error("❌ Errore aggiunta report pulizia:", error);
    const status = error.status || 500;
    return res
      .status(status)
      .json({ error: error.message || "Errore interno" });
  }
});

// 📌 UPDATE - Aggiorna report pulizie
exports.updateCleaningReport = functions.https.onRequest(async (req, res) => {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "❌ Usa PUT." });
  }

  try {
    await authenticate(req);
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown_ip";
    await checkRateLimit(ip, 50, 10 * 60 * 1000);

    const { reportId, updates } = req.body;
    if (!reportId || !updates) {
      return res.status(400).json({ error: "❌ reportId e updates richiesti" });
    }

    if (updates.lastCleaned)
      updates.lastCleaned = new Date(updates.lastCleaned);

    await db.collection("CleaningReports").doc(reportId).update(updates);
    return res.json({ message: "✅ Report aggiornato." });
  } catch (error) {
    functions.logger.error("❌ Errore aggiornamento report pulizia:", error);
    const status = error.status || 500;
    return res
      .status(status)
      .json({ error: error.message || "Errore interno" });
  }
});

// 📌 DELETE - Cancella un report pulizia
exports.deleteCleaningReport = functions.https.onRequest(async (req, res) => {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "❌ Usa DELETE." });
  }

  try {
    await authenticate(req);
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown_ip";
    await checkRateLimit(ip, 50, 10 * 60 * 1000);

    const { reportId } = req.query;
    if (!reportId) {
      return res.status(400).json({ error: "❌ reportId richiesto." });
    }

    await db.collection("CleaningReports").doc(reportId).delete();
    return res.json({ message: "✅ Report cancellato." });
  } catch (error) {
    functions.logger.error("❌ Errore cancellazione report pulizia:", error);
    const status = error.status || 500;
    return res
      .status(status)
      .json({ error: error.message || "Errore interno" });
  }
});
