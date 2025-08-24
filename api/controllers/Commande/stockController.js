const Commande = require('../../models/Commande');

const stockController = {
    /**
     * GET /api/stocks/articles
     * Récupérer tous les produits pour la page Gestion Stocks
     */
    getAllArticles: (req, res) => {
        console.log('[STOCK] Récupération de tous les articles...');

        Commande.getAllProduits((err, produits) => {
            if (err) {
                console.error('[STOCK] Erreur récupération produits:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Erreur serveur lors de la récupération des articles',
                    error: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne'
                });
            }

            console.log(`[STOCK] ${produits.length} articles récupérés`);

            res.json({
                success: true,
                articles: produits,
                count: produits.length,
                message: 'Articles récupérés avec succès'
            });
        });
    },

    /**
     * POST /api/stocks/articles
     * Créer un nouveau produit
     */
    createArticle: (req, res) => {
        console.log('[STOCK] Création d\'un nouvel article:', req.body);

        const { nom, description, prix_unitaire, unite, categorie, stock_actuel, seuil_alerte, fournisseur } = req.body;

        // Validation des données obligatoires
        if (!nom || prix_unitaire == null) {
            return res.status(400).json({
                success: false,
                message: 'Le nom et le prix unitaire sont obligatoires'
            });
        }

        if (prix_unitaire <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Le prix unitaire doit être supérieur à 0'
            });
        }

        const produitData = {
            nom: nom.trim(),
            description: description ? description.trim() : '',
            prix_unitaire: parseFloat(prix_unitaire),
            unite: unite || 'piece',
            categorie: categorie || 'autre',
            stock_actuel: parseInt(stock_actuel) || 0,
            seuil_alerte: parseInt(seuil_alerte) || 15,
            fournisseur: fournisseur || 'Fournisseur Standard',
            est_obligatoire: false
        };

        Commande.createProduit(produitData, (err, nouveauProduit) => {
            if (err) {
                console.error('[STOCK] Erreur création produit:', err);

                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({
                        success: false,
                        message: 'Un produit avec ce nom existe déjà'
                    });
                }

                return res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la création du produit',
                    error: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne'
                });
            }

            console.log(`[STOCK] Article créé avec succès: ${nouveauProduit.id_article}`);

            res.status(201).json({
                success: true,
                article: nouveauProduit,
                message: `Article créé avec succès avec l'ID: ${nouveauProduit.id_article}`
            });
        });
    },

    /**
     * GET /api/stocks/articles/:id
     * Récupérer un produit par son ID
     */
    getArticleById: (req, res) => {
        const articleId = req.params.id;
        console.log(`[STOCK] Récupération de l'article: ${articleId}`);

        // Extraire l'ID numérique si format ART-XXX
        const id = articleId.startsWith('ART-') ? parseInt(articleId.replace('ART-', '')) : parseInt(articleId);

        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID article invalide'
            });
        }

        Commande.getProduitById(id, (err, produit) => {
            if (err) {
                console.error('[STOCK] Erreur récupération produit:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Erreur serveur lors de la récupération du produit',
                    error: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne'
                });
            }

            if (!produit) {
                return res.status(404).json({
                    success: false,
                    message: 'Article non trouvé'
                });
            }

            console.log(`[STOCK] Article trouvé: ${produit.id_article}`);

            res.json({
                success: true,
                article: produit,
                message: 'Article récupéré avec succès'
            });
        });
    },

    /**
     * PUT /api/stocks/articles/:id
     * Modifier un article existant
     */
    updateArticle: (req, res) => {
        const articleId = req.params.id;
        const { nom, description, prix_unitaire, unite, categorie, seuil_alerte, fournisseur } = req.body;

        console.log(`[STOCK] Modification de l'article: ${articleId}`, req.body);

        // Extraire l'ID numérique
        const id = articleId.startsWith('ART-') ? parseInt(articleId.replace('ART-', '')) : parseInt(articleId);

        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID article invalide'
            });
        }

        // Pour l'instant, on retourne une réponse temporaire
        // À implémenter avec une méthode updateProduit dans le modèle Commande
        res.json({
            success: true,
            message: 'Fonctionnalité de modification à implémenter dans le modèle',
            article_id: articleId
        });
    },

    /**
     * DELETE /api/stocks/articles/:id
     * Désactiver un article (soft delete)
     */
    deleteArticle: (req, res) => {
        const articleId = req.params.id;
        console.log(`[STOCK] Désactivation de l'article: ${articleId}`);

        // Extraire l'ID numérique
        const id = articleId.startsWith('ART-') ? parseInt(articleId.replace('ART-', '')) : parseInt(articleId);

        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID article invalide'
            });
        }

        // Pour l'instant, on retourne une réponse temporaire
        // À implémenter avec une méthode deleteProduit dans le modèle Commande
        res.json({
            success: true,
            message: 'Fonctionnalité de suppression à implémenter dans le modèle',
            article_id: articleId
        });
    },

    /**
     * GET /api/stocks/mouvements
     * Récupérer l'historique des mouvements de stock
     */
    getMouvements: (req, res) => {
        console.log('[STOCK] Récupération des mouvements de stock...');

        const { limit = 50, offset = 0, article_id } = req.query;

        // Pour l'instant, on retourne des données de test
        // À implémenter avec une vraie table mouvements_stock
        const mouvementsTest = [
            {
                id: 1,
                article_id: 1,
                article_nom: "Pain de mie complet",
                type: "entree",
                quantite: 50,
                motif: "Livraison fournisseur",
                date: "2025-01-20T10:30:00Z",
                utilisateur: "Admin"
            },
            {
                id: 2,
                article_id: 2,
                article_nom: "Farine T65",
                type: "sortie",
                quantite: 20,
                motif: "Commande Franchise Paris",
                date: "2025-01-19T14:15:00Z",
                utilisateur: "Admin"
            },
            {
                id: 3,
                article_id: 1,
                article_nom: "Pain de mie complet",
                type: "sortie",
                quantite: 5,
                motif: "Vente directe",
                date: "2025-01-18T16:45:00Z",
                utilisateur: "Caissier"
            }
        ];

        // Filtrer par article_id si spécifié
        let mouvementsFiltres = mouvementsTest;
        if (article_id) {
            mouvementsFiltres = mouvementsTest.filter(m => m.article_id === parseInt(article_id));
        }

        // Appliquer limite et offset
        const startIndex = parseInt(offset);
        const endIndex = startIndex + parseInt(limit);
        const mouvementsPagines = mouvementsFiltres.slice(startIndex, endIndex);

        res.json({
            success: true,
            mouvements: mouvementsPagines,
            count: mouvementsPagines.length,
            total: mouvementsFiltres.length,
            message: 'Mouvements récupérés avec succès (données de test)'
        });
    },

    /**
     * POST /api/stocks/mouvements
     * Ajouter un mouvement de stock
     */
    addMouvement: (req, res) => {
        console.log('[STOCK] Ajout d\'un mouvement de stock:', req.body);

        const { article_id, type, quantite, motif, date } = req.body;

        // Validation des données
        if (!article_id || !type || !quantite || !motif) {
            return res.status(400).json({
                success: false,
                message: 'article_id, type, quantite et motif sont obligatoires'
            });
        }

        if (!['entree', 'sortie'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Le type doit être "entree" ou "sortie"'
            });
        }

        if (quantite <= 0) {
            return res.status(400).json({
                success: false,
                message: 'La quantité doit être supérieure à 0'
            });
        }

        // Pour l'instant, simulation de l'ajout
        // À implémenter avec une vraie table mouvements_stock
        const nouveauMouvement = {
            id: Date.now(), // ID temporaire
            article_id: parseInt(article_id),
            type,
            quantite: parseInt(quantite),
            motif: motif.trim(),
            date: date || new Date().toISOString(),
            utilisateur: req.user ? req.user.username : 'Utilisateur'
        };

        console.log(`[STOCK] Mouvement simulé créé:`, nouveauMouvement);

        res.status(201).json({
            success: true,
            mouvement: nouveauMouvement,
            message: 'Mouvement ajouté avec succès (simulation - à implémenter en base)'
        });
    },

    /**
     * GET /api/stocks/categories
     * Récupérer toutes les catégories d'articles
     */
    getCategories: (req, res) => {
        console.log('[STOCK] Récupération des catégories...');

        // Pour l'instant, on peut récupérer les catégories depuis les produits existants
        Commande.getAllProduits((err, produits) => {
            if (err) {
                console.error('[STOCK] Erreur récupération catégories:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la récupération des catégories'
                });
            }

            // Extraire les catégories uniques
            const categories = [...new Set(produits.map(p => p.categorie))].filter(Boolean);

            res.json({
                success: true,
                categories,
                count: categories.length,
                message: 'Catégories récupérées avec succès'
            });
        });
    },

    /**
     * GET /api/stocks/dashboard
     * Récupérer les statistiques pour le dashboard
     */
    getDashboardStats: (req, res) => {
        console.log('[STOCK] Récupération des statistiques dashboard...');

        Commande.getAllProduits((err, produits) => {
            if (err) {
                console.error('[STOCK] Erreur récupération stats:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la récupération des statistiques'
                });
            }

            // Calculer les statistiques
            const totalArticles = produits.length;
            const articlesAlerte = produits.filter(p => p.stock_actuel <= p.seuil_alerte && p.stock_actuel > 0).length;
            const articlesRupture = produits.filter(p => p.stock_actuel === 0).length;
            const valeurTotaleStock = produits.reduce((sum, p) => sum + (p.stock_actuel * p.prix_unitaire), 0);

            // Répartition par catégorie
            const repartitionCategories = {};
            produits.forEach(p => {
                if (!repartitionCategories[p.categorie]) {
                    repartitionCategories[p.categorie] = 0;
                }
                repartitionCategories[p.categorie]++;
            });

            // Articles les plus en stock
            const articlesStockEleve = produits
                .sort((a, b) => b.stock_actuel - a.stock_actuel)
                .slice(0, 5)
                .map(p => ({
                    nom: p.nom,
                    stock: p.stock_actuel,
                    unite: p.unite
                }));

            // Articles en alerte
            const articlesEnAlerte = produits
                .filter(p => p.stock_actuel <= p.seuil_alerte && p.stock_actuel > 0)
                .map(p => ({
                    nom: p.nom,
                    stock: p.stock_actuel,
                    seuil: p.seuil_alerte,
                    unite: p.unite
                }));

            res.json({
                success: true,
                stats: {
                    total_articles: totalArticles,
                    articles_alerte: articlesAlerte,
                    articles_rupture: articlesRupture,
                    valeur_totale_stock: Math.round(valeurTotaleStock * 100) / 100,
                    repartition_categories: repartitionCategories,
                    articles_stock_eleve: articlesStockEleve,
                    articles_en_alerte: articlesEnAlerte
                },
                message: 'Statistiques récupérées avec succès'
            });
        });
    }
};

module.exports = stockController;