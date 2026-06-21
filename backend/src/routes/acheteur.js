/**
 * Routes dédiées aux acheteurs
 * POST /api/acheteur/push/register — enregistre un push token Expo
 */
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authAcheteur = require("../middleware/authAcheteur");

// Enregistrer un push token pour l'acheteur connecté
// POST /api/acheteur/push/register
// Body : { pushToken: "ExponentPushToken-xxx" }
// Requiert un JWT valide avec le rôle ACHETEUR
router.post("/push/register", authAcheteur, async (req, res) => {
  try {
    const { pushToken } = req.body;
    if (!pushToken || !pushToken.startsWith("ExponentPushToken")) {
      return res.status(400).json({ message: "Token invalide" });
    }

    // Upsert — si le token existe déjà, on met juste à jour le timestamp
    await db.query(
      `INSERT INTO push_tokens (acheteur_id, token, appareil)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP`,
      [req.user.id, pushToken, "Acheteur"]
    );

    res.json({ message: "Token enregistré" });
  } catch (err) {
    res.status(500).json({ message: "Erreur enregistrement token", error: err.message });
  }
});

module.exports = router;
