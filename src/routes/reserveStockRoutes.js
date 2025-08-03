const express = require('express');
const router = express.Router();
const reserveStockController = require('../controllers/reserveStockController');
const { protect } = require('../middleware/auth');

// Routes pour les stocks de réserve
router.get('/reserve/:reserveId', protect, reserveStockController.getReserveStocks);
router.get('/:id', protect, reserveStockController.getReserveStockById);
router.post('/', protect, reserveStockController.createReserveStock);
router.put('/:id', protect, reserveStockController.updateReserveStock);
router.delete('/:id', protect, reserveStockController.deleteReserveStock);

// Route pour initialiser les stocks d'une réserve
router.post('/reserve/:reserveId/initialize', protect, reserveStockController.initializeReserveStocks);

module.exports = router; 