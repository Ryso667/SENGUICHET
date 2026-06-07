const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const {
  listerEvenements,
  listerCode,
  regenerer,
  desactiver,
} = require("../controllers/controleurController");

router.get("/evenements", authMiddleware(["ADMIN"]), listerEvenements);
router.get("/:evenementId", authMiddleware(["ADMIN"]), listerCode);
router.post("/:evenementId/regenerer", authMiddleware(["ADMIN"]), regenerer);
router.post("/:evenementId/desactiver", authMiddleware(["ADMIN"]), desactiver);

module.exports = router;
