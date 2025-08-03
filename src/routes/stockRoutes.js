const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const { protect, authorize } = require('../middleware/auth');

// Route pour obtenir les stocks à réapprovisionner (doit être avant la route avec :id)
router.get('/restock/:barId', protect, stockController.getStocksToRestock);

// Route pour initialiser tous les stocks d'un bar (doit être avant la route avec :id)
router.post('/initialize/:barId', protect, stockController.initializeBarStocks);

// Routes protégées pour les stocks
router.get('/', protect, stockController.getAllStocks);
router.get('/:id', protect, stockController.getStockById);

// Routes protégées pour les utilisateurs authentifiés (tous les rôles)
router.post('/', protect, stockController.createOrUpdateStock);
router.put('/:id', protect, stockController.updateStock);
router.put('/quantity/:id', protect, stockController.updateStockQuantity);

module.exports = router; 