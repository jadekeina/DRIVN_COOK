const express = require('express');
const router = express.Router();

// Import du contrôleur finance
const financeController = require('../../controllers/finance/financeController');

// CORRECTION: Import correct du middleware d'authentification
const { authenticateToken } = require('../../middleware/auth'); // Destructurer la fonction

// Middleware de logging spécifique aux routes finance
router.use((req, res, next) => {
    console.log(`[FINANCE ROUTE] ${req.method} ${req.originalUrl}`);
    next();
});

// Routes publiques (pour les tests)
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Routes financières opérationnelles',
        endpoints: [
            'GET /api/finance/franchises - Liste tous les franchisés avec données financières',
            'GET /api/finance/franchises/:id - Détails financiers d\'un franchisé',
            'POST /api/finance/franchises/:id/droit-entree - Mettre à jour paiement droit d\'entrée',
            'GET /api/finance/stats - Statistiques financières globales',
            'GET /api/finance/franchises/:id/report - Générer rapport financier'
        ]
    });
});

// Routes protégées (nécessitent une authentification)

/**
 * GET /api/finance/franchises
 * Récupère la liste de tous les franchisés avec leurs données financières
 * Utilisé pour la vue d'ensemble dans le composant React
 */
router.get('/franchises', authenticateToken, financeController.getAllFranchisesFinance);

/**
 * GET /api/finance/franchises/:id
 * Récupère les détails financiers complets d'un franchisé spécifique
 * Utilisé pour la vue détaillée dans le composant React
 */
router.get('/franchises/:id', authenticateToken, financeController.getFranchiseDetail);

/**
 * POST /api/finance/franchises/:id/droit-entree
 * Met à jour le statut de paiement des droits d'entrée
 * Body: { paye: boolean, date_paiement: string }
 */
router.post('/franchises/:id/droit-entree', authenticateToken, financeController.updateDroitEntreePaiement);

/**
 * GET /api/finance/franchises/:id/report
 * Génère un rapport financier détaillé pour un franchisé
 * Retourne des statistiques et métriques financières
 */
router.get('/franchises/:id/report', authenticateToken, financeController.generateFinanceReport);

/**
 * GET /api/finance/stats
 * Récupère les statistiques financières globales du réseau
 * Utilisé pour les tableaux de bord et rapports globaux
 */
router.get('/stats', authenticateToken, financeController.getGlobalFinanceStats);

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
            details: 'Vérifiez que toutes les tables sont créées'
        });
    }

    res.status(500).json({
        success: false,
        message: 'Erreur interne des routes financières',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
    });
});

module.exports = router;