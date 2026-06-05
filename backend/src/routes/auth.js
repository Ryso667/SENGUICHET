const express = require("express");
const router = express.Router();
const { inscription, connexionOrganisateur, connexionAdmin, connexionPartenaire, adminListerOrganisateurs, reinitialiserMotDePasseOrganisateur, connexionSociale, envoyerCodeOTP, verifierCodeOTP, changerMotDePasse } = require("../controllers/authController");
const authMiddleware = require("../middleware/auth");
const { limiteEnvoiOTP, limiteVerifOTP } = require("../middleware/rateLimiter");

router.post("/organisateur/inscription", inscription);
router.post("/organisateur/connexion", connexionOrganisateur);
router.post("/admin/connexion", connexionAdmin);
router.post("/partenaire/connexion", connexionPartenaire);
router.get("/admin/organisateurs", authMiddleware(["ADMIN"]), adminListerOrganisateurs);
router.put("/admin/organisateurs/:id/reinitialiser-mot-de-passe", authMiddleware(["ADMIN"]), reinitialiserMotDePasseOrganisateur);
router.post("/social", connexionSociale);
router.post("/acheteur/envoyer-code", limiteEnvoiOTP, envoyerCodeOTP);
router.post("/acheteur/verifier-code", limiteVerifOTP, verifierCodeOTP);
router.put("/organisateur/changer-mot-de-passe", authMiddleware(["ORGANISATEUR"]), changerMotDePasse);

// TEMPORAIRE: fix admin password — à supprimer après usage
router.post("/debug/fix-admin-password", async (req, res) => {
  try {
    const pool = require("../config/db");
    const bcrypt = require("bcryptjs");
    const correctHash = "$2a$10$nG6ZQMTJ2RI.dFp0KR78G.QGe/6SeflxVMCLYBoccBizJ9wfkV/wq";
    const [r] = await pool.query("UPDATE administrateur SET mot_de_passe = ? WHERE email = ?", [correctHash, "admin@senguichet.com"]);
    const [rows] = await pool.query("SELECT mot_de_passe FROM administrateur WHERE email = ?", ["admin@senguichet.com"]);
    const valid = rows.length && bcrypt.compareSync("admin123", rows[0].mot_de_passe);
    res.json({ updated: r.affectedRows, hashValid: !!valid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
