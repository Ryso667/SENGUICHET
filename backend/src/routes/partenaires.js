/**
 * Routes des demandes de partenariat et gestion des identifiants partenaires
 * POST /api/partenaires — public : soumettre une demande
 * GET /api/partenaires — admin : lister toutes les demandes
 * GET /api/partenaires/stats — admin : statistiques
 * GET /api/partenaires/:id — admin : détail d'une demande
 * PUT /api/partenaires/:id — admin : traiter une demande
 * POST /api/partenaires/creer-identifiants — admin : créer des identifiants pour un partenaire
 * GET /api/partenaires/identifiants — admin : lister les comptes partenaires
 * PUT /api/partenaires/:id/reinitialiser-mot-de-passe — admin : réinitialiser mot de passe
 */
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const {
  soumettreDemande,
  listerDemandes,
  detailDemande,
  traiterDemande,
  statsDemandes,
  creerIdentifiantsPartenaire,
  listerIdentifiants,
  reinitialiserMotDePasse,
} = require("../controllers/partenaireController");

// Public — soumettre une demande
router.post("/", soumettreDemande);

// Admin — lister avec filtre optionnel ?statut=
router.get("/", authMiddleware(["ADMIN"]), listerDemandes);

// Admin — statistiques
router.get("/stats", authMiddleware(["ADMIN"]), statsDemandes);

// Admin — lister les identifiants créés (AVANT /:id pour éviter conflit)
router.get("/identifiants", authMiddleware(["ADMIN"]), listerIdentifiants);

// Admin — créer des identifiants pour une demande acceptée
router.post("/creer-identifiants", authMiddleware(["ADMIN"]), creerIdentifiantsPartenaire);

// Admin — détail d'une demande
router.get("/:id", authMiddleware(["ADMIN"]), detailDemande);

// Admin — traiter une demande (changer statut, ajouter note)
router.put("/:id", authMiddleware(["ADMIN"]), traiterDemande);

// Admin — réinitialiser le mot de passe d'un partenaire
router.put("/:id/reinitialiser-mot-de-passe", authMiddleware(["ADMIN"]), reinitialiserMotDePasse);

module.exports = router;
