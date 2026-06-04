// Contrôleur des paiements : vérification de statut et notification provider

const pool = require("../config/db");
const PaymentService = require("../services/PaymentService");

const statutPaiement = async (req, res) => {
  try {
    const { reference } = req.params;
    const [rows] = await pool.query(
      "SELECT statut, reference_operateur, moyen_paiement FROM transaction WHERE reference = ?",
      [reference]
    );
    if (!rows.length) return res.status(404).json({ message: "Transaction introuvable" });

    const tx = rows[0];
    let statut = tx.statut;

    // Si la transaction est en attente, vérifier via le provider externe
    if (tx.statut === 'PENDING' && tx.reference_operateur) {
      try {
        const provider = PaymentService.getProvider(tx.moyen_paiement);
        if (provider.verifierPaiement) {
          const result = await provider.verifierPaiement(tx.reference_operateur);

          if (result.statut === 'SUCCESS') {
            statut = 'SUCCESS';
            await pool.query(
              "UPDATE transaction SET statut = 'SUCCESS', date_mise_a_jour = NOW() WHERE reference = ?",
              [reference]
            );
            await pool.query(
              `UPDATE billet SET statut = 'ACTIF' WHERE id = (
                SELECT billet_id FROM transaction WHERE reference = ?
              )`,
              [reference]
            );
          } else if (result.statut === 'FAILED') {
            statut = 'FAILED';
          }
        }
      } catch (err) {
        console.error("Provider verification error:", err);
        // Si le provider est injoignable, on garde PENDING
      }
    }

    res.json({ statut, reference });
  } catch (err) {
    console.error("Statut paiement error:", err);
    res.status(500).json({ message: "Erreur" });
  }
};

module.exports = { statutPaiement };
