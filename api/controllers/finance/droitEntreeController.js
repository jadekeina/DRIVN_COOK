const DroitEntree = require('../../models/DroitEntree');

const DroitEntreeController = {

    /**
     * Récupérer tous les droits d'entrée
     */
    getAllDroitsEntree: (req, res) => {
        console.log('Récupération de tous les droits d\'entrée...');

        DroitEntree.getAll((err, franchisees) => {
            if (err) {
                console.error('Erreur getAllDroitsEntree:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la récupération des droits d\'entrée',
                    error: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne'
                });
            }

            // Enrichissement des données avec la logique métier
            const droitsEntreeDetailles = franchisees.map(droit => {
                return DroitEntreeController._enrichirDonneesFranchise(droit);
            });

            // Calcul des statistiques
            const stats = DroitEntreeController._calculerStatistiques(droitsEntreeDetailles);

            res.json({
                success: true,
                data: droitsEntreeDetailles,
                statistiques: stats,
                count: droitsEntreeDetailles.length
            });
        });
    },

    /**
     * Mettre à jour le paiement d'un droit d'entrée
     */
    updatePaiementDroitEntree: (req, res) => {
        const { franchiseeId } = req.params;
        const { type_paiement, paye, date_paiement, montant, notes } = req.body;

        console.log(`Mise à jour paiement droit d'entrée: franchisé ${franchiseeId}, type: ${type_paiement}`);

        // Vérifier que le franchisé existe
        DroitEntree.findById(franchiseeId, (err, franchise) => {
            if (err) {
                console.error('Erreur recherche franchisé:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la recherche du franchisé',
                    error: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne'
                });
            }

            if (!franchise) {
                return res.status(404).json({
                    success: false,
                    message: 'Franchisé non trouvé'
                });
            }

            // Traitement selon le type de paiement
            if (type_paiement === 'initial') {
                // Mettre à jour le paiement initial
                DroitEntree.updateDroitEntreeInitial(franchiseeId, paye, (updateErr, result) => {
                    if (updateErr) {
                        console.error('Erreur mise à jour:', updateErr);
                        return res.status(500).json({
                            success: false,
                            message: 'Erreur lors de la mise à jour',
                            error: process.env.NODE_ENV === 'development' ? updateErr.message : 'Erreur interne'
                        });
                    }

                    if (result.affectedRows === 0) {
                        return res.status(500).json({
                            success: false,
                            message: 'Aucune ligne mise à jour'
                        });
                    }

                    // Préparer la réponse
                    const paiementEnregistre = DroitEntreeController._preparerReponsePaiement(
                        franchiseeId, franchise, type_paiement, paye, date_paiement, montant, notes
                    );

                    console.log('Paiement initial mis à jour:', paiementEnregistre);

                    res.json({
                        success: true,
                        message: `Paiement ${type_paiement} mis à jour avec succès`,
                        data: paiementEnregistre
                    });
                });
            } else {
                // Enregistrer le paiement d'échéance
                const paiementData = {
                    franchisee_id: parseInt(franchiseeId),
                    type_paiement: type_paiement,
                    montant: parseFloat(montant) || 10000,
                    date_paiement: date_paiement || new Date().toISOString().split('T')[0],
                    notes: notes || ''
                };

                DroitEntree.insertPaiementEcheance(paiementData, (insertErr, result) => {
                    if (insertErr) {
                        console.error('Erreur insertion paiement:', insertErr);
                        return res.status(500).json({
                            success: false,
                            message: 'Erreur lors de l\'enregistrement du paiement',
                            error: process.env.NODE_ENV === 'development' ? insertErr.message : 'Erreur interne'
                        });
                    }

                    // Préparer la réponse
                    const paiementEnregistre = DroitEntreeController._preparerReponsePaiement(
                        franchiseeId, franchise, type_paiement, paye, date_paiement, montant, notes
                    );

                    console.log('Paiement échéance enregistré:', paiementEnregistre);

                    res.json({
                        success: true,
                        message: `Paiement ${type_paiement} mis à jour avec succès`,
                        data: paiementEnregistre
                    });
                });
            }
        });
    },

    /**
     * Récupérer les droits d'entrée en retard
     */
    getDroitsEntreeEnRetard: (req, res) => {
        console.log('Récupération des droits d\'entrée en retard...');

        DroitEntree.getEnRetard((err, retards) => {
            if (err) {
                console.error('Erreur getDroitsEntreeEnRetard:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la récupération des droits d\'entrée en retard',
                    error: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne'
                });
            }

            // Enrichir les données avec les échéances en retard
            const droitsEntreeEnRetard = retards.map(retard => {
                return DroitEntreeController._calculerEcheancesEnRetard(retard);
            }).filter(retard => retard.echeances_en_retard.length > 0);

            // Calcul des totaux
            const totaux = DroitEntreeController._calculerTotauxRetards(droitsEntreeEnRetard);

            res.json({
                success: true,
                data: droitsEntreeEnRetard,
                totaux: totaux,
                count: droitsEntreeEnRetard.length
            });
        });
    },

    /**
     * Générer un rapport des droits d'entrée
     */
    generateDroitsEntreeReport: (req, res) => {
        console.log('Génération du rapport des droits d\'entrée...');

        // Récupérer toutes les données nécessaires
        DroitEntree.getAll((err, franchisees) => {
            if (err) {
                console.error('Erreur generateDroitsEntreeReport:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la génération du rapport des droits d\'entrée',
                    error: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne'
                });
            }

            DroitEntree.getStats((statsErr, stats) => {
                if (statsErr) {
                    console.error('Erreur statistiques:', statsErr);
                    return res.status(500).json({
                        success: false,
                        message: 'Erreur lors du calcul des statistiques',
                        error: process.env.NODE_ENV === 'development' ? statsErr.message : 'Erreur interne'
                    });
                }

                // Traitement et analyse des données
                const rapport = {
                    synthese: {
                        total_franchises: stats.total_franchises,
                        franchises_payes: stats.franchises_payes,
                        franchises_en_retard: stats.franchises_en_retard,
                        taux_paiement: stats.total_franchises > 0 ?
                            ((stats.franchises_payes / stats.total_franchises) * 100).toFixed(1) : 0
                    },
                    donnees_detaillees: franchisees.map(f =>
                        DroitEntreeController._enrichirDonneesFranchise(f)
                    ),
                    generated_at: new Date().toISOString()
                };

                res.json({
                    success: true,
                    data: rapport
                });
            });
        });
    },

    // ===== MÉTHODES PRIVÉES POUR LA LOGIQUE MÉTIER =====

    /**
     * Enrichir les données d'une franchise avec les calculs d'échéances
     */
    _enrichirDonneesFranchise: (droit) => {
        const dateCreation = new Date(droit.date_franchise);
        const montantTotal = 50000;
        const montantInitial = 10000;
        const montantEcheance = 10000;
        const nombreEcheances = 4;

        // Calcul des échéances
        const echeances = [];
        for (let i = 1; i <= nombreEcheances; i++) {
            const dateLimite = new Date(dateCreation);
            dateLimite.setMonth(dateLimite.getMonth() + i);

            // Pour la démo, on considère que si le droit initial est payé,
            // les premières échéances le sont aussi
            const paye = droit.droit_entree_paye && i <= 2;

            echeances.push({
                numero: i,
                montant: montantEcheance,
                date_limite: dateLimite.toISOString().split('T')[0],
                paye: paye,
                date_paiement: paye ? dateCreation.toISOString().split('T')[0] : null,
                jours_retard: paye ? 0 : Math.max(0, Math.floor((new Date() - dateLimite) / (1000 * 60 * 60 * 24)))
            });
        }

        // Calcul des totaux
        const montantInitialPaye = droit.droit_entree_paye ? montantInitial : 0;
        const montantEcheancesPaye = echeances.filter(e => e.paye).reduce((sum, e) => sum + e.montant, 0);
        const totalPaye = montantInitialPaye + montantEcheancesPaye;
        const restantDu = montantTotal - totalPaye;
        const prochaineDateLimite = echeances.find(e => !e.paye)?.date_limite;

        return {
            franchisee_id: droit.franchisee_id,
            franchisee_name: droit.franchisee_name,
            email: droit.email,
            phone: droit.phone,
            zone_attribution: droit.zone_attribution,
            date_creation: droit.date_franchise,
            statut_paiement: droit.statut_paiement,
            jours_depuis_creation: droit.jours_depuis_creation,

            // Détails financiers
            montants: {
                total_du: montantTotal,
                initial: {
                    montant: montantInitial,
                    paye: droit.droit_entree_paye,
                    date_paiement: droit.droit_entree_paye ? droit.date_franchise : null
                },
                total_paye: totalPaye,
                restant_du: restantDu,
                pourcentage_complete: (totalPaye / montantTotal * 100).toFixed(1)
            },

            // Détails des échéances
            echeances: echeances,
            prochaine_echeance: prochaineDateLimite,

            // Indicateurs de risque
            en_retard: echeances.some(e => e.jours_retard > 0),
            jours_retard_max: Math.max(...echeances.map(e => e.jours_retard))
        };
    },

    /**
     * Calculer les échéances en retard pour un franchisé
     */
    _calculerEcheancesEnRetard: (retard) => {
        const dateCreation = new Date(retard.date_franchise);
        const joursDepuisCreation = retard.jours_depuis_creation;
        const echeancesEnRetard = [];

        // Paiement initial en retard
        if (!retard.droit_entree_paye && joursDepuisCreation > 30) {
            echeancesEnRetard.push({
                type: 'initial',
                montant: 10000,
                jours_retard: joursDepuisCreation - 30,
                date_limite_depassee: new Date(dateCreation.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            });
        }

        // Échéances mensuelles en retard
        for (let i = 1; i <= 4; i++) {
            const dateLimiteEcheance = new Date(dateCreation);
            dateLimiteEcheance.setMonth(dateLimiteEcheance.getMonth() + i);
            const joursRetardEcheance = Math.floor((new Date() - dateLimiteEcheance) / (1000 * 60 * 60 * 24));

            if (joursRetardEcheance > 0) {
                const payee = retard.droit_entree_paye && i <= 2;

                if (!payee) {
                    echeancesEnRetard.push({
                        type: `echeance_${i}`,
                        montant: 10000,
                        jours_retard: joursRetardEcheance,
                        date_limite_depassee: dateLimiteEcheance.toISOString().split('T')[0]
                    });
                }
            }
        }

        const montantTotalEnRetard = echeancesEnRetard.reduce((sum, e) => sum + e.montant, 0);
        const joursRetardMax = echeancesEnRetard.length > 0 ? Math.max(...echeancesEnRetard.map(e => e.jours_retard)) : 0;

        return {
            franchisee_id: retard.franchisee_id,
            franchisee_name: retard.franchisee_name,
            email: retard.email,
            phone: retard.phone,
            zone_attribution: retard.zone_attribution,
            date_creation: retard.date_franchise,
            jours_depuis_creation: joursDepuisCreation,
            echeances_en_retard: echeancesEnRetard,
            montant_total_en_retard: montantTotalEnRetard,
            jours_retard_max: joursRetardMax,
            niveau_urgence: joursRetardMax > 90 ? 'critique' :
                joursRetardMax > 60 ? 'urgent' : 'attention'
        };
    },

    /**
     * Calculer les statistiques globales
     */
    _calculerStatistiques: (droitsEntreeDetailles) => {
        const stats = {
            total_franchises: droitsEntreeDetailles.length,
            montant_total_collecte: droitsEntreeDetailles.reduce((sum, d) => sum + d.montants.total_paye, 0),
            montant_total_attendu: droitsEntreeDetailles.length * 50000,
            franchises_completement_payees: droitsEntreeDetailles.filter(d => d.montants.restant_du === 0).length,
            franchises_en_retard: droitsEntreeDetailles.filter(d => d.en_retard).length,
            taux_recouvrement: 0
        };

        if (stats.montant_total_attendu > 0) {
            stats.taux_recouvrement = (stats.montant_total_collecte / stats.montant_total_attendu * 100).toFixed(1);
        }

        return stats;
    },

    /**
     * Calculer les totaux des retards
     */
    _calculerTotauxRetards: (droitsEntreeEnRetard) => {
        return {
            nombre_franchises: droitsEntreeEnRetard.length,
            montant_total_retard: droitsEntreeEnRetard.reduce((sum, r) => sum + r.montant_total_en_retard, 0),
            retard_moyen_jours: droitsEntreeEnRetard.length > 0 ?
                Math.round(droitsEntreeEnRetard.reduce((sum, r) => sum + r.jours_retard_max, 0) / droitsEntreeEnRetard.length) : 0,
            repartition_urgence: {
                critique: droitsEntreeEnRetard.filter(r => r.niveau_urgence === 'critique').length,
                urgent: droitsEntreeEnRetard.filter(r => r.niveau_urgence === 'urgent').length,
                attention: droitsEntreeEnRetard.filter(r => r.niveau_urgence === 'attention').length
            }
        };
    },

    /**
     * Préparer la réponse de paiement
     */
    _preparerReponsePaiement: (franchiseeId, franchise, type_paiement, paye, date_paiement, montant, notes) => {
        return {
            franchisee_id: parseInt(franchiseeId),
            franchisee_name: `${franchise.first_name} ${franchise.last_name}`,
            type_paiement: type_paiement,
            montant: parseFloat(montant) || (type_paiement === 'initial' ? 10000 : 10000),
            date_paiement: date_paiement || new Date().toISOString().split('T')[0],
            paye: paye,
            notes: notes || '',
            timestamp: new Date().toISOString()
        };
    }
};

module.exports = DroitEntreeController;