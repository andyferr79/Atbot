const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Inizializza Firebase Admin solo se non è già attivo
if (!admin.apps.length) {
  admin.initializeApp();
}

// 📌 1) Funzione Cloud per recuperare i report dei clienti (GET /)
exports.getCustomersReports = functions.https.onRequest(async (req, res) => {
  // Consenti solo chiamate GET
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

    // ✅ Rate limiting su Firestore (max 50 richieste ogni 10 min per IP)
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
      // 10 minuti
      if (now - lastRequest < 10 * 60 * 1000) {
        return res
          .status(429)
          .json({ error: "❌ Troppe richieste. Riprova più tardi." });
      }
    }
    await rateDocRef.set({ lastRequest: now });

    // ✅ Recupera i report da "CustomersReports"
    const snapshot = await db.collection("CustomersReports").get();
    if (snapshot.empty) {
      return res.json([]);
    }

    const reports = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt
          ? data.createdAt.toDate().toISOString()
          : "N/A",
      };
    });

    return res.json(reports);
  } catch (error) {
    functions.logger.error("❌ Errore nel recupero dei dati clienti:", error);
    return res.status(500).json({
      error: "Errore nel recupero dei dati clienti",
      details: error.message,
    });
  }
});

// 📌 2) Funzione Cloud per aggiungere un nuovo report cliente (POST /add)
exports.addCustomerReport = functions.https.onRequest(async (req, res) => {
  // Consenti solo chiamate POST
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

    // ✅ Rate limiting su Firestore (50 richieste ogni 10 min per IP)
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

    // ✅ Validazione dei campi
    const { name, email, phone, bookings, structureId, structureType } =
      req.body;

    if (!name || !email || !phone || !bookings) {
      return res.status(400).json({ error: "Tutti i campi sono obbligatori" });
    }

    // Validazione e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "❌ Indirizzo email non valido" });
    }

    // Validazione numero di telefono
    const phoneRegex = /^[0-9\-\+\s\(\)]{7,15}$/;
    if (!phoneRegex.test(phone)) {
      return res
        .status(400)
        .json({ error: "❌ Numero di telefono non valido" });
    }

    // Validazione bookings
    const parsedBookings = parseInt(bookings, 10);
    if (isNaN(parsedBookings) || parsedBookings < 0) {
      return res.status(400).json({
        error:
          "❌ Il numero di prenotazioni deve essere un numero intero positivo",
      });
    }

    // ✅ Creazione del nuovo report
    const newReport = {
      name,
      email,
      phone,
      bookings: parsedBookings,
      structureId: structureId || null,
      structureType: structureType || "Generico",
      createdAt: new Date(),
    };

    const docRef = await db.collection("CustomersReports").add(newReport);

    return res.json({
      id: docRef.id,
      ...newReport,
      createdAt: newReport.createdAt.toISOString(),
    });
  } catch (error) {
    functions.logger.error(
      "❌ Errore nell'aggiunta del report cliente:",
      error
    );
    return res.status(500).json({
      error: "Errore nell'aggiunta del report cliente",
      details: error.message,
    });
  }
});
