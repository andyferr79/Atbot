const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Inizializza Firebase Admin se non è già attivo
if (!admin.apps.length) {
  admin.initializeApp();
}

// 📌 Funzione Cloud per ottenere i dati finanziari
exports.getFinances = functions.https.onRequest(async (req, res) => {
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
      // 10 minuti = 10 * 60 * 1000
      if (now - lastRequest < 10 * 60 * 1000) {
        return res
          .status(429)
          .json({ error: "❌ Troppe richieste. Riprova più tardi." });
      }
    }
    await rateDocRef.set({ lastRequest: now });

    // ✅ Recupero dati da "FinancialReports"
    const financesSnapshot = await db.collection("FinancialReports").get();

    if (financesSnapshot.empty) {
      return res.json({
        totalRevenue: 0,
        receivedPayments: 0,
        pendingPayments: 0,
        recentTransactions: [],
      });
    }

    let totalRevenue = 0;
    let receivedPayments = 0;
    let pendingPayments = 0;
    let recentTransactions = [];

    financesSnapshot.forEach((doc) => {
      const transaction = doc.data();
      totalRevenue += transaction.amount || 0;

      if (transaction.status === "paid") {
        receivedPayments += transaction.amount || 0;
      }
      if (transaction.status === "pending") {
        pendingPayments += transaction.amount || 0;
      }

      recentTransactions.push({
        id: doc.id,
        date: transaction.date
          ? transaction.date.toDate().toISOString()
          : "N/A",
        amount: transaction.amount || 0,
        status: transaction.status || "unknown",
        customer: transaction.customer || "N/A",
      });
    });

    // Mantiene solo le ultime 5 transazioni con date valide
    recentTransactions = recentTransactions
      .filter((t) => t.date !== "N/A")
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    return res.json({
      totalRevenue,
      receivedPayments,
      pendingPayments,
      recentTransactions,
    });
  } catch (error) {
    functions.logger.error(
      "❌ Errore nel recupero dei dati finanziari:",
      error
    );
    return res.status(500).json({
      error: "Errore nel recupero dei dati finanziari",
      details: error.message,
    });
  }
});
