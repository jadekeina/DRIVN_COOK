const express = require("express");
const router = express.Router();
const { authenticateToken, requireRole } = require("../../middleware/auth");
const validators = require("../../middleware/validators");

console.log("📁 Chargement du contrôleur franchise...");

// Chargement sécurisé du contrôleur
let franchiseController;
try {
  franchiseController = require("../../controllers/franchise/franchiseController");
  console.log("✅ Contrôleur franchise chargé avec succès");
} catch (error) {
  console.error("❌ Erreur chargement contrôleur:", error.message);

  // Contrôleur de fallback
  franchiseController = {
    getAll: (req, res) => res.json({ success: true, message: "ContrôleurFallback-getAll", data: [] }),
    getById: (req, res) => res.json({ success: true, message: "ContrôleurFallback-getById", data: { id: req.params.id } }),
    create: (req, res) => res.json({ success: true, message: "ContrôleurFallback-create", data: req.body }),
    update: (req, res) => res.json({ success: true, message: "ContrôleurFallback-update", data: { id: req.params.id, ...req.body } }),
    delete: (req, res) => res.json({ success: true, message: "ContrôleurFallback-delete", data: { id: req.params.id } }),
    getMyFranchises: (req, res) => res.json({ success: true, message: "ContrôleurFallback-getMyFranchises", data: [] }),
    getAssignmentData: (req, res) => res.json({ success: true, message: "ContrôleurFallback-getAssignmentData", data: { availableFranchises: [], eligibleUsers: [], summary: {} } }),
    assignFranchise: (req, res) => res.json({ success: true, message: "ContrôleurFallback-assignFranchise" }),
    unassignFranchise: (req, res) => res.json({ success: true, message: "ContrôleurFallback-unassignFranchise" }),
    getEligibleUsers: (req, res) => res.json({ success: true, message: "ContrôleurFallback-getEligibleUsers", data: [] }),
    getAvailableFranchises: (req, res) => res.json({ success: true, message: "ContrôleurFallback-getAvailableFranchises", data: [] }),
    getUserAssignment: (req, res) => res.json({ success: true, message: "ContrôleurFallback-getUserAssignment", data: null }),
    getAssignmentHistory: (req, res) => res.json({ success: true, message: "ContrôleurFallback-getAssignmentHistory", data: [] })
  };
}

console.log("🛣️ Définition des routes...");

// ===============================================
// ROUTES SPÉCIFIQUES D'ABORD (plus spécifiques en premier)
// ===============================================

// Routes admin d'assignation
router.get("/admin/assignment-data", authenticateToken, requireRole(["admin"]), franchiseController.getAssignmentData);
router.get("/admin/assignment-history", authenticateToken, requireRole(["admin"]), franchiseController.getAssignmentHistory);
router.get("/admin/eligible-users", authenticateToken, requireRole(["admin"]), franchiseController.getEligibleUsers);
router.get("/admin/available-franchises", authenticateToken, requireRole(["admin"]), franchiseController.getAvailableFranchises);
router.post("/admin/assign", authenticateToken, requireRole(["admin"]), franchiseController.assignFranchise);
router.post("/admin/unassign/:id", authenticateToken, requireRole(["admin"]), franchiseController.unassignFranchise);

// Routes utilisateur
router.get("/my/franchises", authenticateToken, franchiseController.getMyFranchises);
router.get("/my/assignment", authenticateToken, requireRole(["franchise_owner"]), franchiseController.getUserAssignment);

// ===============================================
// ROUTES GÉNÉRALES APRÈS (moins spécifiques)
// ===============================================

// Route publique - obtenir toutes les franchises
router.get("/", franchiseController.getAll);

// Créer une nouvelle franchise
router.post("/", authenticateToken, requireRole(["admin", "franchise_owner"]), validators.createFranchise, franchiseController.create);

// Mettre à jour une franchise
router.put("/:id", authenticateToken, requireRole(["admin", "franchise_owner"]), validators.createFranchise, franchiseController.update);

// Supprimer une franchise
router.delete("/:id", authenticateToken, requireRole(["admin"]), franchiseController.delete);

// Route publique - obtenir une franchise par ID (DOIT ÊTRE EN DERNIER)
router.get("/:id", franchiseController.getById);

console.log("✅ Routes franchise définies avec succès");

module.exports = router;