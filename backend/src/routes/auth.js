const express = require("express");
const router = express.Router();
const { inscription, connexionOrganisateur, connexionAdmin, adminListerOrganisateurs } = require("../controllers/authController");
const authMiddleware = require("../middleware/auth");

router.post("/organisateur/inscription", inscription);
router.post("/organisateur/connexion", connexionOrganisateur);
router.post("/admin/connexion", connexionAdmin);
router.get("/admin/organisateurs", authMiddleware(["ADMIN"]), adminListerOrganisateurs);

module.exports = router;
