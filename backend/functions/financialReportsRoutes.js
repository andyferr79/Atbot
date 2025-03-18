const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Busboy = require("busboy");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// ✅ Middleware autenticazione riutilizzabile
async function authenticate(req) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) throw { status: 403, message: "❌ Token mancante" };
  try {
    return await admin.auth().verifyIdToken(token);
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

// 📌 POST - Importare dati finanziari (Upload)
exports.importFinancialData = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "❌ Usa POST." });
  }

  try {
    await authenticate(req);
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown_ip";
    await checkRateLimit(ip, 20, 15 * 60 * 1000);

    const busboy = Busboy({ headers: req.headers });
    let uploadFileBuffer = null;
    let fileInfo = {};

    busboy.on("file", (fieldname, file, info) => {
      const { filename, mimeType } = info;
      const allowedTypes = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];

      if (!allowedTypes.includes(mimeType)) {
        file.resume();
        return res
          .status(400)
          .json({ error: "❌ Formato file non supportato." });
      }

      fileInfo = { filename, mimeType };
      const chunks = [];
      file.on("data", (chunk) => chunks.push(chunk));
      file.on("end", () => {
        uploadFileBuffer = Buffer.concat(chunks);
      });
    });

    busboy.on("finish", async () => {
      if (!uploadFileBuffer) {
        return res.status(400).json({ error: "❌ Nessun file caricato." });
      }

      const financialData = {
        fileName: fileInfo.filename,
        status: "pending",
        uploadedAt: new Date(),
        processedAt: null,
      };

      const docRef = await db.collection("FinancialReports").add(financialData);

      // Simulazione elaborazione
      setTimeout(async () => {
        await db.collection("FinancialReports").doc(docRef.id).update({
          status: "processed",
          processedAt: new Date(),
        });
        functions.logger.info(`✅ File ${fileInfo.filename} elaborato.`);
      }, 5000);

      return res.json({
        message: "✅ Dati finanziari importati con successo",
        reportId: docRef.id,
        uploadedAt: financialData.uploadedAt.toISOString(),
      });
    });

    busboy.end(req.rawBody);
  } catch (error) {
    functions.logger.error("❌ Errore import dati finanziari:", error);
    return res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

// 📌 GET - Ottenere tutti i report finanziari
exports.getFinancialReports = functions.https.onRequest(async (req, res) => {
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

    const snapshot = await db.collection("FinancialReports").get();
    const reports = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      uploadedAt: doc.data().uploadedAt?.toDate().toISOString(),
      processedAt: doc.data().processedAt?.toDate().toISOString() || null,
    }));

    return res.json(reports);
  } catch (error) {
    functions.logger.error("❌ Errore recupero report finanziari:", error);
    return res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

// 📌 DELETE - Eliminare un report finanziario
exports.deleteFinancialReport = functions.https.onRequest(async (req, res) => {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "❌ Usa DELETE." });
  }

  try {
    await authenticate(req);
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown_ip";
    await checkRateLimit(ip, 20, 10 * 60 * 1000);

    const { reportId } = req.query;
    if (!reportId) {
      return res.status(400).json({ error: "❌ reportId richiesto." });
    }

    await db.collection("FinancialReports").doc(reportId).delete();
    return res.json({ message: "✅ Report finanziario eliminato." });
  } catch (error) {
    functions.logger.error("❌ Errore eliminazione report finanziario:", error);
    return res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});
