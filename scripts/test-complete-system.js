#!/usr/bin/env node

/**
 * Script de test complet du système Bar Stock Manager
 * Teste tous les composants principaux et génère un rapport
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

class SystemTester {
  constructor() {
    this.results = {
      server: { status: 'pending', details: [] },
      database: { status: 'pending', details: [] },
      services: { status: 'pending', details: [] },
      dependencies: { status: 'pending', details: [] },
      configuration: { status: 'pending', details: [] }
    };
    this.startTime = Date.now();
  }

  // Tester la connectivité du serveur
  async testServer() {
    console.log('🔍 Test du serveur...');
    
    try {
      const response = await this.makeRequest('GET', '/api');
      
      if (response.statusCode === 200) {
        this.results.server.status = 'success';
        this.results.server.details.push('✅ Serveur accessible sur port 3000');
        this.results.server.details.push('✅ API répond correctement');
      } else {
        throw new Error(`Statut HTTP: ${response.statusCode}`);
      }
    } catch (error) {
      this.results.server.status = 'error';
      this.results.server.details.push(`❌ Erreur serveur: ${error.message}`);
    }
  }

  // Tester la base de données
  async testDatabase() {
    console.log('🔍 Test de la base de données...');
    
    try {
      const { sequelize } = require('../src/config/database');
      
      // Test de connexion
      await sequelize.authenticate();
      this.results.database.details.push('✅ Connexion base de données OK');
      
      // Test des modèles
      const models = ['Bar', 'Product', 'Stock', 'Company', 'User'];
      for (const modelName of models) {
        try {
          const Model = require('../src/models')[modelName];
          const count = await Model.count();
          this.results.database.details.push(`✅ Modèle ${modelName}: ${count} enregistrements`);
        } catch (error) {
          this.results.database.details.push(`⚠️ Modèle ${modelName}: ${error.message}`);
        }
      }
      
      this.results.database.status = 'success';
      
    } catch (error) {
      this.results.database.status = 'error';
      this.results.database.details.push(`❌ Erreur base de données: ${error.message}`);
    }
  }

  // Tester les services
  async testServices() {
    console.log('🔍 Test des services...');
    
    try {
      // Test EmailService
      try {
        const EmailService = require('../src/services/emailService');
        this.results.services.details.push('✅ EmailService chargé');
        
        // Test de la configuration
        const emailService = new EmailService();
        if (emailService.isConfigured) {
          this.results.services.details.push('✅ EmailService configuré');
        } else {
          this.results.services.details.push('⚠️ EmailService non configuré (normal sans SMTP)');
        }
      } catch (error) {
        this.results.services.details.push(`❌ EmailService: ${error.message}`);
      }

      // Test ExcelService
      try {
        const ExcelService = require('../src/services/excelService');
        const excelService = new ExcelService();
        this.results.services.details.push('✅ ExcelService chargé');
      } catch (error) {
        this.results.services.details.push(`❌ ExcelService: ${error.message}`);
      }

      // Test GoogleSheetsService
      try {
        const GoogleSheetsService = require('../src/services/googleSheetsService');
        const googleService = new GoogleSheetsService();
        if (googleService.isAvailable()) {
          this.results.services.details.push('✅ GoogleSheetsService disponible');
        } else {
          this.results.services.details.push('⚠️ GoogleSheetsService non configuré (normal sans credentials)');
        }
      } catch (error) {
        this.results.services.details.push(`❌ GoogleSheetsService: ${error.message}`);
      }

      this.results.services.status = 'success';
      
    } catch (error) {
      this.results.services.status = 'error';
      this.results.services.details.push(`❌ Erreur services: ${error.message}`);
    }
  }

  // Tester les dépendances
  async testDependencies() {
    console.log('🔍 Test des dépendances...');
    
    try {
      const packageJson = require('../package.json');
      const dependencies = packageJson.dependencies;
      
      let successCount = 0;
      let totalCount = 0;
      
      for (const [name, version] of Object.entries(dependencies)) {
        totalCount++;
        try {
          require(name);
          successCount++;
        } catch (error) {
          this.results.dependencies.details.push(`❌ ${name}: ${error.message}`);
        }
      }
      
      this.results.dependencies.details.push(`✅ ${successCount}/${totalCount} dépendances chargées`);
      
      if (successCount === totalCount) {
        this.results.dependencies.status = 'success';
      } else {
        this.results.dependencies.status = 'warning';
      }
      
    } catch (error) {
      this.results.dependencies.status = 'error';
      this.results.dependencies.details.push(`❌ Erreur dépendances: ${error.message}`);
    }
  }

  // Tester la configuration
  async testConfiguration() {
    console.log('🔍 Test de la configuration...');
    
    try {
      // Vérifier les fichiers de configuration
      const configFiles = [
        'src/config/database.js',
        'src/config/email.js',
        'database.db'
      ];
      
      for (const file of configFiles) {
        if (fs.existsSync(file)) {
          this.results.configuration.details.push(`✅ ${file} présent`);
        } else {
          this.results.configuration.details.push(`⚠️ ${file} manquant`);
        }
      }
      
      // Vérifier les dossiers nécessaires
      const folders = ['public', 'src', 'scripts'];
      for (const folder of folders) {
        if (fs.existsSync(folder)) {
          this.results.configuration.details.push(`✅ Dossier ${folder} présent`);
        } else {
          this.results.configuration.details.push(`❌ Dossier ${folder} manquant`);
        }
      }
      
      // Créer le dossier exports s'il n'existe pas
      if (!fs.existsSync('exports')) {
        fs.mkdirSync('exports', { recursive: true });
        this.results.configuration.details.push('✅ Dossier exports créé');
      } else {
        this.results.configuration.details.push('✅ Dossier exports présent');
      }
      
      this.results.configuration.status = 'success';
      
    } catch (error) {
      this.results.configuration.status = 'error';
      this.results.configuration.details.push(`❌ Erreur configuration: ${error.message}`);
    }
  }

  // Faire une requête HTTP
  makeRequest(method, path) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: path,
        method: method,
        timeout: 5000
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        });
      });

      req.on('error', reject);
      req.on('timeout', () => reject(new Error('Timeout')));
      req.setTimeout(5000);
      req.end();
    });
  }

  // Générer le rapport
  generateReport() {
    const duration = Date.now() - this.startTime;
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 RAPPORT DE TEST SYSTÈME - BAR STOCK MANAGER');
    console.log('='.repeat(60));
    console.log(`⏱️ Durée du test: ${duration}ms`);
    console.log(`📅 Date: ${new Date().toLocaleString()}`);
    console.log();

    for (const [category, result] of Object.entries(this.results)) {
      const statusIcon = result.status === 'success' ? '✅' : 
                        result.status === 'warning' ? '⚠️' : '❌';
      
      console.log(`${statusIcon} ${category.toUpperCase()}: ${result.status.toUpperCase()}`);
      
      for (const detail of result.details) {
        console.log(`   ${detail}`);
      }
      console.log();
    }

    // Résumé global
    const categories = Object.values(this.results);
    const successCount = categories.filter(c => c.status === 'success').length;
    const warningCount = categories.filter(c => c.status === 'warning').length;
    const errorCount = categories.filter(c => c.status === 'error').length;
    
    console.log('📊 RÉSUMÉ GLOBAL:');
    console.log(`   ✅ Réussis: ${successCount}`);
    console.log(`   ⚠️ Avertissements: ${warningCount}`);
    console.log(`   ❌ Erreurs: ${errorCount}`);
    
    const globalStatus = errorCount === 0 ? 
      (warningCount === 0 ? 'EXCELLENT' : 'BON') : 'PROBLÈMES DÉTECTÉS';
    
    console.log(`   🎯 État global: ${globalStatus}`);
    console.log('='.repeat(60));

    // Recommandations
    if (errorCount > 0 || warningCount > 0) {
      console.log('\n💡 RECOMMANDATIONS:');
      
      if (!this.results.services.details.some(d => d.includes('EmailService configuré'))) {
        console.log('   📧 Configurez les paramètres SMTP pour activer les emails');
      }
      
      if (!this.results.services.details.some(d => d.includes('GoogleSheetsService disponible'))) {
        console.log('   📋 Ajoutez les credentials Google pour activer Google Sheets');
      }
      
      console.log('   📖 Consultez config/email-setup.md pour la configuration');
    }
  }

  // Exécuter tous les tests
  async runAllTests() {
    console.log('🚀 Démarrage des tests système...\n');
    
    await this.testServer();
    await this.testDatabase();
    await this.testServices();
    await this.testDependencies();
    await this.testConfiguration();
    
    this.generateReport();
  }
}

// Exécution du script
if (require.main === module) {
  const tester = new SystemTester();
  tester.runAllTests().catch(console.error);
}

module.exports = SystemTester; 