const express = require("express");
const router = express.Router();
const { inscription, connexionOrganisateur, connexionAdmin, adminListerOrganisateurs, connexionSociale } = require("../controllers/authController");
const authMiddleware = require("../middleware/auth");

router.post("/organisateur/inscription", inscription);
router.post("/organisateur/connexion", connexionOrganisateur);
router.post("/admin/connexion", connexionAdmin);
router.get("/admin/organisateurs", authMiddleware(["ADMIN"]), adminListerOrganisateurs);
router.post("/social", connexionSociale);

module.exports = router;
