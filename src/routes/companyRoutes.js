const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { protect, authorize } = require('../middleware/auth');

// Routes publiques
router.get('/', companyController.getAllCompanies);
router.get('/:id', companyController.getCompanyById);

// Routes protégées pour les administrateurs
router.post('/', protect, authorize('admin'), companyController.createCompany);
router.put('/:id', protect, authorize('admin'), companyController.updateCompany);
router.delete('/:id', protect, authorize('admin'), companyController.deleteCompany);

// Route pour obtenir tous les bars d'une entreprise
router.get('/:id/bars', companyController.getCompanyBars);

module.exports = router; 