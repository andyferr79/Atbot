const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Busboy = require("busboy");

if (!admin.apps.length) {
  admin.initializeApp();
}

exports.importFinancialData = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ error: "❌ Metodo non consentito. Usa POST." });
  }

  // ✅ Verifica token Firebase
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(403).json({ error: "❌ Token mancante" });
  }

  try {
    await admin.auth().verifyIdToken(token);
  } catch (error) {
    functions.logger.error("❌ Token non valido:", error);
    return res.status(401).json({ error: "❌ Token non valido" });
  }

  // ✅ Rate limiting su Firestore
  const db = admin.firestore();
  const ip =
    req.headers["x-forwarded-for"] ||
    req.connection?.remoteAddress ||
    "unknown_ip";
  const now = Date.now();
  const rateDocRef = db.collection("RateLimits").doc(ip);
  const rateDoc = await rateDocRef.get();

  if (rateDoc.exists) {
    const requestCount = rateDoc.data().count || 0;
    const windowStart = rateDoc.data().windowStart || 0;

    if (now - windowStart < 15 * 60 * 1000 && requestCount >= 20) {
      return res
        .status(429)
        .json({ error: "❌ Troppe richieste di upload. Riprova più tardi." });
    }

    if (now - windowStart >= 15 * 60 * 1000) {
      await rateDocRef.set({ count: 1, windowStart: now });
    } else {
      await rateDocRef.update({ count: requestCount + 1 });
    }
  } else {
    await rateDocRef.set({ count: 1, windowStart: now });
  }

  // ✅ Gestione upload con Busboy
  const busboy = Busboy({ headers: req.headers });
  let uploadFileBuffer = null;
  let fileInfo = {};

  busboy.on("file", (fieldname, file, info) => {
    const { filename, encoding, mimeType } = info;

    const allowedTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (!allowedTypes.includes(info.mimeType)) {
      file.resume();
      return res.status(400).json({ error: "❌ Formato file non supportato." });
    }

    fileInfo = { filename, mimetype: info.mimeType };

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

    try {
      functions.logger.info(`✅ File ricevuto: ${fileInfo.filename}`);

      const financialData = {
        fileName: fileInfo.filename,
        uploadedAt: new Date(),
        status: "pending",
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
    } catch (error) {
      functions.logger.error(
        "❌ Errore nell'importazione dati finanziari:",
        error
      );
      return res.status(500).json({
        error: "Errore nell'importazione dati finanziari",
        details: error.message,
      });
    }
  });

  busboy.on("error", (error) => {
    functions.logger.error("❌ Errore nella gestione upload file:", error);
    return res.status(500).json({ error: "Errore durante l'upload del file" });
  });

  busboy.end(req.rawBody);
});
