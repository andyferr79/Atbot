const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// ✅ Middleware autenticazione
async function authenticate(req) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) throw { status: 403, message: "❌ Token mancante" };
  try {
    req.user = await admin.auth().verifyIdToken(token);
  } catch (error) {
    functions.logger.error("❌ Token non valido:", error);
    throw { status: 401, message: "❌ Token non valido" };
  }
}

// ✅ Middleware Rate Limiting
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

// 📌 GET - Recupera tutti i report fornitori
exports.getSuppliersReports = functions.https.onRequest(async (req, res) => {
  if (req.method !== "GET")
    return res.status(405).json({ error: "❌ Usa GET." });

  try {
    await authenticate(req);
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown_ip";
    await checkRateLimit(ip, 50, 10 * 60 * 1000);

    const snapshot = await db.collection("SuppliersReports").get();
    const reports = snapshot.docs.map((doc) => ({
      id: doc.id,
      supplierName: doc.data().supplierName || "N/A",
      totalSpent: doc.data().totalSpent || 0,
      contractStatus: doc.data().contractStatus || "unknown",
      reportDate: doc.data().reportDate?.toDate().toISOString() || "N/A",
      createdAt: doc.data().createdAt?.toDate().toISOString() || "N/A",
    }));

    res.json({ reports });
  } catch (error) {
    functions.logger.error("❌ Errore recupero report fornitori:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

// 📌 POST - Aggiunge un nuovo report fornitore
exports.addSupplierReport = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST")
    return res.status(405).json({ error: "❌ Usa POST." });

  try {
    await authenticate(req);
    const { supplierName, totalSpent, contractStatus, reportDate } = req.body;

    if (!supplierName || !totalSpent || !contractStatus || !reportDate) {
      return res.status(400).json({ error: "❌ Campi obbligatori mancanti." });
    }

    const parsedTotalSpent = parseFloat(totalSpent);
    if (isNaN(parsedTotalSpent) || parsedTotalSpent <= 0) {
      return res
        .status(400)
        .json({ error: "❌ Il totale speso deve essere positivo." });
    }

    const newReport = {
      supplierName,
      totalSpent: parsedTotalSpent,
      contractStatus,
      reportDate: new Date(reportDate),
      createdAt: new Date(),
    };

    const docRef = await db.collection("SuppliersReports").add(newReport);
    res.json({ id: docRef.id, ...newReport });
  } catch (error) {
    functions.logger.error("❌ Errore aggiunta report:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

// 📌 PUT - Aggiorna report fornitori
exports.updateSuppliersReport = functions.https.onRequest(async (req, res) => {
  if (req.method !== "PUT")
    return res.status(405).json({ error: "❌ Usa PUT." });

  try {
    await authenticate(req);
    const { reportId, updates } = req.body;
    if (!reportId || !updates) {
      return res
        .status(400)
        .json({ error: "❌ reportId e aggiornamenti richiesti." });
    }

    if (updates.reportDate) updates.reportDate = new Date(updates.reportDate);
    updates.updatedAt = new Date();

    await db.collection("SuppliersReports").doc(reportId).update(updates);

    res.json({ message: "✅ Report aggiornato con successo." });
  } catch (error) {
    functions.logger.error("❌ Errore aggiornamento report fornitori:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

// 📌 DELETE - Elimina report fornitori
exports.deleteSuppliersReport = functions.https.onRequest(async (req, res) => {
  if (req.method !== "DELETE")
    return res.status(405).json({ error: "❌ Usa DELETE." });

  try {
    await authenticate(req);
    const { reportId } = req.query;
    if (!reportId) {
      return res.status(400).json({ error: "❌ reportId richiesto." });
    }

    await db.collection("SuppliersReports").doc(reportId).delete();

    res.json({ message: "✅ Report eliminato con successo." });
  } catch (error) {
    functions.logger.error("❌ Errore eliminazione report fornitori:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});
