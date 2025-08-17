// controllers/franchiseManagementController.js
const db = require('../../config/db');

const FranchiseManagementController = {
    // ===== GESTION DES FRANCHISÉS =====

    // Obtenir tous les franchisés
    getAllFranchisees: (req, res) => {
        try {
            const query = `
                SELECT 
                    u.id,
                    u.email,
                    u.first_name,
                    u.last_name,
                    u.phone,
                    u.is_verified,
                    u.date_franchise,
                    u.droit_entree_paye,
                    u.pourcentage_ca,
                    u.zone_attribution,
                    u.created_at,
                    c.id as camion_id,
                    c.immatriculation,
                    c.statut as camion_statut,
                    c.emplacement_actuel
                FROM users u
                LEFT JOIN camions c ON u.id = c.franchisee_id
                WHERE u.role = 'franchise_owner'
                ORDER BY u.created_at DESC
            `;

            db.query(query, (err, results) => {
                if (err) {
                    console.error('Erreur récupération franchisés:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Erreur lors de la récupération des franchisés'
                    });
                }

                res.json({
                    success: true,
                    data: results,
                    count: results.length
                });
            });
        } catch (error) {
            console.error('Erreur dans getAllFranchisees:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    },

    // Créer un nouveau franchisé
    createFranchisee: async (req, res) => {
        try {
            const {
                email,
                first_name,
                last_name,
                phone,
                zone_attribution,
                droit_entree_paye = false,
                pourcentage_ca = 4.00
            } = req.body;

            // Générer un mot de passe temporaire
            const bcrypt = require('bcryptjs');
            const tempPassword = Math.random().toString(36).slice(-8);
            const hashedPassword = await bcrypt.hash(tempPassword, 10);

            const insertQuery = `
                INSERT INTO users (
                    email, password, first_name, last_name, phone, 
                    role, is_verified, date_franchise, droit_entree_paye, 
                    pourcentage_ca, zone_attribution
                ) VALUES (?, ?, ?, ?, ?, 'franchise_owner', TRUE, CURDATE(), ?, ?, ?)
            `;

            db.query(insertQuery, [
                email, hashedPassword, first_name, last_name, phone,
                droit_entree_paye, pourcentage_ca, zone_attribution
            ], (err, result) => {
                if (err) {
                    console.error('Erreur création franchisé:', err);
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.status(409).json({
                            success: false,
                            message: 'Un utilisateur avec cet email existe déjà'
                        });
                    }
                    return res.status(500).json({
                        success: false,
                        message: 'Erreur lors de la création du franchisé'
                    });
                }

                res.status(201).json({
                    success: true,
                    message: 'Franchisé créé avec succès',
                    data: {
                        id: result.insertId,
                        email,
                        tempPassword // À envoyer par email en prod
                    }
                });
            });
        } catch (error) {
            console.error('Erreur dans createFranchisee:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    },

    // Mettre à jour un franchisé
    updateFranchisee: (req, res) => {
        try {
            const { id } = req.params;
            const {
                first_name,
                last_name,
                phone,
                zone_attribution,
                droit_entree_paye,
                pourcentage_ca,
                is_verified
            } = req.body;

            const updateQuery = `
                UPDATE users 
                SET first_name = ?, last_name = ?, phone = ?, 
                    zone_attribution = ?, droit_entree_paye = ?, 
                    pourcentage_ca = ?, is_verified = ?
                WHERE id = ? AND role = 'franchise_owner'
            `;

            db.query(updateQuery, [
                first_name, last_name, phone, zone_attribution,
                droit_entree_paye, pourcentage_ca, is_verified, id
            ], (err, result) => {
                if (err) {
                    console.error('Erreur mise à jour franchisé:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Erreur lors de la mise à jour'
                    });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'Franchisé non trouvé'
                    });
                }

                res.json({
                    success: true,
                    message: 'Franchisé mis à jour avec succès'
                });
            });
        } catch (error) {
            console.error('Erreur dans updateFranchisee:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    },

    // Supprimer un franchisé
    deleteFranchisee: (req, res) => {
        try {
            const { id } = req.params;

            // Vérifier s'il a un camion assigné
            db.query(
                'SELECT COUNT(*) as count FROM camions WHERE franchisee_id = ?',
                [id],
                (err, results) => {
                    if (err) {
                        console.error('Erreur vérification camion:', err);
                        return res.status(500).json({
                            success: false,
                            message: 'Erreur serveur'
                        });
                    }

                    if (results[0].count > 0) {
                        return res.status(400).json({
                            success: false,
                            message: 'Impossible de supprimer : un camion est encore assigné à ce franchisé'
                        });
                    }

                    // Supprimer le franchisé
                    db.query(
                        'DELETE FROM users WHERE id = ? AND role = \'franchise_owner\'',
                        [id],
                        (deleteErr, deleteResult) => {
                            if (deleteErr) {
                                console.error('Erreur suppression franchisé:', deleteErr);
                                return res.status(500).json({
                                    success: false,
                                    message: 'Erreur lors de la suppression'
                                });
                            }

                            if (deleteResult.affectedRows === 0) {
                                return res.status(404).json({
                                    success: false,
                                    message: 'Franchisé non trouvé'
                                });
                            }

                            res.json({
                                success: true,
                                message: 'Franchisé supprimé avec succès'
                            });
                        }
                    );
                }
            );
        } catch (error) {
            console.error('Erreur dans deleteFranchisee:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    },

    // ===== GESTION DES CAMIONS =====

    // Obtenir tous les camions
    getAllCamions: (req, res) => {
        try {
            const query = `
                SELECT 
                    c.*,
                    u.first_name,
                    u.last_name,
                    u.email as franchisee_email
                FROM camions c
                LEFT JOIN users u ON c.franchisee_id = u.id
                ORDER BY c.created_at DESC
            `;

            db.query(query, (err, results) => {
                if (err) {
                    console.error('Erreur récupération camions:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Erreur lors de la récupération des camions'
                    });
                }

                res.json({
                    success: true,
                    data: results,
                    count: results.length
                });
            });
        } catch (error) {
            console.error('Erreur dans getAllCamions:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    },

    // Créer un nouveau camion
    createCamion: (req, res) => {
        try {
            const {
                immatriculation,
                modele,
                annee,
                franchisee_id = null,
                emplacement_actuel = null
            } = req.body;

            const insertQuery = `
                INSERT INTO camions (
                    immatriculation, modele, annee, franchisee_id, 
                    emplacement_actuel, date_attribution
                ) VALUES (?, ?, ?, ?, ?, ?)
            `;

            const dateAttribution = franchisee_id ? new Date() : null;

            db.query(insertQuery, [
                immatriculation, modele, annee, franchisee_id,
                emplacement_actuel, dateAttribution
            ], (err, result) => {
                if (err) {
                    console.error('Erreur création camion:', err);
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.status(409).json({
                            success: false,
                            message: 'Un camion avec cette immatriculation existe déjà'
                        });
                    }
                    return res.status(500).json({
                        success: false,
                        message: 'Erreur lors de la création du camion'
                    });
                }

                res.status(201).json({
                    success: true,
                    message: 'Camion créé avec succès',
                    data: {
                        id: result.insertId
                    }
                });
            });
        } catch (error) {
            console.error('Erreur dans createCamion:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    },

    // Assigner/désassigner un camion à un franchisé
    assignCamion: (req, res) => {
        try {
            const { camionId } = req.params;
            const { franchisee_id } = req.body;

            const updateQuery = `
                UPDATE camions 
                SET franchisee_id = ?, 
                    date_attribution = ?,
                    statut = ?
                WHERE id = ?
            `;

            const dateAttribution = franchisee_id ? new Date() : null;
            const statut = franchisee_id ? 'en_service' : 'disponible';

            db.query(updateQuery, [
                franchisee_id, dateAttribution, statut, camionId
            ], (err, result) => {
                if (err) {
                    console.error('Erreur assignation camion:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Erreur lors de l\'assignation'
                    });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'Camion non trouvé'
                    });
                }

                res.json({
                    success: true,
                    message: franchisee_id ? 'Camion assigné avec succès' : 'Camion désassigné avec succès'
                });
            });
        } catch (error) {
            console.error('Erreur dans assignCamion:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    },

    // Mettre à jour un camion
    updateCamion: (req, res) => {
        try {
            const { id } = req.params;
            const {
                immatriculation,
                modele,
                annee,
                statut,
                emplacement_actuel
            } = req.body;

            const updateQuery = `
                UPDATE camions 
                SET immatriculation = ?, modele = ?, annee = ?, 
                    statut = ?, emplacement_actuel = ?
                WHERE id = ?
            `;

            db.query(updateQuery, [
                immatriculation, modele, annee, statut, emplacement_actuel, id
            ], (err, result) => {
                if (err) {
                    console.error('Erreur mise à jour camion:', err);
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.status(409).json({
                            success: false,
                            message: 'Un camion avec cette immatriculation existe déjà'
                        });
                    }
                    return res.status(500).json({
                        success: false,
                        message: 'Erreur lors de la mise à jour'
                    });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'Camion non trouvé'
                    });
                }

                res.json({
                    success: true,
                    message: 'Camion mis à jour avec succès'
                });
            });
        } catch (error) {
            console.error('Erreur dans updateCamion:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    },

    // Signaler une panne
    reportPanne: (req, res) => {
        try {
            const { camionId } = req.params;
            const { description, cout = 0 } = req.body;

            // Mettre à jour le statut du camion
            db.query(
                'UPDATE camions SET statut = \'en_panne\' WHERE id = ?',
                [camionId],
                (updateErr) => {
                    if (updateErr) {
                        console.error('Erreur mise à jour statut camion:', updateErr);
                        return res.status(500).json({
                            success: false,
                            message: 'Erreur lors de la mise à jour du statut'
                        });
                    }

                    // Ajouter l'entrée de maintenance
                    const insertQuery = `
                        INSERT INTO camions_maintenance (
                            camion_id, type, description, date_intervention, cout
                        ) VALUES (?, 'panne', ?, CURDATE(), ?)
                    `;

                    db.query(insertQuery, [camionId, description, cout], (insertErr) => {
                        if (insertErr) {
                            console.error('Erreur ajout maintenance:', insertErr);
                            return res.status(500).json({
                                success: false,
                                message: 'Erreur lors de l\'enregistrement de la panne'
                            });
                        }

                        res.json({
                            success: true,
                            message: 'Panne signalée avec succès'
                        });
                    });
                }
            );
        } catch (error) {
            console.error('Erreur dans reportPanne:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    },

    // Obtenir les statistiques du dashboard
    getDashboardStats: (req, res) => {
        try {
            const queries = {
                franchisees: 'SELECT COUNT(*) as total, SUM(is_verified) as actifs FROM users WHERE role = "franchise_owner"',
                camions: 'SELECT statut, COUNT(*) as count FROM camions GROUP BY statut',
                pannes: 'SELECT COUNT(*) as count FROM camions WHERE statut = "en_panne"',
                maintenance: 'SELECT COUNT(*) as count FROM camions_maintenance WHERE statut != "termine" AND type = "entretien"'
            };

            // Exécuter toutes les requêtes
            Promise.all([
                new Promise((resolve, reject) => {
                    db.query(queries.franchisees, (err, results) => {
                        if (err) reject(err);
                        else resolve(results[0]);
                    });
                }),
                new Promise((resolve, reject) => {
                    db.query(queries.camions, (err, results) => {
                        if (err) reject(err);
                        else resolve(results);
                    });
                }),
                new Promise((resolve, reject) => {
                    db.query(queries.pannes, (err, results) => {
                        if (err) reject(err);
                        else resolve(results[0].count);
                    });
                }),
                new Promise((resolve, reject) => {
                    db.query(queries.maintenance, (err, results) => {
                        if (err) reject(err);
                        else resolve(results[0].count);
                    });
                })
            ]).then(([franchisees, camions, pannes, maintenance]) => {
                // Transformer les données camions
                const camionsStats = {
                    total: 0,
                    disponible: 0,
                    en_service: 0,
                    en_panne: 0,
                    maintenance: 0
                };

                camions.forEach(stat => {
                    camionsStats.total += stat.count;
                    camionsStats[stat.statut] = stat.count;
                });

                res.json({
                    success: true,
                    data: {
                        franchisees: {
                            total: franchisees.total,
                            actifs: franchisees.actifs,
                            inactifs: franchisees.total - franchisees.actifs
                        },
                        camions: camionsStats,
                        alertes: {
                            pannes: pannes,
                            maintenance_due: maintenance
                        }
                    }
                });
            }).catch(error => {
                console.error('Erreur récupération stats:', error);
                res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la récupération des statistiques'
                });
            });
        } catch (error) {
            console.error('Erreur dans getDashboardStats:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }
};

module.exports = FranchiseManagementController;