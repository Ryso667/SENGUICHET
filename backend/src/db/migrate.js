const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    multipleStatements: true,
  });

  const sqlPath = path.join(__dirname, "schema.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");

  try {
    console.log("⏳ Migration en cours...");
    await connection.query(sql);
    console.log("✅ Base de données migrée avec succès");
  } catch (err) {
    console.error("❌ Erreur migration:", err.message);
  } finally {
    await connection.end();
  }
}

migrate();
