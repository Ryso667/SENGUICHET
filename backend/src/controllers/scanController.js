// Contrôleur des scans : synchronisation des scans offline depuis l'app mobile
// POST /api/scans/sync — reçoit un lot de scans offline et les enregistre

const pool = require("../config/db");

/**
 * Synchronise les scans offline effectués par un contrôleur
 * Reçoit un tableau de scans, insère dans scan_billet et met à jour est_utilise
 * Remplace le trigger SQL after_scan_billet_insert non supporté par TiDB
 */
const syncScans = async (req, res) => {
  try {
    const scans = req.body; // Tableau de scans [{uuid_billet, hmac, timestamp_scan, resultat}]

    if (!Array.isArray(scans) || scans.length === 0) {
      return res.status(400).json({ message: "Aucun scan à synchroniser" });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      for (const scan of scans) {
        // Chercher le billet correspondant
        const [billets] = await conn.query(
          "SELECT id, evenement_id FROM billet WHERE uuid = ?",
          [scan.uuid_billet]
        );
        if (billets.length === 0) continue;

        const billet = billets[0];

        // Insérer le scan
        const [scanResult] = await conn.query(
          `INSERT INTO scan_billet (billet_id, evenement_id, statut, horodatage_scan, horodatage_local, est_offline, date_synchronisation)
           VALUES (?, ?, ?, ?, ?, 1, NOW())`,
          [billet.id, billet.evenement_id, scan.resultat, scan.timestamp_scan, scan.timestamp_scan]
        );

        // Si le scan est VALIDE, marquer le billet comme utilisé
        // (remplace le trigger SQL after_scan_billet_insert)
        if (scan.resultat === 'VALIDE') {
          await conn.query(
            "UPDATE billet SET est_utilise = 1, statut = 'UTILISE' WHERE id = ? AND est_utilise = 0",
            [billet.id]
          );
        }

        // Enregistrer dans la table de synchronisation offline
        await conn.query(
          `INSERT INTO synchronisation_offline (controleur_id, evenement_id, type_action, horodatage_action, statut)
           VALUES (?, ?, 'PUSH_SCAN', ?, 'SYNCHRONISE')`,
          [req.controleurId || null, billet.evenement_id, scan.timestamp_scan]
        );
      }

      await conn.commit();
      res.json({ message: `${scans.length} scan(s) synchronisé(s)` });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("Sync scans error:", err);
    res.status(500).json({ message: "Erreur lors de la synchronisation" });
  }
};

module.exports = { syncScans };
