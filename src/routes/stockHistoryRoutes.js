const express = require('express');
const router = express.Router();
const stockHistoryController = require('../controllers/stockHistoryController');
const { protect, authorize } = require('../middleware/auth');

// Route pour le résumé (doit être avant la route avec :id)
router.get('/summary/:barId', protect, stockHistoryController.getConsumptionSummary);

// Routes protégées pour l'historique des stocks
router.get('/', protect, stockHistoryController.getAllStockHistory);
router.get('/:id', protect, stockHistoryController.getStockHistoryById);

// Route pour créer un historique de stock (après un shift)
router.post('/', protect, stockHistoryController.createStockHistory);

module.exports = router; 