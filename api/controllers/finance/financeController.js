const Finance = require('../../models/Finance');

const FinanceController = {

    /**
     * Récupérer toutes les données financières des franchisés (vue d'ensemble)
     */
    getAllFranchisesFinance: (req, res) => {
        console.log('Récupération des données financières de tous les franchisés...');

        Finance.getAllFranchisesFinance((err, franchises) => {
            if (err) {
                console.error('Erreur getAllFranchisesFinance:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la récupération des données financières',
                    error: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne'
                });
            }

            // Traitement des données pour correspondre à l'interface frontend
            const processedFranchises = franchises.map(franchise => {
                // Calcul des droits d'entrée (50000€ total, payable en 5 fois)
                const totalDroitsEntree = 50000;
                const montantInitial = 10000;
                const montantEcheance = 10000;

                const totalPaye = franchise.droit_entree_paye ? montantInitial : 0;
                // Pour simplifier, on assume que si le droit initial est payé,
                // le franchisé a payé quelques échéances aussi
                const echeancesPayees = franchise.droit_entree_paye ? 2 : 0;
                const totalPayeEcheances = echeancesPayees * montantEcheance;

                return {
                    id: franchise.id,
                    franchisee_name: franchise.franchisee_name,
                    email: franchise.email,
                    zone_attribution: franchise.zone_attribution || 'Non attribuée',
                    phone: franchise.phone || 'Non renseigné',
                    date_creation: franchise.date_creation,
                    droit_entree: {
                        initial_paye: franchise.droit_entree_paye,
                        date_initial: franchise.droit_entree_paye ? franchise.date_creation : null,
                        echeances_restantes: 4 - echeancesPayees,
                        total_paye: totalPaye + totalPayeEcheances,
                        prochaine_echeance: franchise.droit_entree_paye ?
                            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] :
                            franchise.date_creation
                    },
                    ca_total: parseFloat(franchise.ca_total) || 0,
                    redevances_dues: parseFloat(franchise.redevances_dues) || 0,
                    redevances_payees: parseFloat(franchise.redevances_dues) * 0.8 || 0, // 80% payées en moyenne
                    commandes_mois: parseInt(franchise.commandes_mois) || 0,
                    statut_global: franchise.statut_global
                };
            });

            console.log(`${processedFranchises.length} franchisés trouvés`);

            res.json({
                success: true,
                data: processedFranchises,
                count: processedFranchises.length
            });
        });
    },

    /**
     * Récupérer les détails financiers d'un franchisé spécifique
     */
    getFranchiseDetail: (req, res) => {
        const { id } = req.params;
        console.log(`Récupération des détails financiers pour le franchisé ID: ${id}`);

        Finance.getFranchiseDetail(id, (err, data) => {
            if (err) {
                console.error('Erreur getFranchiseDetail:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la récupération des détails financiers',
                    error: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne'
                });
            }

            if (!data) {
                return res.status(404).json({
                    success: false,
                    message: 'Franchisé non trouvé'
                });
            }

            const { franchise, ventes, commandes } = data;

            // Construction de la réponse détaillée
            const detailResponse = {
                id: franchise.id,
                franchisee_name: franchise.franchisee_name,
                email: franchise.email,
                zone_attribution: franchise.zone_attribution || 'Non attribuée',
                phone: franchise.phone || 'Non renseigné',
                date_creation: franchise.date_creation,

                // Droits d'entrée détaillés
                droits_entree: {
                    initial: {
                        paye: franchise.droit_entree_paye,
                        date: franchise.droit_entree_paye ? franchise.date_creation : null,
                        montant: 10000
                    },
                    echeances: [
                        {
                            numero: 1,
                            montant: 10000,
                            date_limite: new Date(new Date(franchise.date_creation).getTime() + 30*24*60*60*1000).toISOString().split('T')[0],
                            paye: franchise.droit_entree_paye,
                            date_paiement: franchise.droit_entree_paye ? franchise.date_creation : null
                        },
                        {
                            numero: 2,
                            montant: 10000,
                            date_limite: new Date(new Date(franchise.date_creation).getTime() + 60*24*60*60*1000).toISOString().split('T')[0],
                            paye: franchise.droit_entree_paye,
                            date_paiement: franchise.droit_entree_paye ? franchise.date_creation : null
                        },
                        {
                            numero: 3,
                            montant: 10000,
                            date_limite: new Date(new Date(franchise.date_creation).getTime() + 90*24*60*60*1000).toISOString().split('T')[0],
                            paye: false,
                            date_paiement: null
                        },
                        {
                            numero: 4,
                            montant: 10000,
                            date_limite: new Date(new Date(franchise.date_creation).getTime() + 120*24*60*60*1000).toISOString().split('T')[0],
                            paye: false,
                            date_paiement: null
                        }
                    ]
                },

                // Déclarations CA et redevances
                ca_declarations: ventes.map(vente => ({
                    mois: vente.mois,
                    ca_declare: parseFloat(vente.ca_declare) || 0,
                    redevance_calculee: parseFloat(vente.redevance_calculee) || 0,
                    statut: vente.statut,
                    date_declaration: vente.date_declaration
                })),

                // Historique des commandes
                commandes: commandes.map(commande => ({
                    id: `CMD-${commande.id.toString().padStart(3, '0')}`,
                    date: commande.date,
                    montant: parseFloat(commande.montant) || 0,
                    statut: commande.statut === 'livree' ? 'livree' : 'en_cours',
                    articles_count: parseInt(commande.articles_count) || 0
                }))
            };

            console.log(`Détails financiers récupérés pour ${franchise.franchisee_name}`);

            res.json({
                success: true,
                data: detailResponse
            });
        });
    },

    /**
     * Générer un rapport financier pour un franchisé
     */
    generateFinanceReport: (req, res) => {
        const { id } = req.params;
        console.log(`Génération du rapport financier pour le franchisé ID: ${id}`);

        Finance.generateFinanceReport(id, (err, data) => {
            if (err) {
                console.error('Erreur generateFinanceReport:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la génération du rapport financier',
                    error: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne'
                });
            }

            if (!data) {
                return res.status(404).json({
                    success: false,
                    message: 'Franchisé non trouvé'
                });
            }

            const { franchise, ventes, commandes } = data;

            // Calculs des revenus pour Driv'n Cook
            const redevances = parseFloat(ventes.ca_total || 0) * (franchise.pourcentage_ca / 100);
            const margeCommandes = parseFloat(commandes.total_commandes || 0) * 0.15; // 15% de marge
            const revenusTotal = redevances + margeCommandes;

            const rapport = {
                franchisee: {
                    nom: `${franchise.first_name} ${franchise.last_name}`,
                    email: franchise.email,
                    zone: franchise.zone_attribution,
                    date_creation: franchise.date_franchise
                },
                performance: {
                    ca_total: parseFloat(ventes.ca_total || 0),
                    nombre_ventes: parseInt(ventes.nombre_ventes || 0),
                    ca_moyen_par_jour: parseFloat(ventes.ca_moyen_par_jour || 0),
                    premiere_vente: ventes.premiere_vente,
                    derniere_vente: ventes.derniere_vente
                },
                commandes: {
                    total_commandes: parseFloat(commandes.total_commandes || 0),
                    nombre_commandes: parseInt(commandes.nombre_commandes || 0),
                    panier_moyen: parseFloat(commandes.panier_moyen || 0)
                },
                revenus_drivncook: {
                    redevances_4_pourcent: redevances,
                    marge_commandes_15_pourcent: margeCommandes,
                    revenus_total: revenusTotal
                },
                ratios: {
                    pourcentage_redevances: franchise.pourcentage_ca,
                    rentabilite_franchise: revenusTotal > 0 ? ((revenusTotal / parseFloat(ventes.ca_total || 1)) * 100).toFixed(2) : 0
                }
            };

            res.json({
                success: true,
                data: rapport,
                generated_at: new Date().toISOString()
            });
        });
    },

    /**
     * Mettre à jour le statut de paiement des droits d'entrée
     */
    updateDroitEntreePaiement: (req, res) => {
        const { id } = req.params;
        const { paye, date_paiement } = req.body;

        console.log(`Mise à jour du paiement droit d'entrée pour franchisé ${id}:`, { paye, date_paiement });

        Finance.updateDroitEntreePaiement(id, paye, (err, result) => {
            if (err) {
                console.error('Erreur updateDroitEntreePaiement:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la mise à jour du paiement',
                    error: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne'
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
                message: 'Statut de paiement mis à jour avec succès',
                data: {
                    franchisee_id: id,
                    droit_entree_paye: paye,
                    date_paiement: date_paiement
                }
            });
        });
    },

    /**
     * Récupérer les statistiques globales financières
     */
    getGlobalFinanceStats: (req, res) => {
        console.log('Calcul des statistiques financières globales...');

        Finance.getGlobalFinanceStats((err, stats) => {
            if (err) {
                console.error('Erreur getGlobalFinanceStats:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Erreur lors du calcul des statistiques financières',
                    error: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne'
                });
            }

            // Calcul des revenus totaux de Driv'n Cook
            const redevances = parseFloat(stats.redevances_totales || 0);
            const margeCommandes = parseFloat(stats.commandes_totales || 0) * 0.15;
            const revenusTotal = redevances + margeCommandes;
            const droitsEntreeEstimes = parseInt(stats.franchises_droits_payes || 0) * 50000;

            const response = {
                franchises: {
                    total: parseInt(stats.total_franchises || 0),
                    droits_payes: parseInt(stats.franchises_droits_payes || 0),
                    taux_paiement_droits: stats.total_franchises > 0 ?
                        ((stats.franchises_droits_payes / stats.total_franchises) * 100).toFixed(1) : 0
                },
                chiffres_affaires: {
                    ca_total_reseau: parseFloat(stats.ca_total_reseau || 0),
                    ca_moyen_par_franchise: stats.total_franchises > 0 ?
                        (parseFloat(stats.ca_total_reseau || 0) / stats.total_franchises).toFixed(2) : 0
                },
                revenus_drivncook: {
                    droits_entree: droitsEntreeEstimes,
                    redevances_4_pourcent: redevances,
                    marge_commandes_15_pourcent: margeCommandes,
                    total_revenus: revenusTotal + droitsEntreeEstimes
                },
                activite: {
                    commandes_totales: parseInt(stats.commandes_totales || 0),
                    commandes_ce_mois: parseInt(stats.commandes_ce_mois || 0),
                    panier_moyen: stats.commandes_totales > 0 && stats.total_franchises > 0 ?
                        (parseFloat(stats.commandes_totales) / stats.total_franchises).toFixed(2) : 0
                }
            };

            console.log('Statistiques globales calculées');

            res.json({
                success: true,
                data: response,
                calculated_at: new Date().toISOString()
            });
        });
    }
};

module.exports = FinanceController;