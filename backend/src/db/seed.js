/**
 * Script de seed pour la base de données
 * Crée les données de test : organisateur, événements, catégories, acheteur
 */

const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
require("dotenv").config();

async function seed() {
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
    console.log("⏳ Seed en cours...");

    // Récupère l'ID de l'organisateur existant (inséré par le schéma)
    const [orgRows] = await connection.query(
      "SELECT id FROM organisateur ORDER BY id ASC LIMIT 1"
    );
    const organisateurId = orgRows[0]?.id || 1;

    // Vérifie si l'événement existe déjà
    const [existingEvent] = await connection.query(
      "SELECT id FROM evenement WHERE organisateur_id = ? LIMIT 1",
      [organisateurId]
    );

    if (existingEvent.length > 0) {
      console.log("ℹ️  Les données de test existent déjà, seed ignoré.");
      console.log("  Organisateur : moussa@email.com / organisateur123");
      console.log("  Acheteur test : +221771234568 (code OTP: 123456)");
      return;
    }

    // 1. Créer un événement test
    const [eventResult] = await connection.query(
      `INSERT INTO evenement (organisateur_id, titre, description, lieu, ville, date_debut, date_fin, capacite_totale, scan_code, statut)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'actif')`,
      [
        organisateurId,
        "Concert de Hip Hop",
        "Un grand concert avec les meilleurs artistes sénégalais",
        "Stade Iba Mar Diop, Dakar",
        "Dakar",
        "2026-08-15 20:00:00",
        "2026-08-16 02:00:00",
        170,
        "1234",
      ]
    );
    const eventId = eventResult.insertId;
    console.log("✅ Événement test créé : Concert de Hip Hop");

    // 2. Créer des catégories de tickets
    await connection.query(
      `INSERT INTO categorie_ticket (evenement_id, nom, prix, capacite, places_disponibles, couleur_hex)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [eventId, "Standard", 5000, 100, 100, "#22C55E"]
    );
    await connection.query(
      `INSERT INTO categorie_ticket (evenement_id, nom, prix, capacite, places_disponibles, couleur_hex)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [eventId, "VIP", 15000, 50, 50, "#F59E0B"]
    );
    await connection.query(
      `INSERT INTO categorie_ticket (evenement_id, nom, prix, capacite, places_disponibles, couleur_hex)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [eventId, "Gold", 30000, 20, 20, "#EF4444"]
    );
    console.log(
      "✅ Catégories test créées : Standard (5000 F), VIP (15000 F), Gold (30000 F)"
    );

    // 3. Créer un acheteur test
    await connection.query(
      `INSERT IGNORE INTO acheteur (telephone, nom, email)
       VALUES (?, ?, ?)`,
      ["+221771234568", "Moussa Ndiaye", "acheteur@test.com"]
    );
    console.log("✅ Acheteur test créé : acheteur@test.com");

    console.log("\n🎉 Base de données initialisée avec succès !");
    console.log("  Organisateur : moussa@email.com / organisateur123");
    console.log("  Acheteur OTP : +221771234568 (code: 123456)");
    console.log("  Événement    : Concert de Hip Hop (3 catégories)");
  } catch (err) {
    console.error("❌ Erreur seed:", err.message);
  } finally {
    await connection.end();
  }
}

seed();
