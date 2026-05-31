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

    // Pour la simulation, le statut est toujours SUCCESS
    // Pour les vrais providers, on appellerait le provider pour vérifier
    let statut = tx.statut;
    if (tx.statut === 'PENDING' && tx.moyen_paiement === 'SIMULATION') {
      const provider = PaymentService.getProvider('SIMULATION');
      const result = await provider.verifierPaiement(tx.reference_operateur);
      statut = result.statut === 'SUCCESS' ? 'SUCCESS' : 'PENDING';

      if (statut === 'SUCCESS') {
        await pool.query(
          "UPDATE transaction SET statut = 'SUCCESS', date_mise_a_jour = NOW() WHERE reference = ?",
          [reference]
        );
        // Activer le billet si le paiement est réussi
        await pool.query(
          `UPDATE billet SET statut = 'ACTIF' WHERE id = (
            SELECT billet_id FROM transaction WHERE reference = ?
          )`,
          [reference]
        );
      }
    }

    res.json({ statut, reference });
  } catch (err) {
    console.error("Statut paiement error:", err);
    res.status(500).json({ message: "Erreur" });
  }
};

module.exports = { statutPaiement };
