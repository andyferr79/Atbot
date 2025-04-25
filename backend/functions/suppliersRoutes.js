const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();

// ✅ Middleware autenticazione
async function authenticate(req) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) throw { status: 403, message: "❌ Token mancante" };
  try {
    req.user = await admin.auth().verifyIdToken(token);
  } catch (error) {
    functions.logger.error("❌ Token non valido:", error);
    throw { status: 401, message: "❌ Token non valido" };
  }
}

// ✅ Middleware Rate Limiting
async function checkRateLimit(ip, maxRequests = 100, windowMs = 60_000) {
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

// 📌 GET - Recupera tutti i fornitori
exports.getSuppliers = functions.https.onRequest(async (req, res) => {
  if (req.method !== "GET")
    return res.status(405).json({ error: "❌ Usa GET." });

  try {
    await authenticate(req);
    await checkRateLimit(req.ip);

    const snapshot = await db.collection("Suppliers").get();
    const suppliers = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString() || null,
      updatedAt: doc.data().updatedAt?.toDate().toISOString() || null,
    }));

    res.json({ suppliers });
  } catch (error) {
    functions.logger.error("❌ Errore recupero fornitori:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

// 📌 POST - Aggiunge nuovo fornitore
exports.addSupplier = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST")
    return res.status(405).json({ error: "❌ Usa POST." });

  try {
    await authenticate(req);
    await checkRateLimit(req.ip);

    const {
      name,
      category = "Generale",
      contact = {},
      status = "Attivo",
    } = req.body;
    if (!name || !contact.email) {
      return res.status(400).json({
        error: "❌ Nome e contatto email sono obbligatori.",
      });
    }

    const newSupplier = {
      name,
      category,
      contact,
      status,
      createdAt: new Date(),
    };

    const docRef = await db.collection("Suppliers").add(newSupplier);
    res.status(201).json({ id: docRef.id, ...newSupplier });
  } catch (error) {
    functions.logger.error("❌ Errore aggiunta fornitore:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

// 📌 PUT - Aggiorna un fornitore
exports.updateSupplier = functions.https.onRequest(async (req, res) => {
  if (req.method !== "PUT")
    return res.status(405).json({ error: "❌ Usa PUT." });

  try {
    await authenticate(req);
    await checkRateLimit(req.ip);

    const { id, updates } = req.body;
    if (!id || typeof updates !== "object") {
      return res
        .status(400)
        .json({ error: "❌ ID e dati aggiornati richiesti." });
    }

    await db
      .collection("Suppliers")
      .doc(id)
      .update({
        ...updates,
        updatedAt: new Date(),
      });

    res.json({ message: "✅ Fornitore aggiornato con successo." });
  } catch (error) {
    functions.logger.error("❌ Errore aggiornamento fornitore:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

// 📌 DELETE - Elimina fornitore
exports.deleteSupplier = functions.https.onRequest(async (req, res) => {
  if (req.method !== "DELETE")
    return res.status(405).json({ error: "❌ Usa DELETE." });

  try {
    await authenticate(req);
    await checkRateLimit(req.ip);

    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "❌ ID mancante." });

    await db.collection("Suppliers").doc(id).delete();
    res.json({ message: "✅ Fornitore eliminato con successo." });
  } catch (error) {
    functions.logger.error("❌ Errore eliminazione fornitore:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});
