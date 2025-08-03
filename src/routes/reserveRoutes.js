const express = require('express');
const router = express.Router();
const reserveController = require('../controllers/reserveController');
const { protect } = require('../middleware/auth');

// Appliquer l'authentification à toutes les routes
router.use(protect);

// Routes pour les réserves
router.get('/', reserveController.getAllReserves);
router.get('/:id', reserveController.getReserveById);
router.post('/', reserveController.createReserve);
router.put('/:id', reserveController.updateReserve);
router.delete('/:id', reserveController.deleteReserve);

// Route pour initialiser toutes les réserves
router.post('/initialize', reserveController.initializeReserves);

// Routes pour les transferts
router.post('/transfer', reserveController.transferToBar);
router.get('/transfers/history', reserveController.getTransferHistory);

module.exports = router; 