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

  // Supprime CREATE DATABASE et USE
  sql = sql.replace(/CREATE DATABASE .*?;/i, "");
  sql = sql.replace(/USE .*?;/i, "");

  // Supprime les TRIGGERs (TiDB ne les supporte pas)
  sql = sql.replace(/CREATE TRIGGER .*?END IF;\s*END\s*;;/gis, "");
  sql = sql.replace(/CREATE TRIGGER .*?;\s*DELIMITER ;/gis, "");
  sql = sql.replace(/DELIMITER \$\$\s*/g, "");
  sql = sql.replace(/DELIMITER ;\s*/g, "");

  // Supprime les INSERTs de données de test
  sql = sql.replace(/-- ============================================================\s*-- JEU DE DONNÉES DE TEST[\s\S]*?(?=SET FOREIGN_KEY_CHECKS|$)/, "");

  // Ajoute les désactivatons de FK checks
  sql = "SET FOREIGN_KEY_CHECKS=0;\n" + sql + "\nSET FOREIGN_KEY_CHECKS=1;\n";

  try {
    console.log("⏳ Migration en cours...");
    await connection.query(sql);
    console.log("✅ Schéma initial appliqué");
  } catch (err) {
    console.error("❌ Erreur schéma (probablement déjà appliqué):", err.message);
  }

  // Ajout de la colonne statut si absente
  try {
    const [cols] = await connection.query("SHOW COLUMNS FROM billet LIKE 'statut'");
    if (cols.length === 0) {
      await connection.query(`
        ALTER TABLE billet
        ADD COLUMN statut ENUM('EN_ATTENTE','ACTIF','UTILISE','REMBOURSE') NOT NULL DEFAULT 'EN_ATTENTE'
        AFTER est_utilise
      `);
      console.log("✅ Colonne statut ajoutée à billet");
    } else {
      console.log("ℹ️  Colonne statut existe déjà");
    }
  } catch (e) {
    console.error("⚠️  Impossible de vérifier/ajouter statut:", e.message);
  }

  // Ajout de la colonne email_acheteur si absente
  try {
    const [cols] = await connection.query("SHOW COLUMNS FROM billet LIKE 'email_acheteur'");
    if (cols.length === 0) {
      await connection.query(`
        ALTER TABLE billet
        ADD COLUMN email_acheteur VARCHAR(255) DEFAULT NULL
        AFTER telephone_acheteur
      `);
      console.log("✅ Colonne email_acheteur ajoutée à billet");
    } else {
      console.log("ℹ️  Colonne email_acheteur existe déjà");
    }
  } catch (e) {
    console.error("⚠️  Impossible de vérifier/ajouter email_acheteur:", e.message);
  }

  // Remplir email_acheteur pour les billets existants (via la table acheteur)
  try {
    const [result] = await connection.query(`
      UPDATE billet b
      JOIN acheteur a ON a.telephone = b.telephone_acheteur
      SET b.email_acheteur = a.email
      WHERE b.email_acheteur IS NULL AND a.telephone IS NOT NULL AND a.email IS NOT NULL
    `);
    if (result.affectedRows > 0) {
      console.log(`✅ ${result.affectedRows} billet(s) existant(s) mis à jour avec email_acheteur`);
    }
  } catch (e) {
    console.error("⚠️  Impossible de backfill email_acheteur:", e.message);
  }

  // Mettre à jour telephone dans acheteur pour les billets qui ont un email_acheteur
  try {
    const [result] = await connection.query(`
      UPDATE acheteur a
      JOIN billet b ON b.email_acheteur = a.email
      SET a.telephone = b.telephone_acheteur
      WHERE a.telephone IS NULL AND b.telephone_acheteur IS NOT NULL
    `);
    if (result.affectedRows > 0) {
      console.log(`✅ ${result.affectedRows} acheteur(s) lié(s) au téléphone`);
    }
  } catch (e) {
    console.error("⚠️  Impossible de lier téléphone aux acheteurs:", e.message);
  }

  console.log("✅ Migration terminée");
  await connection.end();
}

migrate();
