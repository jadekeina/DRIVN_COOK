const express = require('express');
const router = express.Router();

// Import de toutes les routes finance
const financeRoutes = require('./financeRoutes');
const redevancesRoutes = require('./redevanceRoutes');
const droitsEntreeRoutes = require('./droitEntreeRoutes');

// Middleware de logging global pour toutes les routes finance
router.use((req, res, next) => {
    console.log(`[FINANCE MODULE] ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
    next();
});

// Route de test du module finance
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Module finance opérationnel',
        version: '1.0.0',
        modules: {
            finance_generale: '/api/finance',
            redevances: '/api/finance/redevances',
            droits_entree: '/api/finance/droits-entree'
        },
        endpoints_principaux: [
            'GET /api/finance/franchises - Vue d\'ensemble financière',
            'GET /api/finance/franchises/:id - Détails d\'un franchisé',
            'GET /api/finance/stats - Statistiques globales',
            'GET /api/finance/redevances - Gestion des redevances',
            'GET /api/finance/droits-entree - Gestion des droits d\'entrée'
        ]
    });
});

// Montage des routes spécialisées
router.use('/redevances', redevancesRoutes);
router.use('/droits-entree', droitsEntreeRoutes);

// Les routes finance générales sont montées directement
router.use('/', financeRoutes);

// Middleware de gestion d'erreurs pour tout le module finance
router.use((error, req, res, next) => {
    console.error('[FINANCE MODULE ERROR]', {
        url: req.originalUrl,
        method: req.method,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });

    // Erreurs spécifiques à la finance
    if (error.code === 'ECONNREFUSED') {
        return res.status(503).json({
            success: false,
            message: 'Service de base de données indisponible',
            code: 'DB_CONNECTION_ERROR'
        });
    }

    if (error.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Données financières invalides',
            details: error.message,
            code: 'VALIDATION_ERROR'
        });
    }

    if (error.code === 'ER_NO_SUCH_TABLE') {
        return res.status(500).json({
            success: false,
            message: 'Configuration de base de données incomplète',
            details: 'Tables financières manquantes',
            code: 'DB_SCHEMA_ERROR'
        });
    }

    // Erreur générique
    res.status(500).json({
        success: false,
        message: 'Erreur du module finance',
        code: 'FINANCE_MODULE_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
    });
});

// Route 404 pour les endpoints finance non trouvés
router.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Endpoint finance non trouvé: ${req.method} ${req.originalUrl}`,
        endpoints_disponibles: [
            'GET /api/finance/test',
            'GET /api/finance/franchises',
            'GET /api/finance/franchises/:id',
            'GET /api/finance/stats',
            'GET /api/finance/redevances',
            'GET /api/finance/droits-entree'
        ]
    });
});

module.exports = router;