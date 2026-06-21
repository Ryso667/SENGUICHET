/**
 * Routes des codes promo
 */
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/codePromoController");
const auth = require("../middleware/auth");

router.post("/valider", ctrl.valider);
router.post("/utiliser", ctrl.utiliser);
router.get("/organisateur/codes", auth(["ORGANISATEUR"]), ctrl.lister);
router.post("/organisateur/codes", auth(["ORGANISATEUR"]), ctrl.creer);

module.exports = router;
