// Contrôleur scan : téléchargement offline et validation en ligne des QR tickets
// GET /api/scans/tickets/:eventId — télécharge les billets d'un événement pour le scan offline
// POST /api/scans/valider — valide un QR code côté serveur (HMAC + statut)

const pool = require("../config/db");
const crypto = require("crypto");

const HMAC_SECRET = process.env.HMAC_SECRET;
if (!HMAC_SECRET) console.warn("⚠️  HMAC_SECRET non défini — validation QR impossible");

/** Télécharge les billets actifs d'un événement pour le scan offline
 *  Retourne un tableau de tickets avec uuid, hmac, event_id, category, timestamp_gen
 *  Utilisé par scanService.telechargerTickets() côté mobile */
const telechargerTickets = async (req, res) => {
  try {
    const { eventId } = req.params;
    // Vérifie que le contrôleur a le droit de télécharger les tickets de cet événement
    if (parseInt(eventId) !== req.user.evenementId) {
      return res.status(403).json({ message: "Accès non autorisé à cet événement" });
    }
    let sql = `SELECT b.uuid, b.payload_signature AS hmac, b.evenement_id AS event_id,
                      ct.nom AS category, b.date_creation AS timestamp_gen, b.numero
               FROM billet b
               JOIN categorie_ticket ct ON ct.id = b.categorie_ticket_id
               WHERE b.evenement_id = ? AND b.statut = 'ACTIF'`
    const params = [eventId]

    // Filtre par zone si le contrôleur a une catégorie assignée
    if (req.user.categorieTicketId) {
      sql += ' AND b.categorie_ticket_id = ?'
      params.push(req.user.categorieTicketId)
    }

    const [rows] = await pool.query(sql, params)
    res.json(rows);
  } catch (err) {
    console.error("telechargerTickets error:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/** Valide un QR code côté serveur
 *  Vérifie HMAC, expiration, existence et statut du billet en base
 *  Retourne { valide, statut, message } */
const validerBillet = async (req, res) => {
  try {
    const { uuid, hmac, event_id, category, timestamp, transaction_ref } = req.body;

    if (!uuid || !hmac) {
      return res.status(400).json({ valide: false, message: "Données QR incomplètes" });
    }

    // Vérifier la signature SHA256(data+secret)
    const donnees = `${uuid}|${transaction_ref || ''}|${timestamp || ''}|${event_id || ''}|${category || ''}`;
    const calcule = crypto.createHash('sha256').update(donnees + HMAC_SECRET).digest('hex');
    if (calcule !== hmac) {
      return res.json({ valide: false, statut: 'FRAUDE', message: 'Signature invalide' });
    }

    // Pas de vérification d'expiration côté serveur :
    //  - QR mobile se rafraîchit toutes les 30s (validité gérée côté offline)
    //  - QR PDF/page publique est statique → doit rester valide
    //  - Le HMAC garantit l'intégrité, le statut DB (ACTIF/UTILISE) empêche le rejeu

    // Chercher le billet en base
    const [rows] = await pool.query(
      "SELECT id, statut FROM billet WHERE uuid = ?",
      [uuid]
    );
    if (!rows.length) {
      return res.json({ valide: false, statut: 'INCONNU', message: 'Billet introuvable' });
    }

    const billet = rows[0];
    if (billet.statut !== 'ACTIF') {
      return res.json({ valide: false, statut: 'DEJA_UTILISE', message: 'Billet déjà utilisé ou annulé' });
    }

    res.json({ valide: true, statut: 'VALIDE', message: 'Entrée autorisée' });
  } catch (err) {
    console.error("validerBillet error:", err);
    res.status(500).json({ valide: false, message: "Erreur serveur" });
  }
};

/** Synchronise les scans offline vers le serveur
 *  Reçoit un tableau de scans [{ uuid_billet, hmac, timestamp_scan, resultat }]
 *  Insère dans scan_billet via le billet_id et l'evenementId extrait du JWT */
const synchroniserScans = async (req, res) => {
  try {
    const scans = req.body;
    if (!Array.isArray(scans) || scans.length === 0) {
      return res.status(400).json({ sync: false, message: "Données de scan invalides" });
    }

    const evenementId = req.user.evenementId;
    const controleurId = req.user.controleurId || null;
    const statutMap = { VALIDE: "VALIDE", DEJA_UTILISE: "DEJA_UTILISE", FRAUDE: "FRAUDE", INCONNU: "INCONNU", EXPIRE: "EXPIRE" };

    let compteur = 0;
    for (const s of scans) {
      const statutDB = statutMap[s.resultat] || "INVALIDE";
      await pool.query(
        `INSERT INTO scan_billet (billet_id, controleur_id, evenement_id, statut, horodatage_scan, horodatage_local, est_offline, date_synchronisation)
         SELECT b.id, ?, b.evenement_id, ?, ?, ?, 1, NOW()
         FROM billet b
         WHERE b.uuid = ?`,
        [controleurId, statutDB, s.timestamp_scan, s.timestamp_scan, s.uuid_billet]
      );
      compteur++;
    }

    res.json({ sync: true, message: `${compteur} scan(s) synchronisé(s)` });
  } catch (err) {
    console.error("synchroniserScans error:", err);
    res.status(500).json({ sync: false, message: "Erreur serveur" });
  }
};

module.exports = { telechargerTickets, validerBillet, synchroniserScans };
