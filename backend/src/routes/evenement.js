const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const e = require("../controllers/evenementController");

// Organisateur routes
router.post("/", authMiddleware(["ORGANISATEUR"]), e.creer);
router.get("/", authMiddleware(["ORGANISATEUR"]), e.lister);
router.get("/:id", authMiddleware(["ORGANISATEUR"]), e.detail);
router.put("/:id", authMiddleware(["ORGANISATEUR"]), e.modifier);
router.put("/:id/annuler", authMiddleware(["ORGANISATEUR"]), e.annuler);

// Admin routes
router.get("/admin/all", authMiddleware(["ADMIN"]), e.adminLister);
router.get("/admin/:id", authMiddleware(["ADMIN"]), e.adminDetail);
router.put("/admin/:id/accepter", authMiddleware(["ADMIN"]), e.adminAccepter);
router.put("/admin/:id/refuser", authMiddleware(["ADMIN"]), e.adminRefuser);
router.put("/admin/:id/suspendre", authMiddleware(["ADMIN"]), e.adminSuspendre);

module.exports = router;
