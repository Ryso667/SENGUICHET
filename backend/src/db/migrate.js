const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function migrate() {
  const sslConfig = process.env.DB_SSL === "true"
    ? { rejectUnauthorized: false }
    : undefined;

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "senguichet",
    ssl: sslConfig,
    multipleStatements: true,
  });

  const sqlPath = path.join(__dirname, "schema.sql");
  let sql = fs.readFileSync(sqlPath, "utf8");

  // Supprime CREATE DATABASE et USE (la DB est déjà créée sur Aiven)
  sql = sql.replace(/CREATE DATABASE .*?;/i, "");
  sql = sql.replace(/USE .*?;/i, "");

  // Ajoute les désactivatons de FK checks pour permettre l'ordre des tables
  sql = "SET FOREIGN_KEY_CHECKS=0;\n" + sql + "\nSET FOREIGN_KEY_CHECKS=1;\n";

  try {
    console.log("⏳ Migration en cours...");
    await connection.query(sql);

    try {
      await connection.query(`
        ALTER TABLE billet
        ADD COLUMN IF NOT EXISTS statut ENUM('EN_ATTENTE','ACTIF','UTILISE','REMBOURSE') NOT NULL DEFAULT 'EN_ATTENTE'
        AFTER est_utilise
      `);
      console.log("✅ Colonne statut ajoutée à billet");
    } catch (e) {
      // Ignorer si colonne existe déjà
    }

    try {
      await connection.query(`
        ALTER TABLE billet
        ADD COLUMN IF NOT EXISTS numero VARCHAR(20) NOT NULL
        AFTER uuid
      `);
      console.log("✅ Colonne numero ajoutée à billet");
    } catch (e) {
      // Ignorer si colonne existe déjà
    }

    console.log("✅ Base de données migrée avec succès");
  } catch (err) {
    console.error("❌ Erreur migration:", err.message);
  } finally {
    await connection.end();
  }
}

migrate();
