const { admin } = require("../firebase"); // Assicurati che firebase.js esporti { admin }

async function verifyToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(403).json({ error: "❌ Token mancante" });
  }

  const token = header.split(" ")[1];
  try {
    const decoded = await admin.auth().verifyIdToken(token);

    // ✅ Estrae UID e role per accesso universale
    req.userId = decoded.uid;
    req.user = {
      ...decoded,
      role: decoded.role || "base", // fallback se manca
    };

    return next();
  } catch (err) {
    console.error("❌ Token non valido:", err);
    return res.status(401).json({ error: "❌ Token non valido" });
  }
}

module.exports = { verifyToken };
