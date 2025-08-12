const Candidature = require('../models/candidature');
const { validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const emailService = require('../services/email.Service');
const crypto = require('crypto'); // AJOUTE EN HAUT DU FICHIER


// Fonction pour normaliser le numéro de téléphone
const normalizePhoneNumber = (phone) => {
    console.log('Normalisation téléphone - Input:', phone);

    // Supprimer tous les espaces, tirets, points
    let cleanPhone = phone.replace(/[\s\-\.]/g, '');
    console.log('Téléphone après nettoyage:', cleanPhone);

    // Convertir +33 en 0
    if (cleanPhone.startsWith('+33')) {
        cleanPhone = '0' + cleanPhone.substring(3);
        console.log('Conversion +33 -> 0:', cleanPhone);
    } else if (cleanPhone.startsWith('0033')) {
        cleanPhone = '0' + cleanPhone.substring(4);
        console.log('Conversion 0033 -> 0:', cleanPhone);
    }

    // S'assurer que le numéro a 10 chiffres
    if (cleanPhone.length > 10) {
        cleanPhone = cleanPhone.substring(0, 10);
        console.log('Troncature à 10 chiffres:', cleanPhone);
    }

    console.log('Téléphone normalisé final:', cleanPhone);
    return cleanPhone;
};

// Configuration Multer pour l'upload de fichiers
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/candidatures/';

        // Créer le dossier s'il n'existe pas
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Nom de fichier unique avec timestamp
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext);
        cb(null, `${timestamp}-${baseName}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    // Types de fichiers acceptés
    const allowedTypes = {
        'cv': ['.pdf'],
        'lettre': ['.pdf'],
        'carte': ['.pdf', '.jpg', '.jpeg', '.png']
    };

    const ext = path.extname(file.originalname).toLowerCase();
    const fieldAllowedTypes = allowedTypes[file.fieldname] || [];

    if (fieldAllowedTypes.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error(`Type de fichier non autorisé pour ${file.fieldname}: ${ext}`), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max
    }
});

const CandidatureController = {
    // Upload middleware
    uploadFiles: upload.fields([
        { name: 'cv', maxCount: 1 },
        { name: 'lettre', maxCount: 1 },
        { name: 'carte', maxCount: 1 }
    ]),

    // Soumettre une candidature
    create: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Erreurs de validation',
                    errors: errors.array()
                });
            }

            // Vérifier que tous les fichiers requis sont présents
            if (!req.files || !req.files.cv || !req.files.lettre || !req.files.carte) {
                return res.status(400).json({
                    success: false,
                    message: 'Tous les documents sont requis (CV, lettre de motivation, carte d\'identité)'
                });
            }

            // Vérifier si une candidature existe déjà pour cet email
            Candidature.findByEmail(req.body.email, (err, existingCandidature) => {
                if (err) {
                    console.error('Erreur vérification candidature existante:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Erreur serveur'
                    });
                }

                if (existingCandidature && existingCandidature.statut === 'en_attente') {
                    return res.status(409).json({
                        success: false,
                        message: 'Une candidature est déjà en cours de traitement pour cet email'
                    });
                }

                console.log('Téléphone reçu dans req.body:', req.body.telephone);

                // Préparer les données de candidature avec téléphone normalisé
                const normalizedPhone = normalizePhoneNumber(req.body.telephone);
                console.log('Téléphone après normalisation:', normalizedPhone);

                const candidatureData = {
                    ...req.body,
                    telephone: normalizedPhone, // NORMALISATION ICI
                    cv_filename: req.files.cv[0].filename,
                    lettre_filename: req.files.lettre[0].filename,
                    carte_filename: req.files.carte[0].filename,
                    accept_terms: req.body.acceptTerms === 'true' || req.body.acceptTerms === true,
                    read_contract: req.body.readContract === 'true' || req.body.readContract === true
                };

                console.log('Données candidature préparées:', {
                    ...candidatureData,
                    telephone: candidatureData.telephone, // Log spécifique pour le téléphone
                    cv_filename: candidatureData.cv_filename,
                    lettre_filename: candidatureData.lettre_filename,
                    carte_filename: candidatureData.carte_filename
                });

                // Créer la candidature
                Candidature.create(candidatureData, (err, result) => {
                    if (err) {
                        console.error('Erreur création candidature:', err);
                        return res.status(500).json({
                            success: false,
                            message: 'Erreur lors de la soumission de la candidature'
                        });
                    }

                    res.status(201).json({
                        success: true,
                        message: 'Candidature soumise avec succès',
                        data: {
                            id: result.insertId,
                            statut: 'en_attente'
                        }
                    });
                });
            });
        } catch (error) {
            console.error('Erreur dans create candidature:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    },

    // Obtenir toutes les candidatures (admin)
    getAll: (req, res) => {
        try {
            Candidature.getAll((err, results) => {
                if (err) {
                    console.error('Erreur récupération candidatures:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Erreur lors de la récupération des candidatures'
                    });
                }

                res.json({
                    success: true,
                    data: results,
                    count: results.length
                });
            });
        } catch (error) {
            console.error('Erreur dans getAll candidatures:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    },

    // Obtenir une candidature par ID (admin)
    getById: (req, res) => {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de candidature invalide'
                });
            }

            Candidature.findById(id, (err, result) => {
                if (err) {
                    console.error('Erreur recherche candidature:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Erreur serveur'
                    });
                }

                if (!result) {
                    return res.status(404).json({
                        success: false,
                        message: 'Candidature non trouvée'
                    });
                }

                res.json({
                    success: true,
                    data: result
                });
            });
        } catch (error) {
            console.error('Erreur dans getById candidature:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    },

    // Mettre à jour le statut d'une candidature (admin)
    updateStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { statut, notes_internes } = req.body;

            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de candidature invalide'
                });
            }

            const statutsValides = ['en_attente', 'en_cours', 'acceptee', 'refusee'];
            if (!statutsValides.includes(statut)) {
                return res.status(400).json({
                    success: false,
                    message: 'Statut invalide'
                });
            }

            // D'abord récupérer les données de la candidature
            Candidature.findById(id, async (err, candidature) => {
                if (err) {
                    console.error('Erreur recherche candidature:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Erreur serveur'
                    });
                }

                if (!candidature) {
                    return res.status(404).json({
                        success: false,
                        message: 'Candidature non trouvée'
                    });
                }

                // Mettre à jour le statut en BDD
                Candidature.updateStatus(id, statut, notes_internes || '', async (err, result) => {
                    if (err) {
                        console.error('Erreur mise à jour statut:', err);
                        return res.status(500).json({
                            success: false,
                            message: 'Erreur lors de la mise à jour'
                        });
                    }

                    if (result.affectedRows === 0) {
                        return res.status(404).json({
                            success: false,
                            message: 'Candidature non trouvée'
                        });
                    }

                    // ENVOI D'EMAIL AUTOMATIQUE selon le nouveau statut
                    let emailSent = false;
                    try {
                        if (statut === 'acceptee') {
                            console.log('📧 Envoi email d\'acceptation à:', candidature.email);

                            // Générer un token d'activation sécurisé
                            const activationToken = crypto.randomBytes(32).toString('hex');
                            console.log('🔑 Token généré:', activationToken);

                            // Sauvegarder le token en BDD (expire dans 48h)
                            const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h
                            const db = require('../config/db');

                            db.query(
                                'INSERT INTO user_activations (candidature_id, token, email, expires_at) VALUES (?, ?, ?, ?)',
                                [candidature.id, activationToken, candidature.email, expiresAt],
                                (tokenErr) => {
                                    if (tokenErr) {
                                        console.error('Erreur sauvegarde token:', tokenErr);
                                        // Continue quand même
                                    }
                                }
                            );

                            await emailService.sendAcceptanceEmail(candidature, activationToken);
                            console.log('✅ Email d\'acceptation envoyé avec succès');
                            emailSent = true;

                        } else if (statut === 'refusee') {
                            console.log('📧 Envoi email de refus à:', candidature.email);
                            await emailService.sendRejectionEmail(candidature);
                            console.log('✅ Email de refus envoyé avec succès');
                            emailSent = true;
                        }
                    } catch (emailError) {
                        console.error('❌ Erreur envoi email:', emailError);
                        // On continue même si l'email échoue, mais on le signale
                    }

                    res.json({
                        success: true,
                        message: `Statut mis à jour avec succès${emailSent ? ' et email envoyé automatiquement' : ''}`,
                        data: {
                            id: id,
                            nouveauStatut: statut,
                            emailEnvoye: emailSent
                        }
                    });
                });
            });
        } catch (error) {
            console.error('Erreur dans updateStatus:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    },
    // Obtenir les statistiques des candidatures (admin)
    getStats: (req, res) => {
        try {
            Candidature.getStats((err, stats) => {
                if (err) {
                    console.error('Erreur récupération stats:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Erreur lors de la récupération des statistiques'
                    });
                }

                res.json({
                    success: true,
                    data: stats
                });
            });
        } catch (error) {
            console.error('Erreur dans getStats:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }
};

module.exports = CandidatureController;