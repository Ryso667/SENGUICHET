const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const readline = require("readline");

async function demanderConfirmation(message) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(message + " (oui/non) ", (reponse) => {
      rl.close();
      resolve(reponse.toLowerCase() === "oui");
    });
  });
}

async function migrateAiven() {
  const sslConfig = process.env.DB_SSL === "true"
    ? { rejectUnauthorized: false }
    : undefined;

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: sslConfig,
    multipleStatements: true,
  });

  try {
    console.log("⚠️  ATTENTION : Ce script va SUPPRIMER toutes les tables existantes !");
    const confirme = await demanderConfirmation("Voulez-vous continuer ?");
    if (!confirme) {
      console.log("Migration annulée.");
      process.exit(0);
    }
    console.log("🗑️ Suppression des tables existantes...");
    await connection.query("SET FOREIGN_KEY_CHECKS=0");
    const [tables] = await connection.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = ?",
      [process.env.DB_NAME]
    );
    for (const t of tables) {
      await connection.query(`DROP TABLE IF EXISTS \`${t.TABLE_NAME}\``);
      console.log(`  ✗ ${t.TABLE_NAME} supprimée`);
    }
    await connection.query("SET FOREIGN_KEY_CHECKS=1");

    console.log("\n🏗️ Création des tables...");
    let sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
    sql = sql.replace(/CREATE DATABASE .*?;/i, "");
    sql = sql.replace(/USE .*?;/i, "");
    sql = "SET FOREIGN_KEY_CHECKS=0;\n" + sql + "\nSET FOREIGN_KEY_CHECKS=1;\n";
    await connection.query(sql);
    console.log("✅ Toutes les tables créées avec succès");

    console.log("\n📦 Données initiales insérées (admin + organisateur test)");
  } catch (err) {
    console.error("❌ Erreur:", err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

migrateAiven();
