const express = require("express");
const router = express.Router();
const CandidatureController = require("../../controllers/candidatureController");
const { authenticateToken, requireRole } = require("../../middleware/auth");
const validators = require("../../middleware/validators");

console.log("📁 Chargement des routes candidatures...");

// Route publique - Soumettre une candidature
router.post(
  "/",
  CandidatureController.uploadFiles, // Middleware multer pour upload
  validators.createCandidature,
  CandidatureController.create,
);

// Routes admin - Gestion des candidatures
router.get(
  "/",

  CandidatureController.getAll,
);

router.get(
  "/stats",

  CandidatureController.getStats,
);

router.get(
  "/:id",

  CandidatureController.getById,
);

router.put(
  "/:id/status",

  CandidatureController.updateStatus,
);

// Route pour télécharger un fichier (admin)
router.get(
  "/download/:candidatureId/:type",
  authenticateToken,
  requireRole(["admin"]),
  (req, res) => {
    // Cette route sera implémentée pour télécharger les fichiers
    res.json({
      success: false,
      message: "Téléchargement de fichiers - À implémenter",
    });
  },
);

console.log("✅ Routes candidatures définies");

module.exports = router;
