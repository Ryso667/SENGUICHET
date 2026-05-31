const express = require("express");
const authRoutes = require("./auth");
const evenementRoutes = require("./evenement");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/evenements", evenementRoutes);
router.use("/billets", require("./billets"));

module.exports = router;
