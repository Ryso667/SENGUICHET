const express = require("express");
const authRoutes = require("./auth");
const evenementRoutes = require("./evenement");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/evenements", evenementRoutes);
router.use("/billets", require("./billets"));
router.use("/paiements", require("./paiements"));
router.use("/partenaires", require("./partenaires"));
router.use("/demandes", require("./demandes"));
router.use("/controleurs", require("./controleur"));

module.exports = router;
