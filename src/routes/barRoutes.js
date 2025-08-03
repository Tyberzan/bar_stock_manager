const express = require('express');
const router = express.Router();
const barController = require('../controllers/barController');
const { protect, authorize } = require('../middleware/auth');

// Routes protégées pour les bars
router.get('/', protect, barController.getAllBars);
router.get('/:id', protect, barController.getBarById);

// Routes protégées pour les administrateurs uniquement
router.post('/', protect, authorize('admin'), barController.createBar);
router.put('/:id', protect, authorize('admin'), barController.updateBar);
router.delete('/:id', protect, authorize('admin'), barController.deleteBar);

module.exports = router; 