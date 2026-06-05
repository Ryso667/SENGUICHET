// Route de synchronisation des scans offline
const express = require("express");
const router = express.Router();
const scanController = require("../controllers/scanController");
const authMiddleware = require("../middleware/auth");

// POST /api/scans/sync — reçoit un lot de scans offline d'un contrôleur
router.post("/sync", authMiddleware(["CONTROLEUR"]), scanController.syncScans);

module.exports = router;
