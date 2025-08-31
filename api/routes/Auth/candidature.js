// routes/Auth/candidature.js
const express = require("express");
const router = express.Router();
const CandidatureController = require("../../controllers/candidatureController");
const { authenticateToken, requireRole } = require("../../middleware/auth");

console.log("📁 Chargement des routes candidatures...");

// Public — créer une candidature
router.post("/", CandidatureController.create);

// Admin — lister toutes les candidatures
router.get("/", authenticateToken, requireRole(["admin"]), CandidatureController.getAll);

// Admin — récupérer une candidature par ID
router.get("/:id", authenticateToken, requireRole(["admin"]), CandidatureController.getById);

// Admin — accepter une candidature
router.post("/:id/accept", authenticateToken, requireRole(["admin"]), CandidatureController.accept);

// Admin — refuser une candidature
router.post("/:id/reject", authenticateToken, requireRole(["admin"]), CandidatureController.reject);

console.log("✅ Routes candidatures définies");
module.exports = router;
