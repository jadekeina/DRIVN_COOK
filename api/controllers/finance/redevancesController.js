const Redevance = require('../../models/Redevance');

const RedevancesController = {

    /**
     * Calculer et récupérer toutes les redevances
     */
    getAllRedevances: (req, res) => {
        console.log('Calcul de toutes les redevances...');

        Redevance.getAll((err, redevances) => {
            if (err) {
                console.error('Erreur getAllRedevances:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Erreur lors du calcul des redevances',
                    error: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne'
                });
            }

            // Regroupement par franchisé pour faciliter l'affichage
            const redevancesGroupees = {};

            redevances.forEach(redevance => {
                const franchiseeId = redevance.franchisee_id;

                if (!redevancesGroupees[franchiseeId]) {
                    redevancesGroupees[franchiseeId] = {
                        franchisee_id: franchiseeId,
                        franchisee_name: redevance.franchisee_name,
                        email: redevance.email,
                        zone_attribution: redevance.zone_attribution,
                        pourcentage_ca: redevance.pourcentage_ca,
                        declarations: []
                    };
                }

                redevancesGroupees[franchiseeId].declarations.push({
                    mois: redevance.mois,
                    ca_mensuel: parseFloat(redevance.ca_mensuel),
                    redevance_due: parseFloat(redevance.redevance_due),
                    statut_paiement: redevance.statut_paiement
                });
            });

            // Conversion en tableau et calcul des totaux
            const resultats = Object.values(redevancesGroupees).map(franchisee => {
                const totalCA = franchisee.declarations.reduce((sum, decl) => sum + decl.ca_mensuel, 0);
                const totalRedevances = franchisee.declarations.reduce((sum, decl) => sum + decl.redevance_due, 0);
                const redevancesPayees = franchisee.declarations
                    .filter(decl => decl.statut_paiement === 'paye')
                    .reduce((sum, decl) => sum + decl.redevance_due, 0);
                const redevancesEnAttente = totalRedevances - redevancesPayees;

                return {
                    ...franchisee,
                    totaux: {
                        ca_total: totalCA,
                        redevances_totales: totalRedevances,
                        redevances_payees: redevancesPayees,
                        redevances_en_attente: redevancesEnAttente
                    }
                };
            });

            res.json({
                success: true,
                data: resultats,
                count: resultats.length
            });
        });
    },

    /**
     * Marquer une redevance comme payée
     */
    marquerRedevancePayee: (req, res) => {
        const { franchiseeId, mois } = req.params;
        const { montant_paye, date_paiement, methode_paiement } = req.body;

        console.log(`Marquage redevance payée: franchisé ${franchiseeId}, mois ${mois}`);

        // Vérifier que le franchisé existe et a des ventes pour ce mois
        Redevance.getByFranchiseeAndMonth(franchiseeId, mois, (err, redevanceInfo) => {
            if (err) {
                console.error('Erreur vérification redevance:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la vérification de la redevance',
                    error: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne'
                });
            }

            if (!redevanceInfo) {
                return res.status(404).json({
                    success: false,
                    message: 'Aucune vente trouvée pour ce franchisé ce mois-ci'
                });
            }

            // Enregistrer le paiement
            const paiementData = {
                montant_paye: parseFloat(montant_paye),
                date_paiement: date_paiement || new Date().toISOString().split('T')[0],
                methode_paiement: methode_paiement || 'virement'
            };

            Redevance.marquerPaiement(franchiseeId, mois, paiementData, (payErr, result) => {
                if (payErr) {
                    console.error('Erreur marquage paiement:', payErr);
                    return res.status(500).json({
                        success: false,
                        message: 'Erreur lors du marquage du paiement',
                        error: process.env.NODE_ENV === 'development' ? payErr.message : 'Erreur interne'
                    });
                }

                const paiement = {
                    franchisee_id: parseInt(franchiseeId),
                    franchisee_name: redevanceInfo.nom,
                    mois: mois,
                    ca_declare: parseFloat(redevanceInfo.ca_mois),
                    redevance_due: parseFloat(redevanceInfo.redevance_due),
                    montant_paye: paiementData.montant_paye,
                    date_paiement: paiementData.date_paiement,
                    methode_paiement: paiementData.methode_paiement,
                    statut: 'paye'
                };

                console.log(`Redevance marquée comme payée:`, paiement);

                res.json({
                    success: true,
                    message: 'Redevance marquée comme payée',
                    data: paiement
                });
            });
        });
    },

    /**
     * Récupérer les redevances en retard
     */
    getRedevancesEnRetard: (req, res) => {
        console.log('Récupération des redevances en retard...');

        Redevance.getEnRetard((err, retards) => {
            if (err) {
                console.error('Erreur getRedevancesEnRetard:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la récupération des redevances en retard',
                    error: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne'
                });
            }

            const redevancesEnRetard = retards.map(retard => ({
                franchisee_id: retard.franchisee_id,
                franchisee_name: retard.franchisee_name,
                email: retard.email,
                phone: retard.phone,
                zone_attribution: retard.zone_attribution,
                mois: retard.mois,
                ca_mensuel: parseFloat(retard.ca_mensuel),
                redevance_due: parseFloat(retard.redevance_due),
                jours_retard: parseInt(retard.jours_retard),
                niveau_urgence: retard.jours_retard > 90 ? 'critique' :
                    retard.jours_retard > 60 ? 'urgent' : 'attention'
            }));

            // Calcul des totaux
            const totaux = {
                nombre_franchises: new Set(redevancesEnRetard.map(r => r.franchisee_id)).size,
                nombre_declarations: redevancesEnRetard.length,
                montant_total_retard: redevancesEnRetard.reduce((sum, r) => sum + r.redevance_due, 0),
                retard_moyen_jours: redevancesEnRetard.length > 0 ?
                    Math.round(redevancesEnRetard.reduce((sum, r) => sum + r.jours_retard, 0) / redevancesEnRetard.length) : 0
            };

            res.json({
                success: true,
                data: redevancesEnRetard,
                totaux: totaux,
                count: redevancesEnRetard.length
            });
        });
    },

    /**
     * Générer un rapport de redevances
     */
    generateRedevancesReport: (req, res) => {
        const { periode } = req.query; // Format: '2024-03' ou 'all'

        console.log(`Génération rapport redevances pour période: ${periode}`);

        Redevance.getReportData(periode, (err, donnees) => {
            if (err) {
                console.error('Erreur generateRedevancesReport:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la génération du rapport de redevances',
                    error: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne'
                });
            }

            // Calculs de synthèse
            const synthese = {
                periode_analysee: periode || 'Toutes périodes',
                nombre_franchises_actives: new Set(donnees.map(d => d.franchisee_id)).size,
                ca_total_reseau: donnees.reduce((sum, d) => sum + parseFloat(d.ca_mensuel), 0),
                redevances_totales: donnees.reduce((sum, d) => sum + parseFloat(d.redevance_due), 0),
                ca_moyen_par_franchise: 0,
                redevance_moyenne_par_franchise: 0
            };

            if (synthese.nombre_franchises_actives > 0) {
                synthese.ca_moyen_par_franchise = synthese.ca_total_reseau / synthese.nombre_franchises_actives;
                synthese.redevance_moyenne_par_franchise = synthese.redevances_totales / synthese.nombre_franchises_actives;
            }

            // Top performers
            const topPerformers = donnees
                .filter(d => d.rang_ca <= 5)
                .slice(0, 5)
                .map(d => ({
                    franchisee_name: d.franchisee_name,
                    zone: d.zone_attribution,
                    ca_mensuel: parseFloat(d.ca_mensuel),
                    redevance_due: parseFloat(d.redevance_due),
                    rang: parseInt(d.rang_ca)
                }));

            const rapport = {
                synthese,
                donnees_detaillees: donnees.map(d => ({
                    franchisee_id: d.franchisee_id,
                    franchisee_name: d.franchisee_name,
                    email: d.email,
                    zone_attribution: d.zone_attribution,
                    mois: d.mois,
                    ca_mensuel: parseFloat(d.ca_mensuel),
                    redevance_due: parseFloat(d.redevance_due),
                    nombre_ventes: parseInt(d.nombre_ventes),
                    ca_moyen_par_vente: parseFloat(d.ca_moyen_par_vente),
                    rang_ca: parseInt(d.rang_ca),
                    rang_redevance: parseInt(d.rang_redevance)
                })),
                top_performers: topPerformers
            };

            res.json({
                success: true,
                data: rapport,
                generated_at: new Date().toISOString()
            });
        });
    },

    /**
     * Envoyer une relance par email pour redevance en retard
     */
    envoyerRelanceRedevance: (req, res) => {
        const { franchiseeId, mois } = req.params;

        console.log(`Envoi relance redevance: franchisé ${franchiseeId}, mois ${mois}`);

        // Récupérer les données de la redevance en retard
        Redevance.getByFranchiseeAndMonth(franchiseeId, mois, (err, redevanceData) => {
            if (err) {
                console.error('Erreur récupération redevance pour relance:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la récupération des données de redevance',
                    error: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne'
                });
            }

            if (!redevanceData) {
                return res.status(404).json({
                    success: false,
                    message: 'Redevance non trouvée pour ce franchisé et cette période'
                });
            }

            // Simuler l'envoi d'email (en production, utiliser le service email)
            const emailData = {
                destinataire: redevanceData.email || 'email@exemple.com',
                franchisee_name: redevanceData.nom,
                mois: mois,
                ca_mensuel: parseFloat(redevanceData.ca_mois),
                montant_du: parseFloat(redevanceData.redevance_due)
            };

            console.log('Email de relance simulé:', emailData);

            // En production, décommenter cette ligne :
            // const emailResult = await financeEmailService.envoyerRelanceRedevance(emailData);

            res.json({
                success: true,
                message: `Relance envoyée à ${redevanceData.nom}`,
                data: {
                    email_envoye_a: emailData.destinataire,
                    montant_concerne: redevanceData.redevance_due,
                    statut_envoi: 'simule' // En production: 'envoye'
                }
            });
        });
    }
};

module.exports = RedevancesController;