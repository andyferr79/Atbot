// 📁 middlewares/rateLimiter.js
const rateLimit = require("express-rate-limit");

function rateLimiter(options) {
  return rateLimit({
    ...options,
    keyGenerator: (req) => req.user?.uid || req.ip,
    handler: (req, res) => {
      const ip = req.headers["x-forwarded-for"] || req.ip || "unknown";
      console.warn("⚠️ Rate limit triggered:", ip);
      return res
        .status(429)
        .json({ error: "❌ Troppe richieste. Riprova più tardi." });
    },
  });
}

module.exports = { rateLimiter };
