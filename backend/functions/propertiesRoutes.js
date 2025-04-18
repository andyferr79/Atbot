// 📁 propertiesRoutes.js – CRUD completo per alloggi (Properties)
const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// ✅ Middleware autenticazione
async function authenticate(req) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) throw { status: 403, message: "Token mancante" };
  try {
    await admin.auth().verifyIdToken(token);
  } catch (err) {
    throw { status: 401, message: "Token non valido" };
  }
}

// 📌 GET - Recupera tutte le proprietà
exports.getProperties = async (req, res) => {
  if (req.method !== "GET") return res.status(405).json({ error: "Usa GET." });

  try {
    await authenticate(req);
    const snapshot = await db.collection("Properties").get();
    const properties = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.json({ properties });
  } catch (error) {
    functions.logger.error("Errore GET properties:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
};

// 📌 POST - Crea una nuova proprietà
exports.createProperty = async (req, res) => {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Usa POST." });

  try {
    await authenticate(req);
    const { name, price, image, operatorId } = req.body;

    if (!name || !price || !operatorId) {
      return res
        .status(400)
        .json({ error: "Nome, prezzo e operatorId sono obbligatori." });
    }

    const newProperty = {
      name,
      price: parseFloat(price),
      image: image || "",
      operatorId,
      type: "property",
      createdAt: new Date(),
    };

    const docRef = await db.collection("Properties").add(newProperty);
    res.status(201).json({ id: docRef.id, ...newProperty });
  } catch (error) {
    functions.logger.error("Errore POST property:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
};

// 📌 PUT - Aggiorna proprietà
exports.updateProperty = async (req, res) => {
  if (req.method !== "PUT") return res.status(405).json({ error: "Usa PUT." });

  try {
    await authenticate(req);
    const { id } = req.query;
    const updates = req.body;

    if (!id || !updates)
      return res.status(400).json({ error: "ID e dati richiesti." });

    updates.updatedAt = new Date();
    await db.collection("Properties").doc(id).update(updates);
    res.json({ message: "Proprietà aggiornata" });
  } catch (error) {
    functions.logger.error("Errore PUT property:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
};

// 📌 DELETE - Elimina proprietà
exports.deleteProperty = async (req, res) => {
  if (req.method !== "DELETE")
    return res.status(405).json({ error: "Usa DELETE." });

  try {
    await authenticate(req);
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "ID mancante." });

    await db.collection("Properties").doc(id).delete();
    res.json({ message: "Proprietà eliminata" });
  } catch (error) {
    functions.logger.error("Errore DELETE property:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
};
