const express = require("express");
const router = express.Router();
const { inscription, connexionOrganisateur, connexionAdmin, connexionPartenaire, adminListerOrganisateurs, reinitialiserMotDePasseOrganisateur, connexionSociale, envoyerCodeOTP, verifierCodeOTP, changerMotDePasse, connexionControleur } = require("../controllers/authController");
const authMiddleware = require("../middleware/auth");
const { limiteEnvoiOTP, limiteVerifOTP, limiteConnexion, limiteConnexionAdmin } = require("../middleware/rateLimiter");

router.post("/organisateur/inscription", inscription);
router.post("/organisateur/connexion", limiteConnexion, connexionOrganisateur);
router.post("/admin/connexion", limiteConnexionAdmin, connexionAdmin);
router.post("/partenaire/connexion", limiteConnexion, connexionPartenaire);
router.get("/admin/organisateurs", authMiddleware(["ADMIN"]), adminListerOrganisateurs);
router.put("/admin/organisateurs/:id/reinitialiser-mot-de-passe", authMiddleware(["ADMIN"]), reinitialiserMotDePasseOrganisateur);
router.post("/social", connexionSociale);
router.post("/acheteur/envoyer-code", limiteEnvoiOTP, envoyerCodeOTP);
router.post("/acheteur/verifier-code", limiteVerifOTP, verifierCodeOTP);
router.put("/organisateur/changer-mot-de-passe", authMiddleware(["ORGANISATEUR"]), changerMotDePasse);
router.post("/controleur", limiteConnexion, connexionControleur);

module.exports = router;
