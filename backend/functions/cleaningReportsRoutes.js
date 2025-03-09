const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Inizializza Firebase Admin se non è già attivo
if (!admin.apps.length) {
  admin.initializeApp();
}

// 📌 1) Funzione per recuperare i report delle pulizie (GET /)
exports.getCleaningReports = functions.https.onRequest(async (req, res) => {
  // Consenti solo richieste GET
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ error: "❌ Metodo non consentito. Usa GET." });
  }

  try {
    // ✅ Verifica token
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

    // ✅ Rate limit su Firestore (max 50 richieste / 10 min per IP)
    const db = admin.firestore();
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown_ip";
    const now = Date.now();
    const rateDocRef = db.collection("RateLimits").doc(ip);
    const rateDoc = await rateDocRef.get();

    if (rateDoc.exists) {
      const lastRequest = rateDoc.data().lastRequest || 0;
      // 10 minuti = 10 * 60 * 1000 ms
      if (now - lastRequest < 10 * 60 * 1000) {
        return res
          .status(429)
          .json({ error: "❌ Troppe richieste. Riprova più tardi." });
      }
    }
    // Aggiorna il timestamp dell'ultima richiesta
    await rateDocRef.set({ lastRequest: now });

    // ✅ Recupera i report dal DB
    const { structureId } = req.query;
    let query = db.collection("CleaningReports");

    if (structureId) {
      query = query.where("structureId", "==", structureId);
    }

    const snapshot = await query.get();
    const reports = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        lastCleaned: data.lastCleaned
          ? data.lastCleaned.toDate().toISOString()
          : "N/A",
        createdAt: data.createdAt
          ? data.createdAt.toDate().toISOString()
          : "N/A",
      };
    });

    return res.json(reports);
  } catch (error) {
    functions.logger.error(
      "❌ Errore nel recupero dei dati sulle pulizie:",
      error
    );
    return res.status(500).json({
      error: "Errore nel recupero dei dati sulle pulizie",
      details: error.message,
    });
  }
});

// 📌 2) Funzione per aggiungere un nuovo report di pulizia (POST /add)
exports.addCleaningReport = functions.https.onRequest(async (req, res) => {
  // Consenti solo richieste POST
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ error: "❌ Metodo non consentito. Usa POST." });
  }

  try {
    // ✅ Verifica token
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

    // ✅ Rate limit su Firestore (50 richieste / 10 min per IP)
    const db = admin.firestore();
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown_ip";
    const now = Date.now();
    const rateDocRef = db.collection("RateLimits").doc(ip);
    const rateDoc = await rateDocRef.get();

    if (rateDoc.exists) {
      const lastRequest = rateDoc.data().lastRequest || 0;
      if (now - lastRequest < 10 * 60 * 1000) {
        return res
          .status(429)
          .json({ error: "❌ Troppe richieste. Riprova più tardi." });
      }
    }
    await rateDocRef.set({ lastRequest: now });

    // ✅ Logica per aggiungere un nuovo report
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
      return res.status(400).json({
        error: "Tutti i campi obbligatori devono essere compilati",
      });
    }

    const newReport = {
      structureId,
      structureType,
      roomNumber,
      address:
        structureType === "appartamento" || structureType === "villa"
          ? address
          : null,
      status,
      lastCleaned: new Date(lastCleaned),
      assignedTo,
      createdAt: new Date(),
    };

    const docRef = await db.collection("CleaningReports").add(newReport);

    return res.json({
      id: docRef.id,
      ...newReport,
      lastCleaned: newReport.lastCleaned.toISOString(),
      createdAt: newReport.createdAt.toISOString(),
    });
  } catch (error) {
    functions.logger.error(
      "❌ Errore nell'aggiunta del report di pulizia:",
      error
    );
    return res.status(500).json({
      error: "Errore nell'aggiunta del report di pulizia",
      details: error.message,
    });
  }
});
