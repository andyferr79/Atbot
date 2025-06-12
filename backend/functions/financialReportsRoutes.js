// 📁 functions/financialReportsRoutes.js
const express = require("express");
const admin = require("firebase-admin");
const Busboy = require("busboy");
const { verifyToken } = require("./middlewares/verifyToken");
const withRateLimit = require("./middlewares/withRateLimit");

const router = express.Router();
const db = admin.firestore();

// 🔐 Middleware globali
router.use(verifyToken);
router.use(withRateLimit(20, 15 * 60 * 1000)); // 20 richieste ogni 15 minuti

// 📌 POST - Import file finanziari
router.post("/import", async (req, res) => {
  try {
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
        console.log(`✅ File ${fileInfo.filename} elaborato.`);
      }, 5000);

      return res.json({
        message: "✅ Dati finanziari importati con successo",
        reportId: docRef.id,
        uploadedAt: financialData.uploadedAt.toISOString(),
      });
    });

    busboy.end(req.rawBody);
  } catch (error) {
    console.error("❌ Errore import dati finanziari:", error);
    return res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

// 📌 GET - Elenco report
router.get("/", async (req, res) => {
  try {
    const snapshot = await db.collection("FinancialReports").get();
    const reports = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      uploadedAt: doc.data().uploadedAt?.toDate().toISOString(),
      processedAt: doc.data().processedAt?.toDate().toISOString() || null,
    }));
    return res.json(reports);
  } catch (error) {
    console.error("❌ Errore recupero report finanziari:", error);
    return res.status(500).json({ error: error.message || "Errore interno" });
  }
});

// 📌 DELETE - Eliminare report
router.delete("/", async (req, res) => {
  try {
    const { reportId } = req.query;
    if (!reportId) {
      return res.status(400).json({ error: "❌ reportId richiesto." });
    }

    await db.collection("FinancialReports").doc(reportId).delete();
    return res.json({ message: "✅ Report finanziario eliminato." });
  } catch (error) {
    console.error("❌ Errore eliminazione report finanziario:", error);
    return res.status(500).json({ error: error.message || "Errore interno" });
  }
});

module.exports = router;
