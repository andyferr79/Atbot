const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Inizializza Firebase Admin se non è già attivo
if (!admin.apps.length) {
  admin.initializeApp();
}

// 📌 Funzione Cloud per ottenere i dati dei clienti
exports.getCustomersData = functions.https.onRequest(async (req, res) => {
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

    // ✅ Rate limiting migliorato su Firestore (10 richieste ogni 60 secondi per IP)
    const db = admin.firestore();
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown_ip";
    const now = Date.now();
    const rateDocRef = db.collection("RateLimits").doc(ip);
    const rateDoc = await rateDocRef.get();

    let requestCount = 1;

    if (rateDoc.exists) {
      const data = rateDoc.data();
      const lastRequest = data.lastRequest || 0;
      requestCount = (data.requestCount || 0) + 1;

      // 🔹 Se ha superato 10 richieste in 60 secondi → Blocca per 1 minuto
      if (now - lastRequest < 60 * 1000 && requestCount > 10) {
        return res
          .status(429)
          .json({ error: "❌ Troppe richieste. Riprova tra 1 minuto." });
      }
    }

    // ✅ Salva il nuovo valore del Rate Limit
    await rateDocRef.set({
      lastRequest: now,
      requestCount: requestCount,
    });

    // ✅ Recupero dati dalla collezione "Customers"
    const customersSnapshot = await db.collection("Customers").get();
    if (customersSnapshot.empty) {
      return res.json({
        totalCustomers: 0,
        leads: 0,
        vipCustomers: 0,
        recentCustomers: [],
      });
    }

    let totalCustomers = 0;
    let leads = 0;
    let vipCustomers = 0;
    let recentCustomers = [];

    customersSnapshot.forEach((doc) => {
      const customer = doc.data();
      totalCustomers++;

      if (customer.type === "lead") leads++;
      if (customer.isVIP) vipCustomers++;

      // 🔹 Fix: Controllo avanzato su `lastBooking`
      let lastBooking = null;
      if (customer.lastBooking) {
        if (typeof customer.lastBooking.toDate === "function") {
          lastBooking = customer.lastBooking.toDate().toISOString();
        } else if (typeof customer.lastBooking === "string") {
          lastBooking = customer.lastBooking; // Se è già una stringa ISO
        }
      }

      recentCustomers.push({
        id: doc.id,
        name: customer.name || "N/A",
        email: customer.email || "N/A",
        phone: customer.phone || "N/A",
        lastBooking,
      });
    });

    // Mantiene solo gli ultimi 5 clienti con lastBooking valido
    recentCustomers = recentCustomers
      .filter((c) => c.lastBooking !== null)
      .sort((a, b) => new Date(b.lastBooking) - new Date(a.lastBooking))
      .slice(0, 5);

    return res.json({
      totalCustomers,
      leads,
      vipCustomers,
      recentCustomers,
    });
  } catch (error) {
    functions.logger.error("❌ Errore nel recupero dei clienti:", error);
    return res.status(500).json({
      error: "Errore nel recupero dei clienti",
      details: error.message,
    });
  }
});
