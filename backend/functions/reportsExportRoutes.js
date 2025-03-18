const functions = require("firebase-functions");
const admin = require("firebase-admin");
const json2csv = require("json2csv").parse;
const excelJS = require("exceljs");
const PDFDocument = require("pdfkit");

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

// 📌 Esporta report in formato PDF, CSV, Excel
exports.exportReports = functions.https.onRequest(async (req, res) => {
  if (req.method !== "GET")
    return res.status(405).json({ error: "❌ Usa GET." });

  try {
    await authenticate(req);
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown_ip";
    await checkRateLimit(ip, 30, 10 * 60 * 1000);

    const { format, type } = req.query;

    if (!["pdf", "csv", "excel"].includes(format?.toLowerCase())) {
      return res.status(400).json({ error: "❌ Formato non valido." });
    }

    const snapshot = await db
      .collection("Reports")
      .where("type", "==", type)
      .get();
    if (snapshot.empty) {
      return res.status(404).json({ error: "⚠️ Nessun report trovato." });
    }

    const reports = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString() || "N/A",
    }));

    if (format === "csv") {
      const csv = json2csv(reports);
      res.setHeader("Content-disposition", "attachment; filename=report.csv");
      res.setHeader("Content-Type", "text/csv");
      return res.status(200).send(csv);
    }

    if (format === "excel") {
      const workbook = new excelJS.Workbook();
      const sheet = workbook.addWorksheet("Report");

      sheet.columns = Object.keys(reports[0]).map((key) => ({
        header: key,
        key,
      }));
      sheet.addRows(reports);

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader("Content-Disposition", "attachment; filename=report.xlsx");
      await workbook.xlsx.write(res);
      return res.end();
    }

    if (format === "pdf") {
      const doc = new PDFDocument();
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=report.pdf");
      doc.pipe(res);

      doc.fontSize(18).text("Report StayPro", { underline: true });
      reports.forEach((report) => {
        doc.moveDown();
        Object.entries(report).forEach(([key, value]) => {
          doc.fontSize(12).text(`${key}: ${value}`);
        });
      });

      doc.end();
      return;
    }

    res.status(400).json({ error: "❌ Formato non valido." });
  } catch (error) {
    functions.logger.error("❌ Errore esportazione report:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});
