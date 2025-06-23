// 📁 functions/proxy/middleware/logging.js
const winston = require("winston");

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "proxy.log" }),
  ],
});

const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const backend =
      req.path.includes("/agent") || req.path.includes("/chat")
        ? "FastAPI"
        : "Firebase";

    logger.info({
      method: req.method,
      path: req.path,
      backend,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.headers["user-agent"],
    });
  });

  next();
};

module.exports = { requestLogger };
