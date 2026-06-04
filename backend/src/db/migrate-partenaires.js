/**
 * Migration : Ajout de la table partenaire_demande
 * Exécuter : node src/db/migrate-partenaires.js
 */
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function migratePartenaires() {
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

  try {
    console.log("⏳ Migration partenaires...");
    // La base est déjà sélectionnée via database: dans la connexion

    const [rows] = await connection.query(
      `SELECT COUNT(*) AS cnt FROM information_schema.tables WHERE table_schema = '${process.env.DB_NAME || "senguichet"}' AND table_name = 'partenaire_demande'`
    );

    if (rows[0].cnt === 0) {
      await connection.query(`
        CREATE TABLE partenaire_demande (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nom VARCHAR(150) NOT NULL,
          organisation VARCHAR(200) NOT NULL,
          telephone VARCHAR(20) NOT NULL,
          email VARCHAR(200) NOT NULL,
          type_evenement VARCHAR(50) NOT NULL,
          nb_evenements VARCHAR(20) DEFAULT NULL,
          site_web VARCHAR(300) DEFAULT NULL,
          description TEXT NOT NULL,
          statut ENUM('EN_ATTENTE', 'EN_COURS', 'ACCEPTEE', 'REFUSEE') NOT NULL DEFAULT 'EN_ATTENTE',
          note_admin TEXT DEFAULT NULL,
          email_confirme TINYINT(1) NOT NULL DEFAULT 0,
          administrateur_id INT DEFAULT NULL,
          date_soumission DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          date_traitement DATETIME DEFAULT NULL,
          FOREIGN KEY (administrateur_id) REFERENCES administrateur(id) ON DELETE SET NULL,
          INDEX idx_partenaire_statut (statut),
          INDEX idx_partenaire_date (date_soumission),
          INDEX idx_partenaire_email (email)
        ) ENGINE=InnoDB
      `);
      console.log("✅ Table partenaire_demande créée");
    } else {
      console.log("ℹ️ La table partenaire_demande existe déjà");
    }
  } catch (err) {
    console.error("❌ Erreur migration partenaires:", err.message);
  } finally {
    await connection.end();
  }
}

migratePartenaires();
