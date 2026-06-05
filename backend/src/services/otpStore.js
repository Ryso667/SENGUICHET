/**
 * Stockage des codes OTP en base de données MySQL
 * Compatible Vercel (serverless) — contrairement au stockage fichier
 * TTL : 5 minutes, nettoyage à la création et via vérification
 */
const pool = require("../config/db");

const TTL_MINUTES = 5;

/**
 * Stocke un code OTP pour un email donné
 * Remplace tout code existant non utilisé pour le même email
 * @param {string} email - Email de l'acheteur
 * @param {string} code - Code OTP à 6 chiffres
 */
const STOCKER_CODE = async (email, code) => {
  const emailLower = email.toLowerCase();
  // Invalide les anciens codes pour cet email
  await pool.query(
    `UPDATE code_otp SET est_utilise = 1
     WHERE email = ? AND est_utilise = 0 AND type = 'AUTH'`,
    [emailLower]
  );
  // Insère le nouveau code
  await pool.query(
    `INSERT INTO code_otp (telephone, email, code, type, date_expiration)
     VALUES (?, ?, ?, 'AUTH', DATE_ADD(NOW(), INTERVAL ? MINUTE))`,
    ['', emailLower, code, TTL_MINUTES]
  );
};

/**
 * Vérifie un code OTP sans le consommer
 * @param {string} email - Email de l'acheteur
 * @param {string} code - Code OTP à vérifier
 * @returns {Promise<number|false>} id du code si valide, false sinon
 */
const CHECK_CODE = async (email, code) => {
  const emailLower = email.toLowerCase();
  const [rows] = await pool.query(
    `SELECT id FROM code_otp
     WHERE email = ? AND code = ? AND type = 'AUTH'
       AND est_utilise = 0 AND date_expiration > NOW()
     LIMIT 1`,
    [emailLower, code]
  );
  return rows.length > 0 ? rows[0].id : false;
};

/**
 * Consomme un code OTP (marque comme utilisé)
 * @param {number} id - ID du code à consommer
 */
const CONSOMMER_CODE = async (id) => {
  await pool.query("UPDATE code_otp SET est_utilise = 1 WHERE id = ?", [id]);
};

/**
 * Supprime les codes expirés pour un email
 * @param {string} email - Email dont il faut nettoyer les codes
 */
const SUPPRIMER_CODE = async (email) => {
  const emailLower = email.toLowerCase();
  await pool.query(
    "DELETE FROM code_otp WHERE email = ? AND type = 'AUTH'",
    [emailLower]
  );
};

module.exports = { STOCKER_CODE, CHECK_CODE, CONSOMMER_CODE, SUPPRIMER_CODE };
