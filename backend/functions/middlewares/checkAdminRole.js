function checkAdminRole(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      error: "⛔ Accesso riservato agli amministratori.",
    });
  }
  next();
}

module.exports = { checkAdminRole };
