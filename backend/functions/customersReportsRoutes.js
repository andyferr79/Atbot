const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// ✅ Middleware autenticazione riutilizzabile
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

// ✅ Middleware Rate Limiting riutilizzabile
async function checkRateLimit(ip, maxRequests, windowMs) {
  const rateDocRef = db.collection("RateLimits").doc(ip);
  const rateDoc = await rateDocRef.get();
  const now = Date.now();

  let requestTimestamps = rateDoc.exists ? rateDoc.data().requests || [] : [];
  requestTimestamps = requestTimestamps.filter((ts) => now - ts < windowMs);

  if (requestTimestamps.length >= maxRequests) {
    throw { status: 429, message: "❌ Troppe richieste. Riprova più tardi." };
  }

  requestTimestamps.push(now);
  await rateDocRef.set({ requests: requestTimestamps });
}

// 📌 GET - Recuperare report clienti
exports.getCustomersReports = functions.https.onRequest(async (req, res) => {
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

    const snapshot = await db.collection("CustomersReports").get();

    const reports = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString() || "N/A",
    }));

    return res.json(reports);
  } catch (error) {
    functions.logger.error("❌ Errore recupero report clienti:", error);
    return res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

// 📌 POST - Aggiungere un nuovo report cliente
exports.addCustomerReport = functions.https.onRequest(async (req, res) => {
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

    const { name, email, phone, bookings, structureId, structureType } =
      req.body;

    if (!name || !email || !phone || bookings === undefined) {
      return res
        .status(400)
        .json({
          error: "❌ Tutti i campi obbligatori devono essere compilati.",
        });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "❌ Email non valida." });
    }

    if (!/^[0-9\-\+\s\(\)]{7,15}$/.test(phone)) {
      return res
        .status(400)
        .json({ error: "❌ Numero di telefono non valido." });
    }

    const parsedBookings = parseInt(bookings, 10);
    if (isNaN(parsedBookings) || parsedBookings < 0) {
      return res
        .status(400)
        .json({ error: "❌ Numero di prenotazioni non valido." });
    }

    const newReport = {
      name,
      email,
      phone,
      bookings: parsedBookings,
      structureId: structureId || null,
      structureType: structureType || "Generico",
      createdAt: new Date(),
    };

    const docRef = await db.collection("CustomersReports").add(newReport);
    return res.json({ id: docRef.id, ...newReport });
  } catch (error) {
    functions.logger.error("❌ Errore aggiunta report cliente:", error);
    return res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

// 📌 PUT - Aggiornare un report cliente
exports.updateCustomerReport = functions.https.onRequest(async (req, res) => {
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
      return res
        .status(400)
        .json({ error: "❌ reportId e aggiornamenti richiesti." });
    }

    await db.collection("CustomersReports").doc(reportId).update(updates);
    return res.json({ message: "✅ Report cliente aggiornato." });
  } catch (error) {
    functions.logger.error("❌ Errore aggiornamento report cliente:", error);
    return res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

// 📌 DELETE - Eliminare un report cliente
exports.deleteCustomerReport = functions.https.onRequest(async (req, res) => {
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

    await db.collection("CustomersReports").doc(reportId).delete();
    return res.json({ message: "✅ Report cliente eliminato." });
  } catch (error) {
    functions.logger.error("❌ Errore eliminazione report cliente:", error);
    return res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});
