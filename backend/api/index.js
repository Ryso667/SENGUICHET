// Point d'entrée Vercel — réexporte l'application Express
// Vercel utilise ce fichier comme serverless function
const app = require("../src/server");

module.exports = app;
