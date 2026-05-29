const express = require("express");
const authRoutes = require("./auth");
const evenementRoutes = require("./evenement");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/evenements", evenementRoutes);

module.exports = router;
