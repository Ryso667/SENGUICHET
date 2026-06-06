/**
 * Migration : crée les événements manquants pour les demandes approuvées
 *
 * Avant la correction du 06/06/2026, l'approbation d'une demande de type CREATION
 * ne créait pas automatiquement l'événement dans la table evenement.
 * Cette migration rattrape les demandes approuvées sans événement associé.
 */
const mysql = require("mysql2/promise");
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
  });

  const db = (db) => process.env.DB_NAME ? `${process.env.DB_NAME}.${db}` : db;

  try {
    // Récupère les demandes CREATION approuvées sans evenement_id
    const [demandes] = await connection.query(`
      SELECT d.id, d.organisateur_id, d.titre, d.description, d.lieu,
             d.date_debut, d.date_fin, d.capacite, d.affiche_url, d.payload
      FROM ${db("demande_evenement")} d
      WHERE d.type_action = 'CREATION'
        AND d.statut = 'approuve'
        AND (d.evenement_id IS NULL)
    `);

    if (!demandes.length) {
      console.log("✅ Aucune demande approuvée sans événement trouvée.");
      return;
    }

    let created = 0;
    for (const demande of demandes) {
      const scanCode = Math.random().toString(36).substring(2, 6).toUpperCase();

      const payload = typeof demande.payload === "string"
        ? JSON.parse(demande.payload) : (demande.payload || {});
      const ville = payload?.ville || null;
      const categorie = payload?.categorie || null;

      const [result] = await connection.query(
        `INSERT INTO ${db("evenement")}
           (organisateur_id, titre, description, lieu, ville, categorie,
            date_debut, date_fin, capacite_totale, affiche_url, scan_code, statut)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'actif')`,
        [demande.organisateur_id, demande.titre, demande.description, demande.lieu,
         ville, categorie,
         demande.date_debut, demande.date_fin, demande.capacite,
         demande.affiche_url || null, scanCode]
      );

      const evenementId = result.insertId;

      // Crée les catégories de tickets depuis le payload
      if (payload?.categories_tickets?.length) {
        const ticketValues = payload.categories_tickets.map(t => [
          evenementId, t.nom, null, parseInt(t.prix), parseInt(t.places), parseInt(t.places)
        ]);
        await connection.query(
          `INSERT INTO ${db("categorie_ticket")}
             (evenement_id, nom, description, prix, capacite, places_disponibles)
           VALUES ?`,
          [ticketValues]
        );
      }

      // Met à jour la demande avec l'ID du nouvel événement
      await connection.query(
        `UPDATE ${db("demande_evenement")} SET evenement_id = ? WHERE id = ?`,
        [evenementId, demande.id]
      );

      created++;
      console.log(`  ✓ Demande #${demande.id} → Événement #${evenementId} (${demande.titre})`);
    }

    console.log(`\n✅ ${created} événement(s) créé(s) avec succès.`);
  } catch (err) {
    console.error("❌ Erreur migration:", err.message);
  } finally {
    await connection.end();
  }
}

migrate();
