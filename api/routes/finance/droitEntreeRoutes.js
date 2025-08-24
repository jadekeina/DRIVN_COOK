const express = require('express');
const router = express.Router();

// Import du contrôleur droits d'entrée
const droitsEntreeController = require('../../controllers/finance/droitEntreeController');

// Import du middleware d'authentification (destructuré)
const { authenticateToken } = require('../../middleware/auth');

// Middleware de logging pour les routes droits d'entrée
router.use((req, res, next) => {
    console.log(`[DROITS ENTREE ROUTE] ${req.method} ${req.originalUrl}`);
    next();
});

// Route de test
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Routes droits d\'entrée opérationnelles',
        endpoints: [
            'GET /api/droits-entree - Liste tous les droits d\'entrée',
            'POST /api/droits-entree/:franchiseeId/paiement - Mettre à jour un paiement',
            'GET /api/droits-entree/retards - Droits d\'entrée en retard',
            'GET /api/droits-entree/report - Rapport détaillé des droits d\'entrée'
        ]
    });
});

/**
 * GET /api/droits-entree
 * Récupère tous les droits d'entrée avec détails des échéances
 * Calcule automatiquement les statuts et retards
 */
router.get('/', authenticateToken, droitsEntreeController.getAllDroitsEntree);

/**
 * POST /api/droits-entree/:franchiseeId/paiement
 * Met à jour le paiement d'un droit d'entrée (initial ou échéance)
 * Body: {
 *   type_paiement: 'initial' | 'echeance_1' | 'echeance_2' | 'echeance_3' | 'echeance_4',
 *   paye: boolean,
 *   date_paiement: string,
 *   montant: number,
 *   notes: string
 * }
 */
router.post('/:franchiseeId/paiement', authenticateToken, droitsEntreeController.updatePaiementDroitEntree);

/**
 * GET /api/droits-entree/retards
 * Récupère tous les droits d'entrée en retard
 * Calcule les niveaux d'urgence et les montants dus
 */
router.get('/retards', authenticateToken, droitsEntreeController.getDroitsEntreeEnRetard);

/**
 * GET /api/droits-entree/report
 * Génère un rapport complet des droits d'entrée
 * Inclut statistiques, analyses par période et recommandations
 */
router.get('/report', authenticateToken, droitsEntreeController.generateDroitsEntreeReport);

// Middleware de gestion d'erreurs spécifique aux droits d'entrée
router.use((error, req, res, next) => {
    console.error('[DROITS ENTREE ERROR]', error);

    if (error.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Données invalides pour droits d\'entrée',
            details: error.message
        });
    }

    if (error.code === 'ER_NO_SUCH_TABLE') {
        return res.status(500).json({
            success: false,
            message: 'Table utilisateurs manquante',
            details: 'Vérifiez la structure de la base de données'
        });
    }

    res.status(500).json({
        success: false,
        message: 'Erreur interne des routes droits d\'entrée',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
    });
});

module.exports = router;