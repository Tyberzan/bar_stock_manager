const express = require('express');
const router = express.Router();
const multiReserveController = require('../controllers/multiReserveController');
const { protect } = require('../middleware/auth');

// Routes pour les réserves
router.get('/', protect, multiReserveController.getAllReserves);
router.get('/types', protect, multiReserveController.getReserveTypes);
router.get('/stats', protect, multiReserveController.getReserveStats);
router.get('/:id', protect, multiReserveController.getReserveById);
router.post('/', protect, multiReserveController.createReserve);
router.put('/:id', protect, multiReserveController.updateReserve);
router.delete('/:id', protect, multiReserveController.deleteReserve);

// Route pour initialiser les réserves par défaut
router.post('/initialize-defaults', protect, multiReserveController.initializeDefaultReserves);

module.exports = router; 