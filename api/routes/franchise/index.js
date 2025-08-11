const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../../middleware/auth');
const validators = require('../../middleware/validators');

console.log('📁 Chargement du contrôleur franchise...');

// Chargement sécurisé du contrôleur
let franchiseController;
try {
    franchiseController = require('../../controllers/franchise/franchiseController');
    console.log('✅ Contrôleur franchise chargé avec succès');
} catch (error) {
    console.error('❌ Erreur chargement contrôleur:', error.message);

    // Contrôleur de fallback
    franchiseController = {
        getAll: (req, res) => {
            res.json({
                success: true,
                message: 'Contrôleur de fallback - getAll',
                data: []
            });
        },
        getById: (req, res) => {
            res.json({
                success: true,
                message: 'Contrôleur de fallback - getById',
                data: { id: req.params.id }
            });
        },
        create: (req, res) => {
            res.json({
                success: true,
                message: 'Contrôleur de fallback - create',
                data: req.body
            });
        },
        update: (req, res) => {
            res.json({
                success: true,
                message: 'Contrôleur de fallback - update',
                data: { id: req.params.id, ...req.body }
            });
        },
        delete: (req, res) => {
            res.json({
                success: true,
                message: 'Contrôleur de fallback - delete',
                data: { id: req.params.id }
            });
        },
        getMyFranchises: (req, res) => {
            res.json({
                success: true,
                message: 'Contrôleur de fallback - getMyFranchises',
                data: []
            });
        }
    };
}

console.log('🛣️ Définition des routes...');

// Route publique - obtenir toutes les franchises
router.get('/', franchiseController.getAll);

// Route publique - obtenir une franchise par ID
router.get('/:id', franchiseController.getById);

// Routes protégées - nécessitent une authentification

// Obtenir les franchises de l'utilisateur connecté
router.get('/my/franchises', authenticateToken, franchiseController.getMyFranchises);

// Créer une nouvelle franchise (admin ou franchise_owner)
router.post('/',
    authenticateToken,
    requireRole(['admin', 'franchise_owner']),
    validators.createFranchise,
    franchiseController.create
);

// Mettre à jour une franchise (admin ou propriétaire)
router.put('/:id',
    authenticateToken,
    requireRole(['admin', 'franchise_owner']),
    validators.createFranchise,
    franchiseController.update
);

// Supprimer une franchise (admin uniquement)
router.delete('/:id',
    authenticateToken,
    requireRole(['admin']),
    franchiseController.delete
);

console.log('✅ Routes franchise définies avec succès');

// Debug: Afficher les routes définies
if (router.stack) {
    console.log('📋 Routes enregistrées:');
    router.stack.forEach((layer, i) => {
        const route = layer.route;
        if (route) {
            const methods = Object.keys(route.methods).join(', ').toUpperCase();
            console.log(`  ${i + 1}. ${methods} ${route.path}`);
        }
    });
}

module.exports = router;