const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const routes = require("./routes");
const pool = require("./config/db");

const app = express();
const PORT = process.env.PORT || 8080;

// En production Vercel, VERCEL_URL est fourni automatiquement
if (!process.env.TICKET_URL && process.env.VERCEL_URL) {
  process.env.TICKET_URL = `https://${process.env.VERCEL_URL}/api/billets`;
}

// Trust proxy : 1 saut — Vercel se met devant l'app
app.set("trust proxy", 1);

app.use(cors());
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
