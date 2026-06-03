const express = require("express");
const router = express.Router();
const { inscription, connexionOrganisateur, connexionAdmin, connexionPartenaire, adminListerOrganisateurs, reinitialiserMotDePasseOrganisateur } = require("../controllers/authController");
const authMiddleware = require("../middleware/auth");

router.post("/organisateur/inscription", inscription);
router.post("/organisateur/connexion", connexionOrganisateur);
router.post("/admin/connexion", connexionAdmin);
router.post("/partenaire/connexion", connexionPartenaire);
router.get("/admin/organisateurs", authMiddleware(["ADMIN"]), adminListerOrganisateurs);
router.put("/admin/organisateurs/:id/reinitialiser-mot-de-passe", authMiddleware(["ADMIN"]), reinitialiserMotDePasseOrganisateur);

module.exports = router;
