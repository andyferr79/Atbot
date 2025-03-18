const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// ✅ Middleware Autenticazione
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

// 📌 GET - Ottenere dati finanziari
exports.getFinances = functions.https.onRequest(async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "❌ Usa GET." });
  }

  try {
    await authenticate(req);
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown_ip";
    await checkRateLimit(ip, 50, 10 * 60 * 1000);

    const snapshot = await db.collection("FinancialReports").get();
    let totalRevenue = 0,
      receivedPayments = 0,
      pendingPayments = 0;
    let recentTransactions = [];

    snapshot.forEach((doc) => {
      const { amount = 0, status, date, customer } = doc.data();
      totalRevenue += amount;
      if (status === "paid") receivedPayments += amount;
      if (status === "pending") pendingPayments += amount;

      recentTransactions.push({
        id: doc.id,
        date: date ? date.toDate().toISOString() : "N/A",
        amount,
        status: status || "unknown",
        customer: customer || "N/A",
      });
    });

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
    functions.logger.error("❌ Errore recupero dati finanziari:", error);
    return res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

// 📌 POST - Aggiungere nuova transazione finanziaria
exports.addFinancialTransaction = functions.https.onRequest(
  async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "❌ Usa POST." });
    }

    try {
      await authenticate(req);
      const ip =
        req.headers["x-forwarded-for"] ||
        req.connection?.remoteAddress ||
        "unknown_ip";
      await checkRateLimit(ip, 50, 10 * 60 * 1000);

      const { amount, status, customer, date } = req.body;

      if (!amount || isNaN(amount) || amount <= 0 || !status || !customer) {
        return res
          .status(400)
          .json({ error: "❌ Campi obbligatori mancanti o invalidi." });
      }

      const newTransaction = {
        amount: parseFloat(amount),
        status,
        customer,
        date: date ? new Date(date) : new Date(),
      };

      const docRef = await db
        .collection("FinancialReports")
        .add(newTransaction);
      return res.status(201).json({ id: docRef.id, ...newTransaction });
    } catch (error) {
      functions.logger.error("❌ Errore aggiunta transazione:", error);
      return res
        .status(error.status || 500)
        .json({ error: error.message || "Errore interno" });
    }
  }
);

// 📌 PUT - Aggiornare transazione finanziaria
exports.updateFinancialTransaction = functions.https.onRequest(
  async (req, res) => {
    if (req.method !== "PUT") {
      return res.status(405).json({ error: "❌ Usa PUT." });
    }

    try {
      await authenticate(req);
      const ip =
        req.headers["x-forwarded-for"] ||
        req.connection?.remoteAddress ||
        "unknown_ip";
      await checkRateLimit(ip, 50, 10 * 60 * 1000);

      const { transactionId, updates } = req.body;
      if (!transactionId || !updates) {
        return res
          .status(400)
          .json({ error: "❌ transactionId e updates richiesti." });
      }

      if (updates.date) updates.date = new Date(updates.date);
      await db
        .collection("FinancialReports")
        .doc(transactionId)
        .update(updates);
      return res.json({ message: "✅ Transazione aggiornata." });
    } catch (error) {
      functions.logger.error("❌ Errore aggiornamento transazione:", error);
      return res
        .status(error.status || 500)
        .json({ error: error.message || "Errore interno" });
    }
  }
);

// 📌 DELETE - Eliminare transazione finanziaria
exports.deleteFinancialTransaction = functions.https.onRequest(
  async (req, res) => {
    if (req.method !== "DELETE") {
      return res.status(405).json({ error: "❌ Usa DELETE." });
    }

    try {
      await authenticate(req);
      const ip =
        req.headers["x-forwarded-for"] ||
        req.connection?.remoteAddress ||
        "unknown_ip";
      await checkRateLimit(ip, 50, 10 * 60 * 1000);

      const { transactionId } = req.query;
      if (!transactionId) {
        return res.status(400).json({ error: "❌ transactionId richiesto." });
      }

      await db.collection("FinancialReports").doc(transactionId).delete();
      return res.json({ message: "✅ Transazione eliminata." });
    } catch (error) {
      functions.logger.error("❌ Errore eliminazione transazione:", error);
      return res
        .status(error.status || 500)
        .json({ error: error.message || "Errore interno" });
    }
  }
);
