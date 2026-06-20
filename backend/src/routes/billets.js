const express = require("express");
const router = express.Router();
const billetController = require("../controllers/billetController");
const authMiddleware = require("../middleware/auth");

// Routes billets sans authentification (le téléphone sert d'identifiant)
router.post("/acheter", billetController.acheter);
router.get("/mes-billets", billetController.mesBillets);

// Route protégée pour l'organisateur : liste des billets vendus pour un événement
// Placée AVANT /:uuid pour éviter que "evenement" soit capturé comme paramètre uuid
router.get("/evenement/:id", authMiddleware(["ORGANISATEUR"]), billetController.evenementBillets);

// Routes du reçu d'achat — à placer avant /:uuid
router.get("/recu/:reference", billetController.afficherRecu);
router.get("/recu/:reference/data", billetController.recuData);

router.get("/:uuid", billetController.afficherBillet);

module.exports = router;
