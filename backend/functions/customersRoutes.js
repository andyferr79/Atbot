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

// ✅ Middleware Rate Limiting avanzato
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

// 📌 GET - Recuperare dati clienti
exports.getCustomersData = functions.https.onRequest(async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "❌ Usa GET." });
  }

  try {
    await authenticate(req);
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown_ip";
    await checkRateLimit(ip, 10, 60 * 1000); // 10 richieste ogni 60 sec

    const customersSnapshot = await db.collection("Customers").get();

    let totalCustomers = 0,
      leads = 0,
      vipCustomers = 0;
    let recentCustomers = [];

    customersSnapshot.forEach((doc) => {
      const customer = doc.data();
      totalCustomers++;
      if (customer.type === "lead") leads++;
      if (customer.isVIP) vipCustomers++;

      const lastBooking = customer.lastBooking
        ? typeof customer.lastBooking.toDate === "function"
          ? customer.lastBooking.toDate().toISOString()
          : customer.lastBooking
        : null;

      if (lastBooking) {
        recentCustomers.push({
          id: doc.id,
          name: customer.name || "N/A",
          email: customer.email || "N/A",
          phone: customer.phone || "N/A",
          lastBooking,
        });
      }
    });

    recentCustomers = recentCustomers
      .sort((a, b) => new Date(b.lastBooking) - new Date(a.lastBooking))
      .slice(0, 5);

    return res.json({ totalCustomers, leads, vipCustomers, recentCustomers });
  } catch (error) {
    functions.logger.error("❌ Errore recupero clienti:", error);
    return res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

// 📌 POST - Aggiungere nuovo cliente
exports.addCustomer = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "❌ Usa POST." });
  }

  try {
    await authenticate(req);
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown_ip";
    await checkRateLimit(ip, 10, 60 * 1000);

    const { name, email, phone, type, isVIP, lastBooking } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({ error: "❌ Campi obbligatori mancanti." });
    }

    const customerData = {
      name,
      email,
      phone,
      type: type || "regular",
      isVIP: isVIP || false,
      lastBooking: lastBooking ? new Date(lastBooking) : null,
      createdAt: new Date(),
    };

    const docRef = await db.collection("Customers").add(customerData);
    return res.json({ id: docRef.id, ...customerData });
  } catch (error) {
    functions.logger.error("❌ Errore aggiunta cliente:", error);
    return res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

// 📌 PUT - Aggiornare dati cliente
exports.updateCustomer = functions.https.onRequest(async (req, res) => {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "❌ Usa PUT." });
  }

  try {
    await authenticate(req);
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown_ip";
    await checkRateLimit(ip, 10, 60 * 1000);

    const { customerId, updates } = req.body;
    if (!customerId || !updates) {
      return res
        .status(400)
        .json({ error: "❌ customerId e updates richiesti." });
    }

    if (updates.lastBooking)
      updates.lastBooking = new Date(updates.lastBooking);

    await db.collection("Customers").doc(customerId).update(updates);
    return res.json({ message: "✅ Cliente aggiornato." });
  } catch (error) {
    functions.logger.error("❌ Errore aggiornamento cliente:", error);
    return res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

// 📌 DELETE - Eliminare cliente
exports.deleteCustomer = functions.https.onRequest(async (req, res) => {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "❌ Usa DELETE." });
  }

  try {
    await authenticate(req);
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown_ip";
    await checkRateLimit(ip, 10, 60 * 1000);

    const { customerId } = req.query;
    if (!customerId) {
      return res.status(400).json({ error: "❌ customerId richiesto." });
    }

    await db.collection("Customers").doc(customerId).delete();
    return res.json({ message: "✅ Cliente eliminato." });
  } catch (error) {
    functions.logger.error("❌ Errore eliminazione cliente:", error);
    return res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});
