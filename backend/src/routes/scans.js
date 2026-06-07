// Routes scan : téléchargement offline et validation en ligne des QR tickets
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const scanController = require("../controllers/scanController");

router.get("/tickets/:eventId", authMiddleware(["CONTROLEUR"]), scanController.telechargerTickets);
router.post("/valider", authMiddleware(["CONTROLEUR"]), scanController.validerBillet);
router.post("/sync", authMiddleware(["CONTROLEUR"]), scanController.synchroniserScans);

module.exports = router;
