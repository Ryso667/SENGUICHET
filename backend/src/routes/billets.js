const express = require("express");
const router = express.Router();
const billetController = require("../controllers/billetController");

// Routes billets sans authentification (le téléphone sert d'identifiant)
router.post("/acheter", billetController.acheter);
router.get("/mes-billets", billetController.mesBillets);

module.exports = router;
