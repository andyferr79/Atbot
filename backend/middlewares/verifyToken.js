// 📁 middlewares/verifyToken.js
// Assicurati che firebase.js faccia:  module.exports = { admin };
const { admin } = require("../firebase");

/**
 * Middleware di autenticazione:
 * - Verifica l'ID-token Firebase
 * - Espone req.userId e req.user (con eventuale role)
 * - Logga ogni passaggio per debug
 */
async function verifyToken(req, res, next) {
  const header = req.headers.authorization || "";
  // 1️⃣ Header mancante o malformato
  if (!header.startsWith("Bearer ")) {
    console.log("verifyToken ➜ TOKEN MANCANTE");
    return res.status(403).json({ error: "❌ Token mancante" });
  }

  const idToken = header.split(" ")[1];

  try {
    // 2️⃣ Verifica token
    const decoded = await admin.auth().verifyIdToken(idToken);
    console.log(`verifyToken ➜ OK uid=${decoded.uid}`);

    // 3️⃣ Propaga i dati utili al resto dell’app
    req.userId = decoded.uid;
    req.user = {
      ...decoded,
      role: decoded.role || "base", // fallback se il custom-claim non c’è
    };

    return next(); // 🚀 passa al router
  } catch (err) {
    console.log("verifyToken ➜ TOKEN NON VALIDO:", err.message);
    return res.status(401).json({ error: "❌ Token non valido" });
  }
}

module.exports = { verifyToken };
