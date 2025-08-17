// routes/Auth/franchiseManagement.js
const express = require('express');
const router = express.Router();
// CORRECTION DU CHEMIN : Retire le dossier /franchise/
const FranchiseManagementController = require('../../controllers/franchise/franchiseManagementController');
const { authenticateToken, requireRole } = require('../../middleware/auth');

console.log('Chargement des routes de gestion des franchises...');

// Toutes les routes nécessitent d'être admin
router.use(authenticateToken);
router.use(requireRole(['admin']));

// ===== ROUTES DASHBOARD =====
router.get('/dashboard/stats', FranchiseManagementController.getDashboardStats);

// ===== ROUTES FRANCHISÉS =====
router.get('/franchisees', FranchiseManagementController.getAllFranchisees);
router.post('/franchisees', FranchiseManagementController.createFranchisee);
router.put('/franchisees/:id', FranchiseManagementController.updateFranchisee);
router.delete('/franchisees/:id', FranchiseManagementController.deleteFranchisee);

// ===== ROUTES CAMIONS =====
router.get('/camions', FranchiseManagementController.getAllCamions);
router.post('/camions', FranchiseManagementController.createCamion);
router.put('/camions/:id', FranchiseManagementController.updateCamion);
router.put('/camions/:camionId/assign', FranchiseManagementController.assignCamion);
router.post('/camions/:camionId/panne', FranchiseManagementController.reportPanne);

console.log('Routes de gestion des franchises définies');

module.exports = router;