/**
 * Middleware d'authentification pour le rôle Acheteur
 * Vérifie que le token JWT contient le rôle ACHETEUR
 * Réutilise le middleware générique avec le rôle ACHETEUR
 */
const auth = require("./auth");
module.exports = auth(["ACHETEUR"]);
