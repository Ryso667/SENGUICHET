const express = require("express");
const router = express.Router();
const paiementController = require("../controllers/paiementController");

router.get("/:reference/statut", paiementController.statutPaiement);

module.exports = router;
