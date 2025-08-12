const express = require("express");
const router = express.Router();
const AuthController = require("../../controllers/authController");
const { authenticateToken } = require("../../middleware/auth");
const validators = require("../../middleware/validators");

// Routes publiques
router.post("/register", validators.register, AuthController.register);
router.post("/login", validators.login, AuthController.login);

// Routes protégées
router.get("/profile", authenticateToken, AuthController.getProfile);
router.put(
  "/profile",
  authenticateToken,
  validators.updateProfile,
  AuthController.updateProfile,
);

// Route pour vérifier si le token est valide
router.get("/verify-token", authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: "Token valide",
    userId: req.userId,
  });
});

// Route de déconnexion (côté client, supprimer le token)
router.post("/logout", (req, res) => {
  res.json({
    success: true,
    message: "Déconnexion réussie",
  });
});

module.exports = router;
