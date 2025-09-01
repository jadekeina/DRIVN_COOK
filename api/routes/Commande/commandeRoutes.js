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


router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'API Commandes opérationnelle',
        timestamp: new Date().toISOString(),
        endpoints: [
            'GET /api/commandes/list - Liste de toutes les commandes',
            'GET /api/commandes/my-commandes - Mes commandes (franchise)',
            'POST /api/commandes - Créer une nouvelle commande',
            'PUT /api/commandes/:id/statut - Mettre à jour le statut d\'une commande',
            'GET /api/commandes/:id/bon-commande-download - Télécharger bon PDF',
            'GET /api/commandes/franchises - Liste des franchises'
        ]
    });
});


router.get('/list', authenticateToken, commandeController.getAllCommandes);
router.get('/my-commandes', authenticateToken, commandeController.getMyCommandes);


router.post('/', authenticateToken, commandeController.createCommande);

router.put('/:id/statut', authenticateToken, commandeController.updateStatutCommande);


router.get('/franchises', authenticateToken, commandeController.getFranchises);

router.post('/create-payment-session', authenticateToken, commandeController.createPaymentSession);
router.get('/:id/bon-commande-download', authenticateToken, commandeController.getBonCommandeDownload);


router.get('/:id/bon-commande', authenticateToken, (req, res) => {
    const { id } = req.params;
    return res.json({
        success: true,
        pdf_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/static/bon-commande-${encodeURIComponent(id)}.pdf`
    });
});

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