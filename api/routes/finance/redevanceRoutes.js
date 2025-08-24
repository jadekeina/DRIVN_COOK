const express = require('express');
const router = express.Router();

// Import du contrôleur redevances
const redevancesController = require('../../controllers/finance/redevancesController');

// Import du middleware d'authentification (CORRIGÉ - destructuré)
const { authenticateToken } = require('../../middleware/auth');

// Middleware de logging pour les routes redevances
router.use((req, res, next) => {
    console.log(`[REDEVANCES ROUTE] ${req.method} ${req.originalUrl}`);
    next();
});

// Route de test
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Routes redevances opérationnelles',
        endpoints: [
            'GET /api/redevances - Liste toutes les redevances par franchisé',
            'POST /api/redevances/:franchiseeId/:mois/payer - Marquer une redevance comme payée',
            'GET /api/redevances/retards - Redevances en retard',
            'GET /api/redevances/report - Rapport détaillé des redevances'
        ]
    });
});

/**
 * GET /api/redevances
 * Récupère toutes les redevances calculées pour tous les franchisés
 * Regroupe par franchisé avec le détail des déclarations mensuelles
 */
router.get('/', authenticateToken, redevancesController.getAllRedevances);

/**
 * POST /api/redevances/:franchiseeId/:mois/payer
 * Marque une redevance comme payée pour un franchisé et un mois donnés
 * Body: { montant_paye: number, date_paiement: string, methode_paiement: string }
 */
router.post('/:franchiseeId/:mois/payer', authenticateToken, redevancesController.marquerRedevancePayee);

/**
 * GET /api/redevances/retards
 * Récupère toutes les redevances en retard (plus de 30 jours)
 * Calcule le niveau d'urgence et les totaux
 */
router.get('/retards', authenticateToken, redevancesController.getRedevancesEnRetard);

/**
 * GET /api/redevances/report
 * Génère un rapport détaillé des redevances
 * Query params: periode (optionnel, format: '2024-03' ou 'all')
 */
router.get('/report', authenticateToken, redevancesController.generateRedevancesReport);

/**
 * POST /api/redevances/:franchiseeId/:mois/relance
 * Envoie une relance par email pour une redevance en retard
 */
router.post('/:franchiseeId/:mois/relance', authenticateToken, redevancesController.envoyerRelanceRedevance);

// Middleware de gestion d'erreurs spécifique aux redevances
router.use((error, req, res, next) => {
    console.error('[REDEVANCES ERROR]', error);

    if (error.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Données invalides pour redevances',
            details: error.message
        });
    }

    if (error.code === 'ER_NO_SUCH_TABLE') {
        return res.status(500).json({
            success: false,
            message: 'Tables manquantes (users, ventes)',
            details: 'Vérifiez la structure de la base de données'
        });
    }

    res.status(500).json({
        success: false,
        message: 'Erreur interne des routes redevances',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
    });
});

module.exports = router;