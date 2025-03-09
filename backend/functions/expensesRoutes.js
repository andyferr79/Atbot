const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Inizializza Firebase Admin se non è già attivo
if (!admin.apps.length) {
  admin.initializeApp();
}

// 📌 1) Funzione Cloud per ottenere tutte le spese operative (GET /)
exports.getExpenses = functions.https.onRequest(async (req, res) => {
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

    // ✅ Rate limiting (max 50 richieste ogni 10 min per IP)
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

    // ✅ Recupero spese dalla collezione "Expenses"
    const expensesSnapshot = await db.collection("Expenses").get();

    if (expensesSnapshot.empty) {
      return res.json({ expenses: [], totalExpenses: 0 });
    }

    let expenses = [];
    let totalExpenses = 0;

    expensesSnapshot.forEach((doc) => {
      const expense = doc.data();
      totalExpenses += expense.amount || 0;
      expenses.push({
        id: doc.id,
        category: expense.category || "Varie",
        amount: expense.amount || 0,
        description: expense.description || "",
        date: expense.date ? expense.date.toDate().toISOString() : "N/A",
      });
    });

    return res.json({ expenses, totalExpenses });
  } catch (error) {
    functions.logger.error("❌ Errore nel recupero delle spese:", error);
    return res.status(500).json({
      error: "Errore nel recupero delle spese",
      details: error.message,
    });
  }
});

// 📌 2) Funzione Cloud per aggiungere una nuova spesa (POST /add)
exports.addExpense = functions.https.onRequest(async (req, res) => {
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

    // ✅ Rate limiting (50 richieste / 10 min)
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

    // ✅ Logica per aggiungere una nuova spesa
    const { category, amount, description } = req.body;
    if (!amount || isNaN(amount) || amount <= 0) {
      return res
        .status(400)
        .json({ error: "❌ L'importo deve essere un numero positivo." });
    }

    const newExpense = {
      category: category || "Varie",
      amount: parseFloat(amount),
      description: description || "",
      date: new Date(),
    };

    const docRef = await db.collection("Expenses").add(newExpense);
    return res.json({
      message: "✅ Spesa registrata con successo",
      id: docRef.id,
      date: newExpense.date.toISOString(),
    });
  } catch (error) {
    functions.logger.error("❌ Errore nell'aggiunta della spesa:", error);
    return res.status(500).json({
      error: "Errore nell'aggiunta della spesa",
      details: error.message,
    });
  }
});
