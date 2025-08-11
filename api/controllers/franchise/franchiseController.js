const Franchise = require('../../models/franchise');
const { validationResult } = require('express-validator');

const FranchiseController = {
    // Obtenir toutes les franchises (public)
    getAll: (req, res) => {
        try {
            Franchise.getAll((err, results) => {
                if (err) {
                    console.error('Erreur lors de la récupération des franchises:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Erreur lors de la récupération des franchises'
                    });
                }

                res.json({
                    success: true,
                    data: results,
                    count: results.length
                });
            });
        } catch (error) {
            console.error('Erreur dans getAll:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    },

    // Obtenir une franchise par ID (public)
    getById: (req, res) => {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de franchise invalide'
                });
            }

            Franchise.findById(id, (err, result) => {
                if (err) {
                    console.error('Erreur lors de la recherche franchise:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Erreur serveur'
                    });
                }

                if (!result) {
                    return res.status(404).json({
                        success: false,
                        message: 'Franchise non trouvée'
                    });
                }

                res.json({
                    success: true,
                    data: result
                });
            });
        } catch (error) {
            console.error('Erreur dans getById:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    },

    // Créer une nouvelle franchise
    create: (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Erreurs de validation',
                    errors: errors.array()
                });
            }

            // Déterminer l'owner_id selon le rôle
            let franchiseData = { ...req.body };

            if (req.user && req.user.role === 'franchise_owner') {
                // Si c'est un franchise_owner, il devient automatiquement propriétaire
                franchiseData.owner_id = req.userId;
            } else if (req.user && req.user.role === 'admin') {
                // Si c'est un admin, il peut spécifier un owner_id ou le laisser vide
                franchiseData.owner_id = req.body.owner_id || req.userId;
            }

            Franchise.create(franchiseData, (err, result) => {
                if (err) {
                    console.error('Erreur lors de la création franchise:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Erreur lors de la création de la franchise'
                    });
                }

                res.status(201).json({
                    success: true,
                    message: 'Franchise créée avec succès',
                    data: {
                        id: result.insertId,
                        ...franchiseData
                    }
                });
            });
        } catch (error) {
            console.error('Erreur dans create:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    },

    // Mettre à jour une franchise
    update: (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Erreurs de validation',
                    errors: errors.array()
                });
            }

            const { id } = req.params;

            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de franchise invalide'
                });
            }

            // Vérifier que la franchise existe d'abord
            Franchise.findById(id, (err, franchise) => {
                if (err) {
                    console.error('Erreur lors de la recherche franchise:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Erreur serveur'
                    });
                }

                if (!franchise) {
                    return res.status(404).json({
                        success: false,
                        message: 'Franchise non trouvée'
                    });
                }

                // Vérifier les permissions
                if (req.user.role === 'franchise_owner' && franchise.owner_id !== req.userId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Vous n\'êtes pas autorisé à modifier cette franchise'
                    });
                }

                // Effectuer la mise à jour
                Franchise.update(id, req.body, (err, result) => {
                    if (err) {
                        console.error('Erreur lors de la mise à jour franchise:', err);
                        return res.status(500).json({
                            success: false,
                            message: 'Erreur lors de la mise à jour'
                        });
                    }

                    res.json({
                        success: true,
                        message: 'Franchise mise à jour avec succès'
                    });
                });
            });
        } catch (error) {
            console.error('Erreur dans update:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    },

    // Supprimer une franchise (soft delete)
    delete: (req, res) => {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de franchise invalide'
                });
            }

            Franchise.delete(id, (err, result) => {
                if (err) {
                    console.error('Erreur lors de la suppression franchise:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Erreur lors de la suppression'
                    });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'Franchise non trouvée'
                    });
                }

                res.json({
                    success: true,
                    message: 'Franchise supprimée avec succès'
                });
            });
        } catch (error) {
            console.error('Erreur dans delete:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    },

    // Obtenir les franchises de l'utilisateur connecté
    getMyFranchises: (req, res) => {
        try {
            Franchise.findByOwnerId(req.userId, (err, results) => {
                if (err) {
                    console.error('Erreur lors de la récupération des franchises utilisateur:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Erreur serveur'
                    });
                }

                res.json({
                    success: true,
                    data: results,
                    count: results.length
                });
            });
        } catch (error) {
            console.error('Erreur dans getMyFranchises:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }
};

module.exports = FranchiseController;