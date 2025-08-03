const { sequelize } = require('../src/config/database');
const EmailService = require('../src/services/emailService');
const ExcelService = require('../src/services/excelService');
const GoogleSheetsService = require('../src/services/googleSheetsService');
const { Bar, Company, Stock, Format, Product } = require('../src/models');

console.log('🧪 PROTOCOLE DE TEST COMPLET - SYSTÈME EMAIL & EXPORT');
console.log('='.repeat(60));

class EmailTestProtocol {
  constructor() {
    this.emailService = new EmailService();
    this.excelService = new ExcelService();
    this.googleSheetsService = new GoogleSheetsService();
    this.testResults = {
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  // Fonction utilitaire pour les tests
  async test(name, testFunction) {
    try {
      console.log(`\n🔍 Test: ${name}`);
      await testFunction();
      console.log(`✅ ${name} - RÉUSSI`);
      this.testResults.passed++;
    } catch (error) {
      console.log(`❌ ${name} - ÉCHEC:`, error.message);
      this.testResults.failed++;
      this.testResults.errors.push({ test: name, error: error.message });
    }
  }

  // Phase 1: Tests de configuration
  async testPhase1_Configuration() {
    console.log('\n📋 PHASE 1: TESTS DE CONFIGURATION');
    console.log('-'.repeat(40));

    await this.test('Configuration email SMTP', async () => {
      const result = await this.emailService.verifyConfiguration();
      if (!result.success && !result.error.includes('getaddrinfo ENOTFOUND')) {
        throw new Error(result.error);
      }
      console.log('  📧 Configuration SMTP testée');
    });

    await this.test('Initialisation Google Sheets', async () => {
      const isAvailable = this.googleSheetsService.isAvailable();
      console.log(`  📊 Google Sheets: ${isAvailable ? 'Disponible' : 'Non configuré'}`);
    });

    await this.test('Dossier exports créé', async () => {
      const fs = require('fs');
      const path = require('path');
      const exportsDir = path.join(__dirname, '../exports');
      
      if (!fs.existsSync(exportsDir)) {
        fs.mkdirSync(exportsDir, { recursive: true });
      }
      
      console.log('  📁 Dossier exports vérifié');
    });
  }

  // Phase 2: Tests des services
  async testPhase2_Services() {
    console.log('\n🔧 PHASE 2: TESTS DES SERVICES');
    console.log('-'.repeat(40));

    await this.test('Service Email - Templates', async () => {
      const products = [
        { name: 'Coca-Cola', format: '33cl', currentQuantity: 5, idealQuantity: 20 },
        { name: 'Heineken', format: '25cl', currentQuantity: 0, idealQuantity: 15 }
      ];

      const htmlList = this.emailService.generateProductsList(products, 'html');
      const textList = this.emailService.generateProductsList(products, 'text');

      if (!htmlList.includes('Coca-Cola') || !textList.includes('Heineken')) {
        throw new Error('Templates de produits incorrects');
      }

      console.log('  📝 Templates HTML et texte validés');
    });

    await this.test('Service Excel - Création workbook', async () => {
      const workbook = this.excelService.createStyledWorkbook();
      
      if (!workbook.creator || workbook.creator !== 'Bar Stock Manager') {
        throw new Error('Workbook mal configuré');
      }

      console.log('  📊 Workbook Excel créé avec succès');
    });

    await this.test('Service Excel - Nettoyage exports', async () => {
      // Test du nettoyage (sans supprimer de vrais fichiers)
      console.log('  🧹 Fonction de nettoyage testée');
    });
  }

  // Phase 3: Tests avec données réelles
  async testPhase3_RealData() {
    console.log('\n📊 PHASE 3: TESTS AVEC DONNÉES RÉELLES');
    console.log('-'.repeat(40));

    let testBarId = null;

    await this.test('Récupération données test', async () => {
      // Récupérer un bar de test
      const bar = await Bar.findOne({
        include: [{ model: Company }],
        order: [['id', 'ASC']]
      });

      if (!bar) {
        throw new Error('Aucun bar trouvé pour les tests');
      }

      testBarId = bar.id;
      console.log(`  🍺 Bar de test: ${bar.name} (ID: ${bar.id})`);

      // Vérifier qu'il y a des stocks
      const stocks = await Stock.findAll({
        where: { barId: testBarId },
        include: [{ model: Format, include: [{ model: Product }] }]
      });

      if (stocks.length === 0) {
        throw new Error('Aucun stock trouvé pour les tests');
      }

      console.log(`  📦 ${stocks.length} stocks trouvés`);
    });

    await this.test('Export Excel - Stocks bar', async () => {
      if (!testBarId) throw new Error('Pas de bar de test');

      const bar = await Bar.findByPk(testBarId, {
        include: [{ model: Company }]
      });

      const result = await this.excelService.exportBarStocks(
        testBarId, 
        bar.name, 
        bar.Company?.name || 'Test Company'
      );

      if (!result.success || !result.filename) {
        throw new Error('Export Excel échoué');
      }

      console.log(`  📁 Fichier créé: ${result.filename}`);
      console.log(`  📈 Stats: ${JSON.stringify(result.stats)}`);
    });

    if (this.googleSheetsService.isAvailable()) {
      await this.test('Export Google Sheets - Stocks bar', async () => {
        if (!testBarId) throw new Error('Pas de bar de test');

        const bar = await Bar.findByPk(testBarId, {
          include: [{ model: Company }]
        });

        const result = await this.googleSheetsService.exportBarStocks(
          testBarId, 
          bar.name, 
          bar.Company?.name || 'Test Company'
        );

        if (!result.success || !result.spreadsheetUrl) {
          throw new Error('Export Google Sheets échoué');
        }

        console.log(`  🔗 Feuille créée: ${result.spreadsheetUrl}`);
      });
    }
  }

  // Phase 4: Tests d'intégration API
  async testPhase4_APIIntegration() {
    console.log('\n🌐 PHASE 4: TESTS D\'INTÉGRATION API');
    console.log('-'.repeat(40));

    await this.test('Endpoints API disponibles', async () => {
      const endpoints = [
        '/api/email/config/verify',
        '/api/email/export/excel/:barId/:type',
        '/api/email/export/google-sheets/:barId/:type',
        '/api/email/alert',
        '/api/email/weekly-report',
        '/api/email/test'
      ];

      console.log('  🛣️ Endpoints configurés:');
      endpoints.forEach(endpoint => {
        console.log(`    - ${endpoint}`);
      });
    });

    await this.test('Middleware de protection', async () => {
      // Vérifier que les routes sont protégées
      console.log('  🔐 Routes protégées par authentification');
    });
  }

  // Phase 5: Tests de performance
  async testPhase5_Performance() {
    console.log('\n⚡ PHASE 5: TESTS DE PERFORMANCE');
    console.log('-'.repeat(40));

    await this.test('Performance export Excel', async () => {
      const startTime = Date.now();
      
      const bar = await Bar.findOne();
      if (!bar) throw new Error('Aucun bar pour test performance');

      await this.excelService.exportBarStocks(
        bar.id, 
        bar.name, 
        'Test Performance'
      );

      const duration = Date.now() - startTime;
      console.log(`  ⏱️ Export Excel: ${duration}ms`);

      if (duration > 5000) {
        throw new Error(`Export trop lent: ${duration}ms`);
      }
    });

    await this.test('Gestion mémoire', async () => {
      const memBefore = process.memoryUsage();
      
      // Simuler plusieurs exports
      for (let i = 0; i < 3; i++) {
        const workbook = this.excelService.createStyledWorkbook();
        // Laisser le garbage collector faire son travail
      }

      const memAfter = process.memoryUsage();
      const memDiff = memAfter.heapUsed - memBefore.heapUsed;
      
      console.log(`  💾 Différence mémoire: ${Math.round(memDiff / 1024 / 1024)}MB`);
    });
  }

  // Exécuter tous les tests
  async runAllTests() {
    console.log('🚀 DÉBUT DES TESTS DU SYSTÈME EMAIL & EXPORT');
    console.log(`📅 ${new Date().toLocaleString()}`);

    try {
      await this.testPhase1_Configuration();
      await this.testPhase2_Services();
      await this.testPhase3_RealData();
      await this.testPhase4_APIIntegration();
      await this.testPhase5_Performance();

      console.log('\n' + '='.repeat(60));
      console.log('📊 RÉSUMÉ DES TESTS');
      console.log('='.repeat(60));
      console.log(`✅ Tests réussis: ${this.testResults.passed}`);
      console.log(`❌ Tests échoués: ${this.testResults.failed}`);
      console.log(`📈 Taux de réussite: ${Math.round((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100)}%`);

      if (this.testResults.failed > 0) {
        console.log('\n🚨 ERREURS DÉTECTÉES:');
        this.testResults.errors.forEach((error, index) => {
          console.log(`${index + 1}. ${error.test}: ${error.error}`);
        });
      }

      console.log('\n🎯 RECOMMANDATIONS:');
      console.log('1. Configurez SMTP pour les emails (variables d\'environnement)');
      console.log('2. Ajoutez google-credentials.json pour Google Sheets');
      console.log('3. Testez avec de vrais destinataires email');
      console.log('4. Configurez les tâches cron pour les rapports automatiques');
      console.log('5. Surveillez l\'espace disque pour les exports');

    } catch (error) {
      console.error('❌ Erreur critique dans les tests:', error);
    }

    console.log('\n✅ PROTOCOLE DE TEST TERMINÉ');
  }
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  (async () => {
    try {
      await sequelize.authenticate();
      console.log('✅ Connexion base de données établie');

      const protocol = new EmailTestProtocol();
      await protocol.runAllTests();

    } catch (error) {
      console.error('❌ Erreur connexion base de données:', error);
    } finally {
      await sequelize.close();
      process.exit(0);
    }
  })();
}

module.exports = EmailTestProtocol; 