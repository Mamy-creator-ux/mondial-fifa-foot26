// server/src/middleware/errorHandler.js
function notFound(req, res) {
  res.status(404).json({ error: `Route non trouvée : ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.publicMessage || "Erreur interne du serveur.",
  });
}

module.exports = { notFound, errorHandler };
