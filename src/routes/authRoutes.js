const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Routes publiques
router.post('/register', authController.register);
router.post('/register-with-company', authController.registerWithCompany);
router.post('/login', authController.login);

// Routes protégées
router.get('/profile', protect, authController.getProfile);

module.exports = router; 