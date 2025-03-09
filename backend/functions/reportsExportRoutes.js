const functions = require("firebase-functions");
const admin = require("firebase-admin");
const json2csv = require("json2csv").parse;
const excelJS = require("exceljs");
const PDFDocument = require("pdfkit");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Middleware verifica token
const verifyToken = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    res.status(403).json({ error: "❌ Token mancante" });
    return false;
  }
  try {
    await admin.auth().verifyIdToken(token);
    return true;
  } catch (error) {
    functions.logger.error("❌ Token non valido:", error);
    res.status(401).json({ error: "❌ Token non valido" });
    return false;
  }
};

// Middleware rate limiting Firestore
const checkRateLimit = async (req, res, windowMs = 10 * 60 * 1000) => {
  const ip =
    req.headers["x-forwarded-for"] ||
    req.connection?.remoteAddress ||
    "unknown_ip";
  const now = Date.now();
  const rateDocRef = db.collection("RateLimits").doc(ip);
  const rateDoc = await rateDocRef.get();

  if (rateDoc.exists && now - rateDoc.data().lastRequest < windowMs) {
    res
      .status(429)
      .json({ error: "❌ Troppe richieste. Attendi prima di riprovare." });
    return false;
  }

  await rateDocRef.set({ lastRequest: now });
  return true;
};

// 📌 Esportazione report in PDF, CSV, Excel
exports.exportReports = functions.https.onRequest(async (req, res) => {
  if (req.method !== "GET")
    return res.status(405).json({ error: "❌ Usa GET." });
  if (!(await verifyToken(req, res))) return;
  if (!(await checkRateLimit(req, res, 10 * 60 * 1000))) return;

  const { format, reportType } = req.query;
  const allowedFormats = ["pdf", "csv", "excel"];

  if (!format || !allowedFormats.includes(format.toLowerCase())) {
    return res
      .status(400)
      .json({ error: "❌ Formato non valido. Usa 'pdf', 'csv' o 'excel'." });
  }

  try {
    const snapshot = await db
      .collection("Reports")
      .where("type", "==", reportType)
      .get();
    if (snapshot.empty) {
      return res.status(404).json({ error: "❌ Nessun report trovato." });
    }

    const reports = snapshot.docs.map((doc) => doc.data());

    if (format.toLowerCase() === "csv") {
      const csv = json2csv(reports);
      res.setHeader("Content-disposition", "attachment; filename=report.csv");
      res.setHeader("Content-Type", "text/csv");
      res.status(200).send(csv);
    } else if (format.toLowerCase() === "excel") {
      const workbook = new excelJS.Workbook();
      const worksheet = workbook.addWorksheet("Report");

      worksheet.columns = Object.keys(reports[0]).map((key) => ({
        header: key,
        key,
      }));
      reports.forEach((data) => worksheet.addRow(data));

      res.setHeader("Content-disposition", "attachment; filename=report.xlsx");
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      await workbook.xlsx.write(res);
      res.end();
    } else if (format.toLowerCase() === "pdf") {
      const doc = new PDFDocument();
      res.setHeader("Content-disposition", "attachment; filename=report.pdf");
      res.setHeader("Content-Type", "application/pdf");
      doc.pipe(res);
      doc.fontSize(16).text("Report Esportato", { underline: true }).moveDown();

      reports.forEach((report) => {
        Object.entries(report).forEach(([key, value]) => {
          doc.fontSize(12).text(`${key}: ${value}`);
        });
        doc.moveDown();
      });
      doc.end();
    }
  } catch (error) {
    functions.logger.error("❌ Errore esportazione report:", error);
    res.status(500).json({
      error: "Errore nell'esportazione del report",
      details: error.message,
    });
  }
});
