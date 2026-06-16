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

  // Ajout des colonnes categorie et ville à demande_evenement si absentes
  // NB: TiDB ne supporte pas plusieurs ADD COLUMN dans un seul ALTER TABLE,
  // donc on exécute deux ALTER séparés
  try {
    const [cols] = await connection.query("SHOW COLUMNS FROM demande_evenement LIKE 'categorie'");
    if (cols.length === 0) {
      try {
        await connection.query("ALTER TABLE demande_evenement ADD COLUMN categorie VARCHAR(100) DEFAULT NULL AFTER capacite");
        console.log("✅ Colonne categorie ajoutée à demande_evenement");
      } catch (e2) {
        console.error("⚠️  Impossible d'ajouter categorie:", e2.message);
      }
    } else {
      console.log("ℹ️  Colonne categorie existe déjà");
    }
  } catch (e) {
    console.error("⚠️  Impossible de vérifier categorie:", e.message);
  }

  try {
    const [cols] = await connection.query("SHOW COLUMNS FROM demande_evenement LIKE 'ville'");
    if (cols.length === 0) {
      try {
        await connection.query("ALTER TABLE demande_evenement ADD COLUMN ville VARCHAR(100) DEFAULT NULL AFTER lieu");
        console.log("✅ Colonne ville ajoutée à demande_evenement");
      } catch (e2) {
        console.error("⚠️  Impossible d'ajouter ville:", e2.message);
      }
    } else {
      console.log("ℹ️  Colonne ville existe déjà");
    }
  } catch (e) {
    console.error("⚠️  Impossible de vérifier ville:", e.message);
  }

  // Ajout de la colonne code_acces à controleur si absente
  try {
    const [cols] = await connection.query("SHOW COLUMNS FROM controleur LIKE 'code_acces'");
    if (cols.length === 0) {
      await connection.query(`
        ALTER TABLE controleur
        ADD COLUMN code_acces VARCHAR(255) DEFAULT NULL AFTER telephone
      `);
      console.log("✅ Colonne code_acces ajoutée à controleur");
    } else {
      console.log("ℹ️  Colonne code_acces existe déjà");
    }
  } catch (e) {
    console.error("⚠️  Impossible de vérifier/ajouter code_acces:", e.message);
  }

  // Seed d'un contrôleur par défaut (code: 1234) si aucun n'existe
  try {
    const [existants] = await connection.query("SELECT COUNT(*) AS total FROM controleur");
    if (existants[0].total === 0) {
      const bcrypt = require("bcryptjs");
      const hash = await bcrypt.hash("1234", 10);
      await connection.query(
        "INSERT INTO controleur (telephone, code_acces, nom) VALUES (?, ?, ?)",
        ["771234567", hash, "Contrôleur par défaut"]
      );
      console.log("✅ Contrôleur par défaut créé (code: 1234, téléphone: 771234567)");
    } else {
      console.log("ℹ️  Contrôleurs existants, seed ignoré");
    }
  } catch (e) {
    console.error("⚠️  Impossible de créer le contrôleur par défaut:", e.message);
  }

  // Table des tokens push pour les notifications
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS push_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        organisateur_id INT NOT NULL,
        token VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (organisateur_id) REFERENCES organisateur(id) ON DELETE CASCADE
      )
    `)
    console.log("✅ Table push_tokens créée")
  } catch (e) {
    console.log("ℹ️  push_tokens peut-être déjà créée:", e.message)
  }

  // Table des notifications persistées
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        organisateur_id INT NOT NULL,
        evenement_id INT,
        type VARCHAR(50) NOT NULL DEFAULT 'vente',
        message TEXT NOT NULL,
        lue BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (organisateur_id) REFERENCES organisateur(id) ON DELETE CASCADE,
        FOREIGN KEY (evenement_id) REFERENCES evenement(id) ON DELETE SET NULL
      )
    `)
    console.log("✅ Table notifications créée")
  } catch (e) {
    console.log("ℹ️  notifications peut-être déjà créée:", e.message)
  }

  console.log("✅ Migration terminée");
  await connection.end();
}

migrate();
