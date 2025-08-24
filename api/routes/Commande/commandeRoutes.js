const express = require('express');
const router = express.Router();

// Import du contrôleur
const commandeController = require('../../controllers/Commande/commandeController');

// Import du middleware d'authentification
const { authenticateToken } = require('../../middleware/auth');

// Middleware de logging pour les routes commandes
router.use((req, res, next) => {
    console.log(`[COMMANDE ROUTES] ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
    next();
});

/**
 * GET /api/commandes/test
 * Route de test pour vérifier que l'API fonctionne
 */
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'API Commandes opérationnelle',
        timestamp: new Date().toISOString(),
        endpoints: [
            'GET /api/commandes/list - Liste de toutes les commandes',
            'POST /api/commandes - Créer une nouvelle commande',
            'PUT /api/commandes/:id/statut - Mettre à jour le statut d\'une commande',
            'GET /api/commandes/franchises - Liste des franchises'
        ]
    });
});

/**
 * GET /api/commandes/list
 * Récupérer toutes les commandes pour la page Suivi Commandes
 */
router.get('/list', authenticateToken, commandeController.getAllCommandes);

/**
 * POST /api/commandes
 * Créer une nouvelle commande
 * Body: {
 *   franchise_id: number (requis),
 *   articles: Array<{
 *     id_article: string (requis, format: ART-001),
 *     nom_article: string (requis),
 *     quantite: number (requis),
 *     prix_unitaire: number (requis),
 *     sous_total: number (calculé automatiquement si absent)
 *   }> (requis),
 *   notes: string
 * }
 */
router.post('/', authenticateToken, commandeController.createCommande);

/**
 * PUT /api/commandes/:id/statut
 * Mettre à jour le statut d'une commande
 * Params: id - ID de la commande (format: CMD-001 ou 1)
 * Body: {
 *   statut: 'en_attente' | 'confirmee' | 'preparee' | 'en_livraison' | 'livree' | 'annulee'
 * }
 */
router.put('/:id/statut', authenticateToken, commandeController.updateStatutCommande);

/**
 * GET /api/commandes/franchises
 * Récupérer la liste des franchises pour les formulaires de création de commande
 */
router.get('/franchises', authenticateToken, commandeController.getFranchises);

// Middleware de gestion d'erreurs spécifique aux routes commandes
router.use((error, req, res, next) => {
    console.error('[COMMANDE ROUTES ERROR]', error);

    if (error.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Données invalides pour la commande',
            details: error.message
        });
    }

    if (error.code === 'ER_NO_SUCH_TABLE') {
        return res.status(500).json({
            success: false,
            message: 'Tables commandes manquantes',
            details: 'Vérifiez la structure de la base de données'
        });
    }

    if (error.code === 'ER_NO_REFERENCED_ROW') {
        return res.status(400).json({
            success: false,
            message: 'Référence invalide (franchise ou produit introuvable)'
        });
    }

    res.status(500).json({
        success: false,
        message: 'Erreur interne des routes commandes',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
    });
});

module.exports = router;