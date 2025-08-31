const Franchise = require("../../models/franchise");
const { validationResult } = require("express-validator");

const FranchiseController = {
  // Méthodes existantes conservées
  getAll: (req, res) => {
    try {
      Franchise.getAll((err, results) => {
        if (err) {
          console.error("Erreur lors de la récupération des franchises:", err);
          return res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération des franchises",
          });
        }

        res.json({
          success: true,
          data: results,
          count: results.length,
        });
      });
    } catch (error) {
      console.error("Erreur dans getAll:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  getById: (req, res) => {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID de franchise invalide",
        });
      }

      Franchise.findById(id, (err, result) => {
        if (err) {
          console.error("Erreur lors de la recherche franchise:", err);
          return res.status(500).json({
            success: false,
            message: "Erreur serveur",
          });
        }

        if (!result) {
          return res.status(404).json({
            success: false,
            message: "Franchise non trouvée",
          });
        }

        res.json({
          success: true,
          data: result,
        });
      });
    } catch (error) {
      console.error("Erreur dans getById:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  create: (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Erreurs de validation",
          errors: errors.array(),
        });
      }

      let franchiseData = { ...req.body };

      if (req.user && req.user.role === "franchise_owner") {
        franchiseData.owner_id = req.userId;
      } else if (req.user && req.user.role === "admin") {
        franchiseData.owner_id = req.body.owner_id || req.userId;
      }

      Franchise.create(franchiseData, (err, result) => {
        if (err) {
          console.error("Erreur lors de la création franchise:", err);
          return res.status(500).json({
            success: false,
            message: "Erreur lors de la création de la franchise",
          });
        }

        res.status(201).json({
          success: true,
          message: "Franchise créée avec succès",
          data: {
            id: result.insertId,
            ...franchiseData,
          },
        });
      });
    } catch (error) {
      console.error("Erreur dans create:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  update: (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Erreurs de validation",
          errors: errors.array(),
        });
      }

      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID de franchise invalide",
        });
      }

      Franchise.findById(id, (err, franchise) => {
        if (err) {
          console.error("Erreur lors de la recherche franchise:", err);
          return res.status(500).json({
            success: false,
            message: "Erreur serveur",
          });
        }

        if (!franchise) {
          return res.status(404).json({
            success: false,
            message: "Franchise non trouvée",
          });
        }

        if (
            req.user.role === "franchise_owner" &&
            franchise.owner_id !== req.userId
        ) {
          return res.status(403).json({
            success: false,
            message: "Vous n'êtes pas autorisé à modifier cette franchise",
          });
        }

        Franchise.update(id, req.body, (err, result) => {
          if (err) {
            console.error("Erreur lors de la mise à jour franchise:", err);
            return res.status(500).json({
              success: false,
              message: "Erreur lors de la mise à jour",
            });
          }

          res.json({
            success: true,
            message: "Franchise mise à jour avec succès",
          });
        });
      });
    } catch (error) {
      console.error("Erreur dans update:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  delete: (req, res) => {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID de franchise invalide",
        });
      }

      Franchise.delete(id, (err, result) => {
        if (err) {
          console.error("Erreur lors de la suppression franchise:", err);
          return res.status(500).json({
            success: false,
            message: "Erreur lors de la suppression",
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            success: false,
            message: "Franchise non trouvée",
          });
        }

        res.json({
          success: true,
          message: "Franchise supprimée avec succès",
        });
      });
    } catch (error) {
      console.error("Erreur dans delete:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  getMyFranchises: (req, res) => {
    try {
      Franchise.findByOwnerId(req.userId, (err, results) => {
        if (err) {
          console.error(
              "Erreur lors de la récupération des franchises utilisateur:",
              err,
          );
          return res.status(500).json({
            success: false,
            message: "Erreur serveur",
          });
        }

        res.json({
          success: true,
          data: results,
          count: results.length,
        });
      });
    } catch (error) {
      console.error("Erreur dans getMyFranchises:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // NOUVELLES MÉTHODES pour la gestion des assignations

  // Obtenir les données pour la page d'assignation
  getAssignmentData: (req, res) => {
    try {
      // Récupérer les franchises disponibles
      Franchise.getAvailableFranchises((err, availableFranchises) => {
        if (err) {
          console.error("Erreur récupération franchises disponibles:", err);
          return res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération des franchises disponibles",
          });
        }

        // Récupérer les utilisateurs éligibles
        Franchise.getEligibleUsers((err, eligibleUsers) => {
          if (err) {
            console.error("Erreur récupération utilisateurs éligibles:", err);
            return res.status(500).json({
              success: false,
              message: "Erreur lors de la récupération des utilisateurs éligibles",
            });
          }

          // Récupérer le résumé des assignations
          Franchise.getAssignmentSummary((err, summary) => {
            if (err) {
              console.error("Erreur récupération résumé:", err);
              return res.status(500).json({
                success: false,
                message: "Erreur lors de la récupération du résumé",
              });
            }

            res.json({
              success: true,
              data: {
                availableFranchises,
                eligibleUsers,
                summary: summary[0] || {
                  total_franchises: 0,
                  franchises_assignees: 0,
                  franchises_disponibles: 0
                }
              }
            });
          });
        });
      });
    } catch (error) {
      console.error("Erreur dans getAssignmentData:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Assigner une franchise à un utilisateur
  assignFranchise: (req, res) => {
    try {
      const { franchiseId, userId } = req.body;

      // Validation des paramètres
      if (!franchiseId || !userId || isNaN(franchiseId) || isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: "ID de franchise et ID utilisateur requis",
        });
      }

      Franchise.assignFranchiseToUser(franchiseId, userId, (err, result) => {
        if (err) {
          console.error("Erreur assignation franchise:", err);
          return res.status(400).json({
            success: false,
            message: err.message || "Erreur lors de l'assignation",
          });
        }

        res.json({
          success: true,
          message: "Franchise assignée avec succès",
          data: result
        });
      });
    } catch (error) {
      console.error("Erreur dans assignFranchise:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Désassigner une franchise
  unassignFranchise: (req, res) => {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID de franchise invalide",
        });
      }

      Franchise.unassignFranchise(id, (err, result) => {
        if (err) {
          console.error("Erreur désassignation franchise:", err);
          return res.status(400).json({
            success: false,
            message: err.message || "Erreur lors de la désassignation",
          });
        }

        res.json({
          success: true,
          message: "Franchise libérée avec succès",
          data: result
        });
      });
    } catch (error) {
      console.error("Erreur dans unassignFranchise:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Obtenir uniquement les utilisateurs éligibles
  getEligibleUsers: (req, res) => {
    try {
      Franchise.getEligibleUsers((err, results) => {
        if (err) {
          console.error("Erreur récupération utilisateurs éligibles:", err);
          return res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération des utilisateurs éligibles",
          });
        }

        res.json({
          success: true,
          data: results,
          count: results.length
        });
      });
    } catch (error) {
      console.error("Erreur dans getEligibleUsers:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Obtenir uniquement les franchises disponibles
  getAvailableFranchises: (req, res) => {
    try {
      Franchise.getAvailableFranchises((err, results) => {
        if (err) {
          console.error("Erreur récupération franchises disponibles:", err);
          return res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération des franchises disponibles",
          });
        }

        res.json({
          success: true,
          data: results,
          count: results.length
        });
      });
    } catch (error) {
      console.error("Erreur dans getAvailableFranchises:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // NOUVELLE MÉTHODE: Obtenir l'assignation d'un utilisateur spécifique
  getUserAssignment: (req, res) => {
    try {
      const userId = req.userId; // Utilisateur connecté

      Franchise.getUserAssignment(userId, (err, result) => {
        if (err) {
          console.error("Erreur récupération assignation utilisateur:", err);
          return res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération de votre assignation",
          });
        }

        if (!result) {
          return res.json({
            success: true,
            message: "Aucune franchise assignée",
            data: null
          });
        }

        res.json({
          success: true,
          message: "Assignation trouvée",
          data: result
        });
      });
    } catch (error) {
      console.error("Erreur dans getUserAssignment:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // NOUVELLE MÉTHODE: Obtenir l'historique des assignations (admin seulement)
  getAssignmentHistory: (req, res) => {
    try {
      Franchise.getAssignmentHistory((err, results) => {
        if (err) {
          console.error("Erreur récupération historique assignations:", err);
          return res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération de l'historique",
          });
        }

        res.json({
          success: true,
          data: results,
          count: results.length
        });
      });
    } catch (error) {
      console.error("Erreur dans getAssignmentHistory:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  }
};

module.exports = FranchiseController;