const mysql = require("mysql2/promise");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });

const sslConfig = process.env.DB_SSL === "true"
  ? { rejectUnauthorized: false }
  : undefined;

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "senguichet",
  charset: "utf8mb4",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: sslConfig,
});

pool.getConnection()
  .then((conn) => { console.log("✅ MySQL connecté"); conn.release(); })
  .catch((err) => console.error("❌ MySQL erreur:", err.message));

module.exports = pool;
