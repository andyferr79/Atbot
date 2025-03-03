const express = require("express");
const router = express.Router();
const admin = require("../firebase");
const rateLimit = require("express-rate-limit");
const winston = require("winston");
const json2csv = require("json2csv").parse;
const excelJS = require("exceljs");
const pdfkit = require("pdfkit");
const fs = require("fs");

// ✅ Logging avanzato
const logger = winston.createLogger({
  level: "error",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "logs/reports_export_errors.log" }),
  ],
});

// ✅ Protezione API con rate limit
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: "❌ Troppe richieste. Attendi prima di riprovare.",
});

// ✅ API per esportare i report in PDF, CSV o Excel
router.get("/export", limiter, async (req, res) => {
  try {
    const { format, reportType } = req.query;
    if (!format || !["pdf", "csv", "excel"].includes(format.toLowerCase())) {
      return res
        .status(400)
        .json({ error: "❌ Formato non valido. Usa 'pdf', 'csv' o 'excel'." });
    }

    const db = admin.firestore();
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
      res.attachment("report.csv").send(csv);
    } else if (format.toLowerCase() === "excel") {
      const workbook = new excelJS.Workbook();
      const worksheet = workbook.addWorksheet("Report");
      worksheet.columns = Object.keys(reports[0]).map((key) => ({
        header: key,
        key,
      }));
      reports.forEach((data) => worksheet.addRow(data));

      res.attachment("report.xlsx");
      await workbook.xlsx.write(res);
      res.end();
    } else if (format.toLowerCase() === "pdf") {
      const doc = new pdfkit();
      res.attachment("report.pdf");
      doc.pipe(res);
      doc.text("Report Esportato");
      reports.forEach((report) => {
        doc.text(JSON.stringify(report, null, 2));
        doc.moveDown();
      });
      doc.end();
    }
  } catch (error) {
    logger.error("❌ Errore nell'esportazione del report:", error);
    res.status(500).json({ error: "Errore nell'esportazione del report" });
  }
});

module.exports = router;
