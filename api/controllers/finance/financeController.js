const Finance = require('../../models/Finance');

const FinanceController = {

    /**
     * Récupérer tous les utilisateurs avec leur statut de paiement et franchise
     */
    getAllFranchisesFinance: (req, res) => {
        console.log('Récupération des franchisés avec statuts de paiement...');

        Finance.getAllFranchisesFinance((err, users) => {
            if (err) {
                console.error('Erreur getAllFranchisesFinance:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la récupération des données',
                    error: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne'
                });
            }

            // Transformation des données pour le frontend
            const processedData = users.map(user => {
                return {
                    id: user.id,
                    franchisee_name: user.franchisee_name,
                    email: user.email,
                    phone: user.phone,
                    assigned_zone: user.assigned_zone || 'Non assignée',
                    date_creation: user.date_creation,

                    // Informations de paiement simplifiées
                    paiement: {
                        statut: user.payment_status,
                        montant_paye: user.payment_status === 'franchise_payment_completed' ? 50000 : 0,
                        date_paiement: user.franchise_payment_completed_at,
                        methode: user.franchise_payment_method || 'N/A'
                    },

                    // Informations franchise
                    franchise: {
                        existe: !!user.franchise_id,
                        nom: user.franchise_name || null,
                        active: user.franchise_active || false
                    },

                    // Statut global pour l'affichage
                    statut_global: user.statut_global,

                    // Indicateurs d'action nécessaire
                    actions_requises: {
                        peut_assigner_franchise: user.payment_status === 'franchise_payment_completed' && !user.franchise_id,
                        peut_modifier_zone: true,
                        paiement_complete: user.payment_status === 'franchise_payment_completed'
                    }
                };
            });

            console.log(`${processedData.length} utilisateurs trouvés`);

            res.json({
                success: true,
                data: processedData,
                count: processedData.length
            });
        });
    },

    /**
     * Récupérer les détails d'un utilisateur spécifique
     */
    getFranchiseDetail: (req, res) => {
        const { id } = req.params;
        console.log(`Récupération des détails pour l'utilisateur ID: ${id}`);

        Finance.getFranchiseDetail(id, (err, data) => {
            if (err) {
                console.error('Erreur getFranchiseDetail:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la récupération des détails',
                    error: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne'
                });
            }

            if (!data) {
                return res.status(404).json({
                    success: false,
                    message: 'Utilisateur non trouvé'
                });
            }

            console.log(`Détails récupérés pour ${data.franchise.franchisee_name}`);

            res.json({
                success: true,
                data: data.franchise
            });
        });
    },

    /**
     * Créer une franchise pour un utilisateur qui a payé
     */
    createFranchiseForUser: (req, res) => {
        const { id } = req.params;
        const { name, address, city, postal_code, email, phone } = req.body;

        console.log(`Création de franchise pour l'utilisateur ID: ${id}`);

        // Validation des données
        if (!name || !address || !city) {
            return res.status(400).json({
                success: false,
                message: 'Nom, adresse et ville sont requis pour créer une franchise'
            });
        }

        const franchiseData = {
            name: name.trim(),
            address: address.trim(),
            city: city.trim(),
            postal_code: postal_code?.trim() || '',
            email: email?.trim() || '',
            phone: phone?.trim() || ''
        };

        Finance.createFranchiseForUser(id, franchiseData, (err, result) => {
            if (err) {
                console.error('Erreur createFranchiseForUser:', err);

                if (err.message.includes('pas encore payé')) {
                    return res.status(400).json({
                        success: false,
                        message: 'L\'utilisateur doit d\'abord payer les droits de franchise (50 000€)'
                    });
                }

                if (err.message.includes('franchise existe déjà')) {
                    return res.status(409).json({
                        success: false,
                        message: 'Une franchise existe déjà pour cet utilisateur'
                    });
                }

                return res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la création de la franchise',
                    error: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne'
                });
            }

            console.log(`Franchise créée avec l'ID: ${result.insertId}`);

            res.json({
                success: true,
                message: 'Franchise créée avec succès',
                data: {
                    franchise_id: result.insertId,
                    user_id: id,
                    franchise_name: franchiseData.name
                }
            });
        });
    },

    /**
     * Mettre à jour l'assignation de zone
     */
    updateZoneAssignment: (req, res) => {
        const { id } = req.params;
        const { zone } = req.body;

        console.log(`Mise à jour de la zone pour l'utilisateur ID: ${id}, nouvelle zone: ${zone}`);

        if (!zone || zone.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'La zone d\'assignation est requise'
            });
        }

        Finance.updateZoneAssignment(id, { zone: zone.trim() }, (err, result) => {
            if (err) {
                console.error('Erreur updateZoneAssignment:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la mise à jour de la zone',
                    error: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne'
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Utilisateur non trouvé'
                });
            }

            res.json({
                success: true,
                message: 'Zone d\'assignation mise à jour avec succès',
                data: {
                    user_id: id,
                    nouvelle_zone: zone.trim()
                }
            });
        });
    },

    /**
     * Statistiques globales simplifiées
     */
    getGlobalFinanceStats: (req, res) => {
        console.log('Calcul des statistiques globales...');

        Finance.getGlobalFinanceStats((err, stats) => {
            if (err) {
                console.error('Erreur getGlobalFinanceStats:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Erreur lors du calcul des statistiques',
                    error: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne'
                });
            }

            const response = {
                franchises: {
                    total: parseInt(stats.total_franchises || 0),
                    payes: parseInt(stats.franchises_payes || 0),
                    assignes: parseInt(stats.franchises_assignees || 0),
                    en_attente_assignation: parseInt(stats.franchises_payes || 0) - parseInt(stats.franchises_assignees || 0)
                },
                revenus: {
                    total_collecte: parseInt(stats.montant_total_collecte || 0),
                    nouveaux_ce_mois: parseInt(stats.nouveaux_paiements_ce_mois || 0),
                    revenus_ce_mois: parseInt(stats.nouveaux_paiements_ce_mois || 0) * 50000
                },
                taux: {
                    paiement: stats.total_franchises > 0 ?
                        ((stats.franchises_payes / stats.total_franchises) * 100).toFixed(1) : 0,
                    assignation: stats.franchises_payes > 0 ?
                        ((stats.franchises_assignees / stats.franchises_payes) * 100).toFixed(1) : 0
                }
            };

            console.log('Statistiques calculées');

            res.json({
                success: true,
                data: response,
                calculated_at: new Date().toISOString()
            });
        });
    },

    /**
     * Générer un rapport pour un utilisateur
     */
    generateUserReport: (req, res) => {
        const { id } = req.params;
        console.log(`Génération de rapport pour l'utilisateur ID: ${id}`);

        Finance.getFranchiseDetail(id, (err, data) => {
            if (err) {
                console.error('Erreur generateUserReport:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la génération du rapport',
                    error: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne'
                });
            }

            if (!data) {
                return res.status(404).json({
                    success: false,
                    message: 'Utilisateur non trouvé'
                });
            }

            const user = data.franchise;

            const rapport = {
                utilisateur: {
                    nom: user.franchisee_name,
                    email: user.email,
                    zone: user.assigned_zone,
                    date_inscription: user.date_creation
                },
                paiement: {
                    statut: user.paiement.statut,
                    montant: user.paiement.montant_paye,
                    date: user.paiement.paiement_complete,
                    methode: user.paiement.methode_paiement
                },
                franchise: user.franchise ? {
                    nom: user.franchise.nom,
                    adresse: user.franchise.adresse,
                    ville: user.franchise.ville,
                    active: user.franchise.active,
                    date_creation: user.franchise.date_creation
                } : null,
                actions_recommandees: []
            };

            // Recommandations
            if (user.paiement.statut === 'franchise_payment_completed' && !user.franchise) {
                rapport.actions_recommandees.push('Créer et assigner une franchise');
            }

            if (!user.assigned_zone || user.assigned_zone === 'Non assignée') {
                rapport.actions_recommandees.push('Assigner une zone géographique');
            }

            res.json({
                success: true,
                data: rapport,
                generated_at: new Date().toISOString()
            });
        });
    }
};

module.exports = FinanceController;