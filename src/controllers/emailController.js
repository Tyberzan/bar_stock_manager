const EmailService = require('../services/emailService');
const ExcelService = require('../services/excelService');
const GoogleSheetsService = require('../services/googleSheetsService');
const { Stock, Format, Product, Bar, Company, StockHistory, User } = require('../models');
const moment = require('moment');
const cron = require('cron');

class EmailController {
  constructor() {
    this.emailService = new EmailService();
    this.excelService = new ExcelService();
    this.googleSheetsService = new GoogleSheetsService();
    this.scheduledJobs = new Map();
    this.initializeScheduledReports();
  }

  // Envoyer une alerte de stock
  async sendStockAlert(req, res) {
    try {
      const { barId, to, threshold = 'low' } = req.body;

      if (!barId || !to) {
        return res.status(400).json({
          success: false,
          message: 'barId et destinataire requis'
        });
      }

      // Récupérer le bar et l'entreprise
      const bar = await Bar.findByPk(barId, {
        include: [{ model: Company }]
      });

      if (!bar) {
        return res.status(404).json({
          success: false,
          message: 'Bar non trouvé'
        });
      }

      // Récupérer les stocks à alerter
      const stocks = await Stock.findAll({
        where: { barId },
        include: [{ model: Format, include: [{ model: Product }] }]
      });

      // Filtrer selon le seuil
      let productsToAlert = [];
      
      if (threshold === 'low') {
        productsToAlert = stocks.filter(stock => 
          stock.currentQuantity <= stock.minQuantity && stock.currentQuantity > 0
        );
      } else if (threshold === 'critical') {
        productsToAlert = stocks.filter(stock => 
          stock.currentQuantity === 0
        );
      } else if (threshold === 'all') {
        productsToAlert = stocks.filter(stock => 
          stock.currentQuantity <= stock.minQuantity
        );
      }

      if (productsToAlert.length === 0) {
        return res.json({
          success: true,
          message: 'Aucun produit à alerter',
          count: 0
        });
      }

      // Préparer les données des produits
      const products = productsToAlert.map(stock => ({
        name: stock.Format?.Product?.name || 'N/A',
        format: stock.Format ? `${stock.Format.size} ${stock.Format.unit}` : 'N/A',
        currentQuantity: stock.currentQuantity,
        idealQuantity: stock.maxQuantity
      }));

      // Envoyer l'email
      const result = await this.emailService.sendStockAlert({
        to,
        barName: bar.name,
        companyName: bar.Company?.name || 'N/A',
        products,
        dashboardUrl: `${req.protocol}://${req.get('host')}`
      });

      res.json({
        success: true,
        message: 'Alerte envoyée avec succès',
        messageId: result.messageId,
        count: products.length
      });

    } catch (error) {
      console.error('❌ Erreur envoi alerte:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'envoi de l\'alerte',
        error: error.message
      });
    }
  }

  // Envoyer un rapport hebdomadaire
  async sendWeeklyReport(req, res) {
    try {
      const { barId, to, includeExcel = true, includeGoogleSheets = false } = req.body;

      if (!barId || !to) {
        return res.status(400).json({
          success: false,
          message: 'barId et destinataire requis'
        });
      }

      const bar = await Bar.findByPk(barId, {
        include: [{ model: Company }]
      });

      if (!bar) {
        return res.status(404).json({
          success: false,
          message: 'Bar non trouvé'
        });
      }

      // Calculer la période (7 derniers jours)
      const endDate = moment().endOf('day').toDate();
      const startDate = moment().subtract(7, 'days').startOf('day').toDate();

      // Récupérer les statistiques
      const stocks = await Stock.findAll({
        where: { barId },
        include: [{ model: Format, include: [{ model: Product }] }]
      });

      const movements = await StockHistory.findAll({
        where: {
          createdAt: {
            [require('sequelize').Op.between]: [startDate, endDate]
          }
        },
        include: [{
          model: Stock,
          where: { barId },
          include: [{ model: Format, include: [{ model: Product }] }]
        }],
        order: [['createdAt', 'DESC']]
      });

      const stats = {
        totalProducts: stocks.length,
        lowStockCount: stocks.filter(s => s.currentQuantity <= s.minQuantity && s.currentQuantity > 0).length,
        outOfStockCount: stocks.filter(s => s.currentQuantity === 0).length
      };

      // Générer les exports si demandés
      let excelUrl = null;
      let googleSheetsUrl = null;

      if (includeExcel) {
        try {
          const excelResult = await this.excelService.exportWeeklyReport(
            barId, bar.name, bar.Company?.name || 'N/A', startDate, endDate
          );
          excelUrl = `${req.protocol}://${req.get('host')}/exports/${excelResult.filename}`;
        } catch (error) {
          console.error('❌ Erreur génération Excel:', error);
        }
      }

      if (includeGoogleSheets && this.googleSheetsService.isAvailable()) {
        try {
          const sheetsResult = await this.googleSheetsService.exportWeeklyReport(
            barId, bar.name, bar.Company?.name || 'N/A', startDate, endDate
          );
          googleSheetsUrl = sheetsResult.spreadsheetUrl;
        } catch (error) {
          console.error('❌ Erreur génération Google Sheets:', error);
        }
      }

      // Envoyer l'email
      const result = await this.emailService.sendWeeklyReport({
        to,
        barName: bar.name,
        companyName: bar.Company?.name || 'N/A',
        startDate,
        endDate,
        stats,
        movements: movements.map(m => ({
          productName: m.Stock?.Format?.Product?.name || 'N/A',
          type: m.type,
          quantity: m.quantity,
          date: m.createdAt
        })),
        excelUrl,
        googleSheetsUrl
      });

      res.json({
        success: true,
        message: 'Rapport hebdomadaire envoyé avec succès',
        messageId: result.messageId,
        exports: {
          excel: excelUrl,
          googleSheets: googleSheetsUrl
        }
      });

    } catch (error) {
      console.error('❌ Erreur envoi rapport:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'envoi du rapport',
        error: error.message
      });
    }
  }

  // Exporter vers Excel
  async exportToExcel(req, res) {
    try {
      const { barId, type = 'stocks' } = req.params;

      const bar = await Bar.findByPk(barId, {
        include: [{ model: Company }]
      });

      if (!bar) {
        return res.status(404).json({
          success: false,
          message: 'Bar non trouvé'
        });
      }

      let result;

      if (type === 'stocks') {
        result = await this.excelService.exportBarStocks(
          barId, bar.name, bar.Company?.name || 'N/A'
        );
      } else if (type === 'weekly') {
        const endDate = moment().endOf('day').toDate();
        const startDate = moment().subtract(7, 'days').startOf('day').toDate();
        
        result = await this.excelService.exportWeeklyReport(
          barId, bar.name, bar.Company?.name || 'N/A', startDate, endDate
        );
      } else {
        return res.status(400).json({
          success: false,
          message: 'Type d\'export non supporté'
        });
      }

      res.json({
        success: true,
        filename: result.filename,
        downloadUrl: `/exports/${result.filename}`,
        stats: result.stats
      });

    } catch (error) {
      console.error('❌ Erreur export Excel:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'export Excel',
        error: error.message
      });
    }
  }

  // Exporter vers Google Sheets
  async exportToGoogleSheets(req, res) {
    try {
      const { barId, type = 'stocks' } = req.params;

      if (!this.googleSheetsService.isAvailable()) {
        return res.status(503).json({
          success: false,
          message: 'Google Sheets non configuré'
        });
      }

      const bar = await Bar.findByPk(barId, {
        include: [{ model: Company }]
      });

      if (!bar) {
        return res.status(404).json({
          success: false,
          message: 'Bar non trouvé'
        });
      }

      let result;

      if (type === 'stocks') {
        result = await this.googleSheetsService.exportBarStocks(
          barId, bar.name, bar.Company?.name || 'N/A'
        );
      } else if (type === 'weekly') {
        const endDate = moment().endOf('day').toDate();
        const startDate = moment().subtract(7, 'days').startOf('day').toDate();
        
        result = await this.googleSheetsService.exportWeeklyReport(
          barId, bar.name, bar.Company?.name || 'N/A', startDate, endDate
        );
      } else {
        return res.status(400).json({
          success: false,
          message: 'Type d\'export non supporté'
        });
      }

      res.json({
        success: true,
        spreadsheetId: result.spreadsheetId,
        spreadsheetUrl: result.spreadsheetUrl,
        stats: result.stats
      });

    } catch (error) {
      console.error('❌ Erreur export Google Sheets:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'export Google Sheets',
        error: error.message
      });
    }
  }

  // Envoyer un email de test
  async sendTestEmail(req, res) {
    try {
      const { to } = req.body;

      if (!to) {
        return res.status(400).json({
          success: false,
          message: 'Destinataire requis'
        });
      }

      const result = await this.emailService.sendTestEmail(to);

      res.json({
        success: true,
        message: 'Email de test envoyé avec succès',
        messageId: result.messageId
      });

    } catch (error) {
      console.error('❌ Erreur envoi email test:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'envoi de l\'email de test',
        error: error.message
      });
    }
  }

  // Vérifier la configuration email
  async verifyEmailConfig(req, res) {
    try {
      const result = await this.emailService.verifyConfiguration();

      res.json({
        success: result.success,
        message: result.message || result.error,
        googleSheets: this.googleSheetsService.isAvailable()
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur vérification configuration',
        error: error.message
      });
    }
  }

  // Configurer les alertes automatiques
  async configureAutoAlerts(req, res) {
    try {
      const { barId, schedule, threshold, recipients, enabled } = req.body;

      if (!barId || !schedule || !recipients) {
        return res.status(400).json({
          success: false,
          message: 'Paramètres manquants'
        });
      }

      const jobKey = `alert_${barId}`;

      // Supprimer l'ancien job s'il existe
      if (this.scheduledJobs.has(jobKey)) {
        this.scheduledJobs.get(jobKey).destroy();
        this.scheduledJobs.delete(jobKey);
      }

      if (enabled) {
        // Créer un nouveau job
        const job = new cron.CronJob(schedule, async () => {
          try {
            await this.sendStockAlert({
              body: { barId, to: recipients, threshold }
            }, { json: () => {} }); // Mock response
            
            console.log(`✅ Alerte automatique envoyée pour bar ${barId}`);
          } catch (error) {
            console.error(`❌ Erreur alerte automatique bar ${barId}:`, error);
          }
        });

        job.start();
        this.scheduledJobs.set(jobKey, job);
      }

      res.json({
        success: true,
        message: enabled ? 'Alertes automatiques activées' : 'Alertes automatiques désactivées'
      });

    } catch (error) {
      console.error('❌ Erreur configuration alertes:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur configuration alertes automatiques',
        error: error.message
      });
    }
  }

  // Initialiser les rapports programmés
  initializeScheduledReports() {
    try {
      // Rapport hebdomadaire automatique tous les lundis à 9h
      const weeklyReportJob = new cron.CronJob('0 9 * * 1', async () => {
        console.log('🔄 Génération des rapports hebdomadaires automatiques...');
        
        try {
          // Récupérer tous les bars actifs
          const bars = await Bar.findAll({
            where: { isActive: true },
            include: [{ model: Company }]
          });

          for (const bar of bars) {
            // Récupérer les utilisateurs du bar qui veulent recevoir les rapports
            const users = await User.findAll({
              where: { 
                barId: bar.id,
                emailNotifications: true // Supposons qu'on ajoute ce champ
              }
            });

            if (users.length > 0) {
              const recipients = users.map(user => user.email);
              
              // Envoyer le rapport
              await this.sendWeeklyReport({
                body: {
                  barId: bar.id,
                  to: recipients,
                  includeExcel: true,
                  includeGoogleSheets: false
                }
              }, { 
                json: () => {},
                protocol: 'http',
                get: () => 'localhost:3000'
              });
            }
          }

          console.log('✅ Rapports hebdomadaires envoyés');
        } catch (error) {
          console.error('❌ Erreur rapports automatiques:', error);
        }
      });

      // weeklyReportJob.start(); // Décommenter pour activer
      console.log('📅 Rapports automatiques configurés (désactivés par défaut)');

    } catch (error) {
      console.error('❌ Erreur initialisation rapports programmés:', error);
    }
  }

  // Nettoyer les anciens exports
  async cleanOldExports(req, res) {
    try {
      const { days = 7 } = req.query;
      
      this.excelService.cleanOldExports(parseInt(days));
      
      res.json({
        success: true,
        message: `Exports de plus de ${days} jours supprimés`
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur nettoyage exports',
        error: error.message
      });
    }
  }
}

module.exports = new EmailController(); 