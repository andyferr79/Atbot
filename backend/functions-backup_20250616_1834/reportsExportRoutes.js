// ✅ reportsExportRoutes.js – Compatibile Express Gen 2
const express = require("express");
const admin = require("firebase-admin");
const json2csv = require("json2csv").parse;
const excelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const { withCors } = require("./middlewares/withCors");
const { verifyToken } = require("./middlewares/verifyToken");
const rateLimit = require("express-rate-limit");

const router = express.Router();
const db = admin.firestore();

// ✅ Middleware rate limit fuori dalla route (creato 1 sola volta)
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: "Troppe richieste. Riprova più tardi.",
  standardHeaders: true,
  legacyHeaders: false,
});

// 📌 GET /reports-export?format=pdf|csv|excel&type=...
router.get("/", withCors, verifyToken, limiter, async (req, res) => {
  try {
    const { format, type } = req.query;

    if (!format || !["pdf", "csv", "excel"].includes(format.toLowerCase())) {
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

    return res.status(400).json({ error: "❌ Formato non gestito." });
  } catch (error) {
    console.error("❌ Errore esportazione report:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

module.exports = router;
