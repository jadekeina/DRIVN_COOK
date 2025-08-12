// routes/Auth/activation.js - NOUVEAU FICHIER
const express = require("express");
const router = express.Router();
const db = require("../../config/db");
const bcrypt = require("bcryptjs");

// Vérifier si un token d'activation est valide
router.get("/check/:token", (req, res) => {
  const { token } = req.params;

  const query = `
        SELECT ua.*, fc.prenom, fc.nom, fc.email
        FROM user_activations ua
        JOIN franchise_candidatures fc ON ua.candidature_id = fc.id
        WHERE ua.token = ? AND ua.used = FALSE AND ua.expires_at > NOW()
    `;

  db.query(query, [token], (err, results) => {
    if (err) {
      console.error("Erreur vérification token:", err);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Token invalide ou expiré",
      });
    }

    const activation = results[0];
    res.json({
      success: true,
      data: {
        prenom: activation.prenom,
        nom: activation.nom,
        email: activation.email,
        token: token,
      },
    });
  });
});

// Activer le compte et créer l'utilisateur
router.post("/activate", async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: "Token et mot de passe requis",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Le mot de passe doit contenir au moins 6 caractères",
      });
    }

    // Vérifier le token
    const checkQuery = `
            SELECT ua.*, fc.prenom, fc.nom, fc.email, fc.telephone
            FROM user_activations ua
            JOIN franchise_candidatures fc ON ua.candidature_id = fc.id
            WHERE ua.token = ? AND ua.used = FALSE AND ua.expires_at > NOW()
        `;

    db.query(checkQuery, [token], async (err, results) => {
      if (err) {
        console.error("Erreur vérification token:", err);
        return res.status(500).json({
          success: false,
          message: "Erreur serveur",
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Token invalide ou expiré",
        });
      }

      const activation = results[0];

      try {
        // Hash du mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Créer l'utilisateur
        const createUserQuery = `
                    INSERT INTO users (email, password, first_name, last_name, role, phone, is_verified)
                    VALUES (?, ?, ?, ?, 'franchise_owner', ?, TRUE)
                `;

        db.query(
          createUserQuery,
          [
            activation.email,
            hashedPassword,
            activation.prenom,
            activation.nom,
            activation.telephone,
          ],
          (userErr, userResult) => {
            if (userErr) {
              console.error("Erreur création utilisateur:", userErr);

              if (userErr.code === "ER_DUP_ENTRY") {
                return res.status(409).json({
                  success: false,
                  message: "Un compte existe déjà avec cet email",
                });
              }

              return res.status(500).json({
                success: false,
                message: "Erreur lors de la création du compte",
              });
            }

            // Marquer le token comme utilisé
            db.query(
              "UPDATE user_activations SET used = TRUE, used_at = NOW() WHERE token = ?",
              [token],
              (updateErr) => {
                if (updateErr) {
                  console.error("Erreur mise à jour token:", updateErr);
                }
              },
            );

            console.log("✅ Compte créé pour:", activation.email);

            res.json({
              success: true,
              message:
                "Compte créé avec succès ! Vous pouvez maintenant vous connecter.",
              data: {
                userId: userResult.insertId,
                email: activation.email,
                role: "franchise_owner",
              },
            });
          },
        );
      } catch (hashError) {
        console.error("Erreur hash password:", hashError);
        res.status(500).json({
          success: false,
          message: "Erreur lors du traitement du mot de passe",
        });
      }
    });
  } catch (error) {
    console.error("Erreur activation:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
    });
  }
});

module.exports = router;
