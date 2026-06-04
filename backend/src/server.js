const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
require("dotenv").config();

// Validation des variables d'environnement critiques au démarrage
const ENV_VARS = ['JWT_SECRET', 'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missing = ENV_VARS.filter(v => !process.env[v]);
if (missing.length > 0) {
  console.error(`ERREUR CRITIQUE : Variables d'environnement manquantes : ${missing.join(', ')}`);
  process.exit(1);
}

// HMAC_SECRET est requis pour sécuriser les QR codes
if (!process.env.HMAC_SECRET) {
  console.error("ERREUR CRITIQUE : HMAC_SECRET non défini dans les variables d'environnement");
  process.exit(1);
}

const routes = require("./routes");
const pool = require("./config/db");

const app = express();
const PORT = process.env.PORT || 8080;

// trust proxy : requis pour que le rate limiting soit efficace derrière Vercel/reverse proxy
// Sans cette option, express-rate-limit voit toutes les requêtes venir de l'IP du proxy
app.set('trust proxy', 1);

// En production Vercel, VERCEL_URL est fourni automatiquement
if (!process.env.TICKET_URL && process.env.VERCEL_URL) {
  process.env.TICKET_URL = `https://${process.env.VERCEL_URL}/api/billets`;
}

// Sécurité : en-têtes HTTP (helmet)
app.use(helmet());

// CORS restreint : seule l'origine du frontend est autorisée
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
if (!process.env.FRONTEND_URL) {
  console.warn("⚠️  FRONTEND_URL non défini — CORS utilise 'http://localhost:3000'. En production, définis FRONTEND_URL dans les variables d'environnement.");
}
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Servir les fichiers uploads (affiches)
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// Sert le logo SENGUICHET pour les emails
app.use("/api/logo", express.static(path.join(__dirname, "..", "public", "images")));

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});



app.use("/api", routes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Erreur serveur" });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 SenGuichet API sur http://localhost:${PORT}`);
  });
}

module.exports = app;
