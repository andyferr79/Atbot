const rateLimit = require("express-rate-limit");

const rateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: "❌ Troppe richieste. Riprova tra un minuto.",
  keyGenerator: (req) => req.user?.uid || req.ip,
});

module.exports = { rateLimiter };
