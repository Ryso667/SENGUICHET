/**
 * Migration : backfill ville et catégorie pour les événements existants
 * créés à partir de demandes avant l'ajout de ces champs dans le payload.
 *
 * Récupère ville/categorie depuis la payload JSON de la demande associée
 * et met à jour la table evenement.
 */
const mysql = require("mysql2/promise");
require("dotenv").config();

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
  });

  try {
    const [rows] = await connection.query(`
      SELECT e.id AS evenement_id, d.payload, d.lieu
      FROM senguichet.evenement e
      JOIN senguichet.demande_evenement d ON d.evenement_id = e.id AND d.type_action = 'CREATION'
      WHERE (e.ville IS NULL OR e.categorie IS NULL)
    `);

    if (!rows.length) {
      console.log("✅ Aucun événement à mettre à jour.");
      return;
    }

    let updated = 0;
    for (const row of rows) {
      let payload;
      try {
        payload = typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload;
      } catch {
        continue;
      }

      let ville = payload?.ville || null;
      const categorie = payload?.categorie || null;

      // Fallback : extraire la ville depuis la fin du champ lieu (ex: "..., Dakar")
      if (!ville && row.lieu && row.lieu.includes(",")) {
        const parts = row.lieu.split(",").map(s => s.trim());
        const last = parts[parts.length - 1];
        if (last.length < 50) {
          ville = last;
        }
      }

      const updates = [];
      const params = [];
      if (ville) { updates.push("ville = ?"); params.push(ville); }
      if (categorie) { updates.push("categorie = ?"); params.push(categorie); }

      if (updates.length) {
        params.push(row.evenement_id);
        await connection.query(
          `UPDATE senguichet.evenement SET ${updates.join(", ")} WHERE id = ?`,
          params
        );
        updated++;
      }
    }

    console.log(`✅ ${updated} événement(s) mis à jour avec succès.`);
  } catch (err) {
    console.error("❌ Erreur migration:", err.message);
  } finally {
    await connection.end();
  }
}

migrate();
