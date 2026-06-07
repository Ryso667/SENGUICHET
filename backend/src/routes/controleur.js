const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const {
  listerEvenements,
  listerCodes,
  regenerer,
  desactiverTous,
} = require("../controllers/controleurController");

router.get("/evenements", authMiddleware(["ADMIN"]), listerEvenements);
router.get("/:evenementId", authMiddleware(["ADMIN"]), listerCodes);
router.post("/:evenementId/regenerer", authMiddleware(["ADMIN"]), regenerer);
router.post("/:evenementId/desactiver", authMiddleware(["ADMIN"]), desactiverTous);

module.exports = router;
