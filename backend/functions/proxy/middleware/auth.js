// 📁 functions/proxy/middleware/auth.js
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Token mancante" });

    const decodedToken = await admin.auth().verifyIdToken(token);

    req.headers["x-user-id"] = decodedToken.uid;
    req.headers["x-user-email"] = decodedToken.email;
    req.headers["x-user-role"] = decodedToken.role || "user";

    next();
  } catch (err) {
    console.error("❌ Verifica token fallita:", err.message);
    res.status(401).json({ error: "Token non valido" });
  }
};

module.exports = { verifyToken };
