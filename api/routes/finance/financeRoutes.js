const express = require('express');
const router = express.Router();

// Import du contrôleur finance
const financeController = require('../../controllers/finance/financeController');

// Import du middleware d'authentification
const { authenticateToken } = require('../../middleware/auth');

// Middleware de logging spécifique aux routes finance
router.use((req, res, next) => {
    console.log(`[FINANCE ROUTE] ${req.method} ${req.originalUrl}`);
    next();
});

// Route de test
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Routes financières opérationnelles - Version simplifiée',
        endpoints: [
            'GET /api/finance/franchises - Liste tous les utilisateurs avec statut paiement',
            'GET /api/finance/franchises/:id - Détails d\'un utilisateur',
            'POST /api/finance/franchises/:id/create-franchise - Créer franchise pour utilisateur payé',
            'PUT /api/finance/franchises/:id/zone - Mettre à jour zone assignée',
            'GET /api/finance/stats - Statistiques globales simplifiées',
            'GET /api/finance/franchises/:id/report - Rapport utilisateur'
        ]
    });
});

/**
 * GET /api/finance/franchises
 * Liste tous les utilisateurs avec leur statut de paiement et assignation
 * Focus sur: paiement complet (50k), franchises assignées, zones
 */
router.get('/franchises', authenticateToken, financeController.getAllFranchisesFinance);

/**
 * GET /api/finance/franchises/:id
 * Détails complets d'un utilisateur spécifique
 * Inclut: infos paiement, franchise assignée, zone
 */
router.get('/franchises/:id', authenticateToken, financeController.getFranchiseDetail);

/**
 * POST /api/finance/franchises/:id/create-franchise
 * Crée une franchise pour un utilisateur qui a payé les 50k
 * Body: {
 *   name: string,
 *   address: string,
 *   city: string,
 *   postal_code: string,
 *   email: string,
 *   phone: string
 * }
 */
router.post('/franchises/:id/create-franchise', authenticateToken, financeController.createFranchiseForUser);

/**
 * PUT /api/finance/franchises/:id/zone
 * Met à jour la zone assignée à un utilisateur
 * Body: { zone: string }
 */
router.put('/franchises/:id/zone', authenticateToken, financeController.updateZoneAssignment);

/**
 * GET /api/finance/stats
 * Statistiques globales simplifiées
 * Focus sur: nombre payés, assignés, revenus collectés
 */
router.get('/stats', authenticateToken, financeController.getGlobalFinanceStats);

/**
 * GET /api/finance/franchises/:id/report
 * Génère un rapport simplifié pour un utilisateur
 * Inclut: statut paiement, franchise, recommandations d'actions
 */
router.get('/franchises/:id/report', authenticateToken, financeController.generateUserReport);

// Middleware de gestion d'erreurs spécifique aux routes finance
router.use((error, req, res, next) => {
    console.error('[FINANCE ERROR]', error);

    if (error.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Données invalides',
            details: error.message
        });
    }

    if (error.code === 'ER_NO_SUCH_TABLE') {
        return res.status(500).json({
            success: false,
            message: 'Erreur de base de données - table manquante',
            details: 'Vérifiez que les tables users et franchises existent'
        });
    }

    if (error.code === 'ECONNREFUSED') {
        return res.status(500).json({
            success: false,
            message: 'Impossible de se connecter à la base de données',
            details: 'Vérifiez que MySQL est démarré'
        });
    }

    res.status(500).json({
        success: false,
        message: 'Erreur interne des routes financières',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
    });
});

module.exports = router;