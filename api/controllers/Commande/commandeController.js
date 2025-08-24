const Commande = require('../../models/Commande');

const commandeController = {
    /**
     * GET /api/commandes/list
     * Récupérer toutes les commandes pour la page Suivi Commandes
     */
    getAllCommandes: (req, res) => {
        console.log('[COMMANDES] Récupération de toutes les commandes...');

        Commande.getAllCommandes((err, commandes) => {
            if (err) {
                console.error('[COMMANDES] Erreur récupération commandes:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Erreur serveur lors de la récupération des commandes',
                    error: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne'
                });
            }

            console.log(`[COMMANDES] ${commandes.length} commandes récupérées`);

            res.json({
                success: true,
                commandes: commandes,
                total: commandes.length,
                message: 'Commandes récupérées avec succès'
            });
        });
    },

    /**
     * POST /api/commandes
     * Créer une nouvelle commande
     */
    createCommande: (req, res) => {
        console.log('[COMMANDES] Création d\'une nouvelle commande:', req.body);

        const { franchise_id, articles, notes } = req.body;

        // Validation des données
        if (!franchise_id) {
            return res.status(400).json({
                success: false,
                message: 'L\'ID de franchise est obligatoire'
            });
        }

        if (!articles || !Array.isArray(articles) || articles.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Au moins un article est requis pour créer une commande'
            });
        }

        // Validation des articles
        for (let i = 0; i < articles.length; i++) {
            const article = articles[i];
            if (!article.id_article || !article.nom_article || !article.quantite || !article.prix_unitaire) {
                return res.status(400).json({
                    success: false,
                    message: `Article ${i + 1}: données incomplètes (id_article, nom_article, quantite, prix_unitaire requis)`
                });
            }

            if (article.quantite <= 0 || article.prix_unitaire <= 0) {
                return res.status(400).json({
                    success: false,
                    message: `Article ${i + 1}: la quantité et le prix unitaire doivent être supérieurs à 0`
                });
            }
        }

        // Calculer le montant total
        const montant_total = articles.reduce((sum, article) => {
            const sous_total = article.quantite * article.prix_unitaire;
            article.sous_total = sous_total; // S'assurer que le sous-total est calculé
            return sum + sous_total;
        }, 0);

        const commandeData = {
            franchise_id: parseInt(franchise_id),
            montant_total: montant_total,
            articles: articles,
            notes: notes ? notes.trim() : ''
        };

        Commande.createCommande(commandeData, (err, nouvelleCommande) => {
            if (err) {
                console.error('[COMMANDES] Erreur création commande:', err);

                if (err.message.includes('ID article invalide')) {
                    return res.status(400).json({
                        success: false,
                        message: err.message
                    });
                }

                return res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la création de la commande',
                    error: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne'
                });
            }

            console.log(`[COMMANDES] Commande créée avec succès: ${nouvelleCommande.id}`);

            res.status(201).json({
                success: true,
                commande: nouvelleCommande,
                message: `Commande créée avec succès avec l'ID: ${nouvelleCommande.id}`
            });
        });
    },

    /**
     * PUT /api/commandes/:id/statut
     * Mettre à jour le statut d'une commande
     */
    updateStatutCommande: (req, res) => {
        const { statut } = req.body;
        const commandeId = req.params.id;

        console.log(`[COMMANDES] Mise à jour statut commande ${commandeId}: ${statut}`);

        // Validation du statut
        const statutsValides = ['en_attente', 'confirmee', 'preparee', 'en_livraison', 'livree', 'annulee'];
        if (!statutsValides.includes(statut)) {
            return res.status(400).json({
                success: false,
                message: 'Statut invalide. Statuts valides: ' + statutsValides.join(', ')
            });
        }

        // Extraire l'ID numérique si format CMD-XXX
        const id = commandeId.startsWith('CMD-') ? parseInt(commandeId.replace('CMD-', '')) : parseInt(commandeId);

        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID commande invalide'
            });
        }

        Commande.updateStatutCommande(id, statut, (err, result) => {
            if (err) {
                console.error('[COMMANDES] Erreur mise à jour statut:', err);

                if (err.message === 'Commande non trouvée') {
                    return res.status(404).json({
                        success: false,
                        message: 'Commande non trouvée'
                    });
                }

                return res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la mise à jour du statut',
                    error: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne'
                });
            }

            console.log(`[COMMANDES] Statut mis à jour avec succès: ${commandeId} -> ${statut}`);

            res.json({
                success: true,
                message: `Statut de la commande ${commandeId} mis à jour: ${statut}`,
                data: {
                    commande_id: commandeId,
                    nouveau_statut: statut,
                    statut_bdd: result.statutBdd
                }
            });
        });
    },

    /**
     * GET /api/commandes/franchises
     * Récupérer la liste des franchises pour les formulaires
     */
    getFranchises: (req, res) => {
        console.log('[COMMANDES] Récupération de la liste des franchises...');

        Commande.getAllFranchises((err, franchises) => {
            if (err) {
                console.error('[COMMANDES] Erreur récupération franchises:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la récupération des franchises',
                    error: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne'
                });
            }

            console.log(`[COMMANDES] ${franchises.length} franchises récupérées`);

            res.json({
                success: true,
                franchises: franchises,
                count: franchises.length,
                message: 'Franchises récupérées avec succès'
            });
        });
    }
};

module.exports = commandeController;