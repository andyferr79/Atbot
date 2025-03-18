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

// 📌 GET - Ottenere tutte le spese
exports.getExpenses = functions.https.onRequest(async (req, res) => {
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

    const snapshot = await db.collection("Expenses").get();
    let totalExpenses = 0;
    const expenses = snapshot.docs.map((doc) => {
      const data = doc.data();
      totalExpenses += data.amount || 0;
      return {
        id: doc.id,
        category: data.category || "Varie",
        amount: data.amount || 0,
        description: data.description || "",
        date: data.date?.toDate().toISOString() || "N/A",
      };
    });

    return res.json({ expenses, totalExpenses });
  } catch (error) {
    functions.logger.error("❌ Errore recupero spese:", error);
    return res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

// 📌 POST - Aggiungere nuova spesa
exports.addExpense = functions.https.onRequest(async (req, res) => {
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

    const { category, amount, description, date } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return res
        .status(400)
        .json({ error: "❌ Importo deve essere positivo." });
    }

    const newExpense = {
      category: category || "Varie",
      amount: parseFloat(amount),
      description: description || "",
      date: date ? new Date(date) : new Date(),
    };

    const docRef = await db.collection("Expenses").add(newExpense);
    return res.status(201).json({ id: docRef.id, ...newExpense });
  } catch (error) {
    functions.logger.error("❌ Errore aggiunta spesa:", error);
    return res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

// 📌 PUT - Aggiornare spesa
exports.updateExpense = functions.https.onRequest(async (req, res) => {
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

    const { expenseId, updates } = req.body;
    if (!expenseId || !updates) {
      return res
        .status(400)
        .json({ error: "❌ expenseId e aggiornamenti richiesti." });
    }

    if (updates.date) updates.date = new Date(updates.date);
    await db.collection("Expenses").doc(expenseId).update(updates);
    return res.json({ message: "✅ Spesa aggiornata." });
  } catch (error) {
    functions.logger.error("❌ Errore aggiornamento spesa:", error);
    return res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

// 📌 DELETE - Eliminare spesa
exports.deleteExpense = functions.https.onRequest(async (req, res) => {
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

    const { expenseId } = req.query;
    if (!expenseId) {
      return res.status(400).json({ error: "❌ expenseId richiesto." });
    }

    await db.collection("Expenses").doc(expenseId).delete();
    return res.json({ message: "✅ Spesa eliminata." });
  } catch (error) {
    functions.logger.error("❌ Errore eliminazione spesa:", error);
    return res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});
