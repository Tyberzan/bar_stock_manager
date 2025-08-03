const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');
const { protect } = require('../middleware/auth');

// Toutes les routes sont protégées
router.use(protect);

// === ALERTES EMAIL ===
// Envoyer une alerte de stock
router.post('/alert', emailController.sendStockAlert);

// Envoyer un rapport hebdomadaire
router.post('/weekly-report', emailController.sendWeeklyReport);

// Envoyer un email de test
router.post('/test', emailController.sendTestEmail);

// === EXPORTS ===
// Exporter vers Excel
router.get('/export/excel/:barId/:type', emailController.exportToExcel);

// Exporter vers Google Sheets
router.get('/export/google-sheets/:barId/:type', emailController.exportToGoogleSheets);

// === CONFIGURATION ===
// Vérifier la configuration email
router.get('/config/verify', emailController.verifyEmailConfig);

// Configurer les alertes automatiques
router.post('/config/auto-alerts', emailController.configureAutoAlerts);

// === MAINTENANCE ===
// Nettoyer les anciens exports
router.delete('/exports/cleanup', emailController.cleanOldExports);

module.exports = router; 