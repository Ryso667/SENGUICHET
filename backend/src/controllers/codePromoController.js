/**
 * Contrôleur des codes promo
 * Gère la validation, l'utilisation, la création et le listing des codes promo
 */
const pool = require("../config/db");

// Valider un code promo et retourner la réduction
// POST /api/codes/valider
exports.valider = async (req, res) => {
  try {
    const { code, evenementId, montant } = req.body;
    const [rows] = await pool.query(
      `SELECT * FROM code_promo WHERE code = ? AND actif = 1
       AND date_expiration > NOW()
       AND (evenement_id IS NULL OR evenement_id = ?)
       AND (utilisations_max = 0 OR utilisations_actuelles < utilisations_max)`,
      [code, evenementId || null]
    );
    if (rows.length === 0) return res.status(404).json({ valide: false, message: "Code invalide ou expiré" });

    const promo = rows[0];
    const reduction = promo.type === "pourcentage"
      ? Math.round(montant * promo.valeur / 100)
      : Math.min(Number(promo.valeur), montant);

    res.json({ valide: true, reduction, type: promo.type, valeur: promo.valeur, promoId: promo.id });
  } catch (err) {
    res.status(500).json({ message: "Erreur validation code promo", error: err.message });
  }
};

// Incrémenter le compteur d'utilisation
// POST /api/codes/utiliser
exports.utiliser = async (req, res) => {
  try {
    const { promoId } = req.body;
    await pool.query("UPDATE code_promo SET utilisations_actuelles = utilisations_actuelles + 1 WHERE id = ?", [promoId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Erreur mise à jour code promo", error: err.message });
  }
};

// Lister les codes de l'organisateur connecté
// GET /api/codes/organisateur/codes
exports.lister = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT cp.*, e.titre as evenement_titre
       FROM code_promo cp
       LEFT JOIN evenement e ON cp.evenement_id = e.id
       WHERE cp.organisateur_id = ?
       ORDER BY cp.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Erreur liste codes promo", error: err.message });
  }
};

// Créer un code promo
// POST /api/codes/organisateur/codes
exports.creer = async (req, res) => {
  try {
    const { code, type, valeur, utilisations_max, date_expiration, evenement_id } = req.body;
    await pool.query(
      `INSERT INTO code_promo (organisateur_id, code, type, valeur, utilisations_max, date_expiration, evenement_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, code.toUpperCase(), type, valeur, utilisations_max || 0, date_expiration, evenement_id || null]
    );
    res.status(201).json({ message: "Code promo créé" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "Ce code existe déjà" });
    res.status(500).json({ message: "Erreur création code promo", error: err.message });
  }
};
