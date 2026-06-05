/**
 * Routes pour les demandes d'événements (workflow Organisateur → Admin)
 */
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const d = require("../controllers/demandeController");

// Organisateur - soumettre et lister ses demandes
router.post("/", authMiddleware(["ORGANISATEUR"]), d.soumettreDemande);
router.get("/", authMiddleware(["ORGANISATEUR"]), d.listerMesDemandes);
router.get("/:id", authMiddleware(["ORGANISATEUR"]), d.detailDemande);

// Admin - lister et traiter les demandes
router.get("/admin/all", authMiddleware(["ADMIN"]), d.adminListerDemandes);
router.get("/admin/:id", authMiddleware(["ADMIN"]), d.adminDetailDemande);
router.put("/admin/:id/traiter", authMiddleware(["ADMIN"]), d.adminTraiterDemande);
router.post("/admin/:id/creer-evenement", authMiddleware(["ADMIN"]), d.adminCreerEvenement);

module.exports = router;
