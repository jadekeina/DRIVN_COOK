 const express = require('express');
const router = express.Router();

// Import du contrôleur
const stockController = require('../../controllers/Commande/stockController');

// Import du middleware d'authentification
const { authenticateToken } = require('../../middleware/auth');

// Middleware de logging pour les routes stocks
router.use((req, res, next) => {
    console.log(`[STOCK ROUTES] ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
    next();
});

/**
 * GET /api/stocks/test
 * Route de test pour vérifier que l'API stocks fonctionne
 */
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'API Stocks opérationnelle',
        timestamp: new Date().toISOString(),
        endpoints: [
            'GET /api/stocks/articles - Liste de tous les articles/produits',
            'POST /api/stocks/articles - Créer un nouvel article',
            'GET /api/stocks/articles/:id - Récupérer un article par ID',
            'PUT /api/stocks/articles/:id - Modifier un article',
            'DELETE /api/stocks/articles/:id - Supprimer un article',
            'GET /api/stocks/categories - Liste des catégories',
            'GET /api/stocks/mouvements - Historique des mouvements',
            'POST /api/stocks/mouvements - Ajouter un mouvement',
            'GET /api/stocks/dashboard - Statistiques dashboard'
        ]
    });
});

/**
 * GET /api/stocks/articles
 * Récupérer tous les articles pour la gestion des stocks
 */
router.get('/articles', authenticateToken, stockController.getAllArticles);

/**
 * POST /api/stocks/articles
 * Créer un nouvel article
 */
router.post('/articles', authenticateToken, stockController.createArticle);

/**
 * GET /api/stocks/articles/:id
 * Récupérer un article par son ID
 */
router.get('/articles/:id', authenticateToken, stockController.getArticleById);

/**
 * PUT /api/stocks/articles/:id
 * Modifier un article existant
 */
router.put('/articles/:id', authenticateToken, stockController.updateArticle);

/**
 * DELETE /api/stocks/articles/:id
 * Désactiver un article (soft delete)
 */
router.delete('/articles/:id', authenticateToken, stockController.deleteArticle);

/**
 * GET /api/stocks/categories
 * Récupérer toutes les catégories d'articles
 */
router.get('/categories', authenticateToken, stockController.getCategories);

/**
 * GET /api/stocks/mouvements
 * Récupérer l'historique des mouvements de stock
 */
router.get('/mouvements', authenticateToken, stockController.getMouvements);

/**
 * POST /api/stocks/mouvements
 * Ajouter un mouvement de stock
 */
router.post('/mouvements', authenticateToken, stockController.addMouvement);

/**
 * GET /api/stocks/dashboard
 * Récupérer les statistiques pour le dashboard
 */
router.get('/dashboard', authenticateToken, stockController.getDashboardStats);

// Middleware de gestion d'erreurs spécifique aux routes stocks
router.use((error, req, res, next) => {
    console.error('[STOCK ROUTES ERROR]', error);

    if (error.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Données invalides pour l\'article',
            details: error.message
        });
    }

    if (error.code === 'ER_NO_SUCH_TABLE') {
        return res.status(500).json({
            success: false,
            message: 'Tables produits manquantes',
            details: 'Vérifiez la structure de la base de données'
        });
    }

    if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
            success: false,
            message: 'Article avec ce nom existe déjà'
        });
    }

    res.status(500).json({
        success: false,
        message: 'Erreur interne des routes stocks',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
    });
});

module.exports = router;