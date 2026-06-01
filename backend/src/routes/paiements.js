// Routes de paiement : statut transaction, webhook Wave, confirmation Orange Money

const express = require("express");
const router = express.Router();
const paiementController = require("../controllers/paiementController");
const webhookController = require("../controllers/webhookController");

// Vérification du statut d'une transaction par référence
router.get("/:reference/statut", paiementController.statutPaiement);

// Webhook Wave (body brut pour vérification HMAC)
router.post("/wave/webhook", express.raw({ type: "application/json" }), webhookController.gererWebhookWave);

// Confirmation Orange Money (JSON normal)
router.post("/orange/confirmer", express.json(), webhookController.gererConfirmationOrange);

module.exports = router;
