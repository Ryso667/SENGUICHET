// Middleware de rate limiting pour les routes sensibles
// Utilise express-rate-limit pour limiter les requêtes par IP
const rateLimit = require("express-rate-limit");

// Limiteur pour l'envoi de code OTP : 3 requêtes par minute par IP
const limiteEnvoiOTP = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: { message: "Trop de tentatives. Réessaie dans une minute." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limiteur pour la vérification de code OTP : 5 tentatives par minute par IP
const limiteVerifOTP = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { message: "Trop de tentatives. Réessaie dans une minute." },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { limiteEnvoiOTP, limiteVerifOTP };
