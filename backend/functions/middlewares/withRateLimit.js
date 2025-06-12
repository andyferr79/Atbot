// 📁 functions/middlewares/withRateLimit.js
const { admin } = require("../firebase");

const db = admin.firestore();

/**
 * Middleware di rate limiting:
 * Max `limit` richieste ogni `windowMs` millisecondi per IP.
 */
function withRateLimit(limit = 60, windowMs = 60_000) {
  return async (req, res, next) => {
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown";

    const ref = db.collection("RateLimits").doc(ip);
    const now = Date.now();

    try {
      const doc = await ref.get();
      let data = doc.exists ? doc.data() : { count: 0, firstRequest: now };

      if (now - data.firstRequest < windowMs) {
        if (data.count >= limit) {
          return res
            .status(429)
            .json({ error: "❌ Troppe richieste. Riprova più tardi." });
        }
        data.count += 1;
      } else {
        data = { count: 1, firstRequest: now };
      }

      await ref.set(data, { merge: true });
      next();
    } catch (err) {
      console.error("❌ Errore rate limit:", err);
      res.status(500).json({ error: "Errore interno rate limiting" });
    }
  };
}

module.exports = withRateLimit;
