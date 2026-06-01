// Contrôleur des webhooks de paiement
// Reçoit les notifications Wave (checkout.session.completed) et les confirmations Orange Money

const pool = require("../config/db");
const crypto = require("crypto");

const WAVE_SIGNING_SECRET = process.env.WAVE_SIGNING_SECRET;

// Vérifie la signature HMAC d'un webhook Wave
function verifierSignatureWave(signatureHeader, body, timestamp) {
  if (!WAVE_SIGNING_SECRET) return true;
  const payload = String(timestamp) + body;
  const expected = crypto.createHmac('sha256', WAVE_SIGNING_SECRET).update(payload).digest('hex');
  const match = signatureHeader.match(/v1=([a-f0-9]+)/);
  return match && match[1] === expected;
}

// Webhook Wave : checkout.session.completed
const gererWebhookWave = async (req, res) => {
  try {
    const signatureHeader = req.headers['wave-signature'];
    if (!signatureHeader) {
      return res.status(401).json({ message: 'Signature manquante' });
    }

    const timestampMatch = signatureHeader.match(/t=(\d+)/);
    const timestamp = timestampMatch ? parseInt(timestampMatch[1]) : 0;

    // Vérifier que le timestamp est récent (±5 minutes)
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > 300) {
      return res.status(401).json({ message: 'Signature expirée' });
    }

    const rawBody = req.body.toString();
    if (!verifierSignatureWave(signatureHeader, rawBody, timestamp)) {
      return res.status(401).json({ message: 'Signature invalide' });
    }

    const event = JSON.parse(rawBody);

    if (event.type === 'checkout.session.completed') {
      const sessionId = event.data.id;

      const [transactions] = await pool.query(
        "SELECT id, billet_id, reference FROM transaction WHERE reference_operateur = ?",
        [sessionId]
      );

      // Fallback : chercher par référence interne si présente dans les métadonnées
      let tx;
      if (transactions.length > 0) {
        tx = transactions[0];
      } else if (event.data.metadata?.reference) {
        const [fallbackTx] = await pool.query(
          "SELECT id, billet_id, reference FROM transaction WHERE reference = ?",
          [event.data.metadata.reference]
        );
        if (fallbackTx.length > 0) {
          tx = fallbackTx[0];
          // Mettre à jour reference_operateur pour les prochains webhooks
          await pool.query(
            "UPDATE transaction SET reference_operateur = ? WHERE id = ?",
            [sessionId, tx.id]
          );
        }
      }

      if (!tx) {
        return res.status(200).json({ message: 'Ignoré' });
      }

      await pool.query(
        "UPDATE transaction SET statut = 'SUCCESS', date_mise_a_jour = NOW() WHERE id = ?",
        [tx.id]
      );

      await pool.query(
        "UPDATE billet SET statut = 'ACTIF' WHERE id = ?",
        [tx.billet_id]
      );

      console.log(`Paiement Wave confirmé : ${tx.reference}`);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook Wave error:', err);
    res.status(500).json({ message: 'Erreur interne' });
  }
};

// Confirmation Orange Money (appelée par le mobile après OTP)
const gererConfirmationOrange = async (req, res) => {
  try {
    const { msisdn, otp, encryptedPin, montant, reference } = req.body;

    if (!msisdn || !otp || !encryptedPin || !reference) {
      return res.status(400).json({ message: 'Champs obligatoires manquants' });
    }

    const ProviderOrangeMoney = require('./providers/ProviderOrangeMoney');
    const provider = new ProviderOrangeMoney();

    const resultat = await provider.confirmerOtp({
      msisdn,
      otp,
      encryptedPin,
      montant,
      reference,
    });

    if (resultat.status === 'SUCCESS') {
      const [transactions] = await pool.query(
        "SELECT id, billet_id FROM transaction WHERE reference = ?",
        [reference]
      );

      if (transactions.length > 0) {
        const tx = transactions[0];

        await pool.query(
          "UPDATE transaction SET statut = 'SUCCESS', reference_operateur = ?, date_mise_a_jour = NOW() WHERE id = ?",
          [resultat.referenceOperateur || resultat.transactionId, tx.id]
        );

        await pool.query(
          "UPDATE billet SET statut = 'ACTIF' WHERE id = ?",
          [tx.billet_id]
        );

        console.log(`Paiement Orange Money confirmé : ${reference}`);
      }
    }

    res.json({
      success: resultat.status === 'SUCCESS',
      transactionId: resultat.transactionId,
    });
  } catch (err) {
    console.error('Confirmation Orange error:', err);
    res.status(500).json({ success: false, message: 'Erreur interne' });
  }
};

module.exports = { gererWebhookWave, gererConfirmationOrange };
