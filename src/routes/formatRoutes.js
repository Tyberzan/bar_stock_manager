const express = require('express');
const router = express.Router();
const formatController = require('../controllers/formatController');
const { protect, authorize } = require('../middleware/auth');

// Routes protégées pour les formats
router.get('/', protect, formatController.getAllFormats);
router.get('/:id', protect, formatController.getFormatById);

// Routes protégées pour les administrateurs et managers
router.post('/', protect, authorize('admin', 'manager'), formatController.createFormat);
router.put('/:id', protect, authorize('admin', 'manager'), formatController.updateFormat);
router.delete('/:id', protect, authorize('admin', 'manager'), formatController.deleteFormat);

module.exports = router; 