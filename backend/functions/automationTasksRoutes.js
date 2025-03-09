const functions = require("firebase-functions");
const admin = require("firebase-admin");

// ✅ Inizializza Firebase Admin se non è già attivo
if (!admin.apps.length) {
  admin.initializeApp();
}

// ✅ Funzione per la creazione dei task automatici
exports.createAutomationTask = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ error: "❌ Metodo non consentito. Usa POST." });
  }

  try {
    const { taskType, assignedTo, dueDate } = req.body;

    if (!taskType || !assignedTo || !dueDate) {
      return res
        .status(400)
        .json({ error: "❌ Tutti i campi sono obbligatori." });
    }

    const db = admin.firestore();

    // ✅ Controllo rate limit (max 20 richieste ogni 10 min per IP)
    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const rateLimitDoc = await db.collection("RateLimits").doc(ip).get();
    const now = Date.now();

    if (rateLimitDoc.exists) {
      const lastRequest = rateLimitDoc.data().lastRequest;
      if (now - lastRequest < 10 * 60 * 1000) {
        // 10 min
        return res
          .status(429)
          .json({ error: "❌ Troppe richieste. Attendi prima di riprovare." });
      }
    }

    // ✅ Salva la nuova richiesta nel database per il rate limit
    await db.collection("RateLimits").doc(ip).set({ lastRequest: now });

    // ✅ Salva il task in Firestore
    await db.collection("AutomationTasks").add({
      taskType,
      assignedTo,
      dueDate: new Date(dueDate),
      createdAt: new Date(),
    });

    res.json({ message: "✅ Task creato con successo!" });
  } catch (error) {
    functions.logger.error(
      "❌ Errore nella creazione del task automatico:",
      error
    );
    res.status(500).json({ error: "Errore nella creazione del task" });
  }
});
