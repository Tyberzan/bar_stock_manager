const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { protect, authorize } = require('../middleware/auth');

// Routes protégées - nécessitent l'authentification pour le filtrage par rôle
router.get('/', protect, companyController.getAllCompanies);
router.get('/:id', protect, companyController.getCompanyById);

// Routes protégées pour les administrateurs
router.post('/', protect, authorize('admin'), companyController.createCompany);
router.put('/:id', protect, authorize('admin'), companyController.updateCompany);
router.delete('/:id', protect, authorize('admin'), companyController.deleteCompany);

// Route pour obtenir tous les bars d'une entreprise
router.get('/:id/bars', companyController.getCompanyBars);

module.exports = router; 