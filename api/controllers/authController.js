const User = require('../models/user');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// Générer un token JWT
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET || 'votre-cle-secrete-super-longue-et-complexe-ici',
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
};

const AuthController = {
    // Inscription
    register: async (req, res) => {
        try {
            // Vérifier les erreurs de validation
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Erreurs de validation',
                    errors: errors.array()
                });
            }

            const { email, password, first_name, last_name, role, phone } = req.body;

            // Vérifier si l'utilisateur existe déjà
            User.findByEmail(email, (err, existingUser) => {
                if (err) {
                    console.error('Erreur lors de la recherche utilisateur:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Erreur serveur lors de la vérification'
                    });
                }

                if (existingUser) {
                    return res.status(409).json({
                        success: false,
                        message: 'Un utilisateur avec cet email existe déjà'
                    });
                }

                // Créer le nouvel utilisateur
                User.create({ email, password, first_name, last_name, role, phone }, (err, result) => {
                    if (err) {
                        console.error('Erreur lors de la création utilisateur:', err);
                        return res.status(500).json({
                            success: false,
                            message: 'Erreur lors de la création de l\'utilisateur'
                        });
                    }

                    const token = generateToken(result.insertId);

                    res.status(201).json({
                        success: true,
                        message: 'Utilisateur créé avec succès',
                        data: {
                            user: {
                                id: result.insertId,
                                email,
                                first_name,
                                last_name,
                                role: role || 'customer',
                                phone
                            },
                            token
                        }
                    });
                });
            });
        } catch (error) {
            console.error('Erreur dans register:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    },

    // Connexion
    login: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Erreurs de validation',
                    errors: errors.array()
                });
            }

            const { email, password } = req.body;

            User.findByEmail(email, (err, user) => {
                if (err) {
                    console.error('Erreur lors de la recherche utilisateur:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Erreur serveur'
                    });
                }

                if (!user) {
                    return res.status(401).json({
                        success: false,
                        message: 'Email ou mot de passe incorrect'
                    });
                }

                User.verifyPassword(password, user.password, (err, isMatch) => {
                    if (err) {
                        console.error('Erreur lors de la vérification mot de passe:', err);
                        return res.status(500).json({
                            success: false,
                            message: 'Erreur serveur'
                        });
                    }

                    if (!isMatch) {
                        return res.status(401).json({
                            success: false,
                            message: 'Email ou mot de passe incorrect'
                        });
                    }

                    const token = generateToken(user.id);

                    res.json({
                        success: true,
                        message: 'Connexion réussie',
                        data: {
                            user: {
                                id: user.id,
                                email: user.email,
                                first_name: user.first_name,
                                last_name: user.last_name,
                                role: user.role,
                                phone: user.phone,
                                is_verified: user.is_verified
                            },
                            token
                        }
                    });
                });
            });
        } catch (error) {
            console.error('Erreur dans login:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    },

    // Obtenir le profil utilisateur actuel
    getProfile: async (req, res) => {
        try {
            User.findById(req.userId, (err, user) => {
                if (err) {
                    console.error('Erreur lors de la recherche profil:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Erreur serveur'
                    });
                }

                if (!user) {
                    return res.status(404).json({
                        success: false,
                        message: 'Utilisateur non trouvé'
                    });
                }

                res.json({
                    success: true,
                    data: {
                        user: {
                            id: user.id,
                            email: user.email,
                            first_name: user.first_name,
                            last_name: user.last_name,
                            role: user.role,
                            phone: user.phone,
                            is_verified: user.is_verified,
                            created_at: user.created_at
                        }
                    }
                });
            });
        } catch (error) {
            console.error('Erreur dans getProfile:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    },

    // Mettre à jour le profil
    updateProfile: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Erreurs de validation',
                    errors: errors.array()
                });
            }

            const { first_name, last_name, phone } = req.body;
            const updateData = { first_name, last_name, phone };

            User.update(req.userId, updateData, (err, result) => {
                if (err) {
                    console.error('Erreur lors de la mise à jour:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Erreur lors de la mise à jour'
                    });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'Utilisateur non trouvé'
                    });
                }

                // Récupérer les données mises à jour
                User.findById(req.userId, (err, user) => {
                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: 'Erreur lors de la récupération des données mises à jour'
                        });
                    }

                    res.json({
                        success: true,
                        message: 'Profil mis à jour avec succès',
                        data: {
                            user: {
                                id: user.id,
                                email: user.email,
                                first_name: user.first_name,
                                last_name: user.last_name,
                                role: user.role,
                                phone: user.phone,
                                is_verified: user.is_verified
                            }
                        }
                    });
                });
            });
        } catch (error) {
            console.error('Erreur dans updateProfile:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }
};

module.exports = AuthController;