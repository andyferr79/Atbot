// middleware per abilitare CORS in modo restrittivo
function withCors(req, res, next) {
  const allowedOrigins = [
    "http://localhost:3000",
    "https://app.tuodominio.com",
    // aggiungi qui i domini validi
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,DELETE,OPTIONS"
    );
  }
  // per le preflight requests
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
}

module.exports = { withCors };
