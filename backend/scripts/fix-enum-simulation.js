// Script pour ajouter 'SIMULATION' à l'ENUM moyen_paiement
const mysql = require("mysql2/promise");
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const sslConfig = process.env.DB_SSL === "true"
  ? { rejectUnauthorized: false }
  : undefined;

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "senguichet",
    charset: "utf8mb4",
    ssl: sslConfig,
  });

  try {
    await pool.query("ALTER TABLE transaction MODIFY COLUMN moyen_paiement ENUM('WAVE','ORANGE_MONEY','FREE_MONEY','CARTE','AUTRE','SIMULATION') NOT NULL");
    console.log("✅ ENUM moyen_paiement mis à jour (SIMULATION ajouté)");
  } catch (err) {
    console.error("❌ Erreur:", err.message);
  }

  await pool.end();
}

main();
