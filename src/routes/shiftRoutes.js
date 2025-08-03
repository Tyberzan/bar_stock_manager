const express = require('express');
const router = express.Router();
const shiftController = require('../controllers/shiftController');
const { protect } = require('../middleware/auth');

// Routes pour les services (shifts) - Temporairement sans protection pour les tests
router.post('/', shiftController.startShift);
router.get('/', protect, shiftController.getAllShifts);
router.get('/active', protect, shiftController.getActiveShifts);
router.get('/bar/:barId', protect, shiftController.getShiftsByBar);
router.get('/:id', protect, shiftController.getShiftById);
router.put('/:id/end', protect, shiftController.endShift);
router.put('/:id/status', protect, shiftController.updateShiftStatus);

// Routes pour les comptages de service
router.post('/:shiftId/counts', protect, shiftController.initializeShiftCounts);
router.get('/:shiftId/counts', protect, shiftController.getShiftCounts);
router.put('/:shiftId/counts/:countId', protect, shiftController.updateShiftCount);
router.get('/:shiftId/report', protect, shiftController.generateShiftReport);

module.exports = router; 