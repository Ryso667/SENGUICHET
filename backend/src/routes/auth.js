const express = require("express");
const router = express.Router();
const { inscription, connexionOrganisateur, connexionAdmin, connexionPartenaire, connexionControleur, adminListerOrganisateurs, reinitialiserMotDePasseOrganisateur, envoyerCodeOTP, verifierCodeOTP, changerMotDePasse } = require("../controllers/authController");
const authMiddleware = require("../middleware/auth");
const { limiteEnvoiOTP, limiteVerifOTP, limiteConnexionControleur } = require("../middleware/rateLimiter");

router.post("/organisateur/inscription", inscription);
router.post("/organisateur/connexion", connexionOrganisateur);
router.post("/admin/connexion", connexionAdmin);
router.post("/partenaire/connexion", connexionPartenaire);
router.get("/admin/organisateurs", authMiddleware(["ADMIN"]), adminListerOrganisateurs);
router.put("/admin/organisateurs/:id/reinitialiser-mot-de-passe", authMiddleware(["ADMIN"]), reinitialiserMotDePasseOrganisateur);

router.post("/acheteur/envoyer-code", limiteEnvoiOTP, envoyerCodeOTP);
router.post("/acheteur/verifier-code", limiteVerifOTP, verifierCodeOTP);
router.post("/controleur/connexion", limiteConnexionControleur, connexionControleur);
router.put("/organisateur/changer-mot-de-passe", authMiddleware(["ORGANISATEUR"]), changerMotDePasse);

module.exports = router;
