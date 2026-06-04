// Routes de paiement : statut transaction et webhook Wave

const express = require("express");
const router = express.Router();
const paiementController = require("../controllers/paiementController");
const webhookController = require("../controllers/webhookController");
// Redirections Wave Checkout (l'utilisateur revient ici depuis la WebView)
router.get("/wave/success/:reference", (req, res) => {
  res.status(200).json({ message: 'Paiement Wave terminé', reference: req.params.reference });
});
router.get("/wave/error/:reference", (req, res) => {
  res.status(200).json({ message: 'Paiement Wave annulé', reference: req.params.reference });
});

// Vérification du statut d'une transaction par référence
router.get("/:reference/statut", paiementController.statutPaiement);

// Webhook Wave (body brut pour vérification HMAC)
router.post("/wave/webhook", express.raw({ type: "application/json" }), webhookController.gererWebhookWave);

module.exports = router;
