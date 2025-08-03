#!/usr/bin/env node

/**
 * Script de test des fonctionnalités email
 * Teste les exports Excel et la génération de templates sans envoyer d'emails
 */

const path = require('path');
const fs = require('fs');

// Import des services
const ExcelService = require('../src/services/excelService');
const { emailTemplates } = require('../src/config/email');

class EmailFeatureTester {
  constructor() {
    this.excelService = new ExcelService();
    this.results = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${icon} ${message}`);
    this.results.push({ timestamp, type, message });
  }

  // Test de génération d'export Excel
  async testExcelExport() {
    this.log('Test de génération Excel...', 'info');
    
    try {
      // Données de test
      const testData = {
        barId: 1,
        barName: 'Bar Test',
        companyName: 'Test Company',
        stocks: [
          {
            Format: {
              Product: { name: 'Coca Cola' },
              size: 33,
              unit: 'cl'
            },
            currentQuantity: 5,
            minQuantity: 10,
            maxQuantity: 50
          },
          {
            Format: {
              Product: { name: 'Heineken' },
              size: 25,
              unit: 'cl'
            },
            currentQuantity: 0,
            minQuantity: 20,
            maxQuantity: 100
          }
        ]
      };

      // Test export stocks
      const result = await this.excelService.exportBarStocks(
        testData.barId,
        testData.barName,
        testData.companyName,
        testData.stocks
      );

      if (fs.existsSync(result.filepath)) {
        this.log(`Excel généré: ${result.filename}`, 'success');
        this.log(`Taille: ${fs.statSync(result.filepath).size} bytes`, 'info');
        
        // Vérifier le contenu
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(result.filepath);
        
        this.log(`Feuilles: ${workbook.worksheets.length}`, 'info');
        workbook.worksheets.forEach(sheet => {
          this.log(`  - ${sheet.name}: ${sheet.rowCount} lignes`, 'info');
        });
        
        return true;
      } else {
        this.log('Fichier Excel non créé', 'error');
        return false;
      }
      
    } catch (error) {
      this.log(`Erreur Excel: ${error.message}`, 'error');
      return false;
    }
  }

  // Test de génération de templates email
  testEmailTemplates() {
    this.log('Test des templates email...', 'info');
    
    try {
      // Données de test pour alerte
      const alertData = {
        barName: 'Le Petit Bar',
        companyName: 'Ma Société',
        date: '01/07/2025',
        time: '08:00',
        productsList: '<div>Test produit</div>',
        productsListText: 'Test produit',
        dashboardUrl: 'http://localhost:3000',
        timestamp: '01/07/2025 08:00:00'
      };

      // Test template alerte
      const alertTemplate = emailTemplates.stockAlert;
      let alertHtml = alertTemplate.html;
      let alertSubject = alertTemplate.subject;

      for (const [key, value] of Object.entries(alertData)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        alertHtml = alertHtml.replace(regex, value);
        alertSubject = alertSubject.replace(regex, value);
      }

      if (alertHtml.includes('Le Petit Bar') && !alertHtml.includes('{{')) {
        this.log('Template alerte: OK', 'success');
      } else {
        this.log('Template alerte: Variables non remplacées', 'warning');
      }

      // Test template rapport
      const reportData = {
        barName: 'Le Grand Bar',
        startDate: '24/06/2025',
        endDate: '01/07/2025',
        totalProducts: '25',
        lowStockCount: '3',
        outOfStockCount: '1'
      };

      const reportTemplate = emailTemplates.weeklyReport;
      let reportHtml = reportTemplate.html;

      for (const [key, value] of Object.entries(reportData)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        reportHtml = reportHtml.replace(regex, value);
      }

      if (reportHtml.includes('Le Grand Bar') && reportHtml.includes('25')) {
        this.log('Template rapport: OK', 'success');
      } else {
        this.log('Template rapport: Problème de variables', 'warning');
      }

      return true;
      
    } catch (error) {
      this.log(`Erreur templates: ${error.message}`, 'error');
      return false;
    }
  }

  // Test de nettoyage des exports
  async testCleanupExports() {
    this.log('Test de nettoyage des exports...', 'info');
    
    try {
      const exportDir = path.join(process.cwd(), 'exports');
      
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
        this.log('Dossier exports créé', 'info');
      }

      // Compter les fichiers avant
      const filesBefore = fs.readdirSync(exportDir).length;
      
      // Exécuter le nettoyage (7 jours par défaut)
      this.excelService.cleanOldExports(7);
      
      // Compter les fichiers après
      const filesAfter = fs.readdirSync(exportDir).length;
      
      this.log(`Nettoyage: ${filesBefore} → ${filesAfter} fichiers`, 'info');
      
      return true;
      
    } catch (error) {
      this.log(`Erreur nettoyage: ${error.message}`, 'error');
      return false;
    }
  }

  // Test de génération de rapport hebdomadaire
  async testWeeklyReport() {
    this.log('Test de rapport hebdomadaire...', 'info');
    
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date();

      const result = await this.excelService.exportWeeklyReport(
        1, // barId
        'Bar Test Hebdo',
        'Test Company',
        startDate,
        endDate
      );

      if (fs.existsSync(result.filepath)) {
        this.log(`Rapport hebdomadaire généré: ${result.filename}`, 'success');
        
        // Vérifier les feuilles
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(result.filepath);
        
        const expectedSheets = ['Stocks Actuels', 'Mouvements', 'Statistiques'];
        const actualSheets = workbook.worksheets.map(s => s.name);
        
        for (const expectedSheet of expectedSheets) {
          if (actualSheets.includes(expectedSheet)) {
            this.log(`  ✓ Feuille "${expectedSheet}" présente`, 'success');
          } else {
            this.log(`  ✗ Feuille "${expectedSheet}" manquante`, 'warning');
          }
        }
        
        return true;
      } else {
        this.log('Rapport hebdomadaire non créé', 'error');
        return false;
      }
      
    } catch (error) {
      this.log(`Erreur rapport hebdomadaire: ${error.message}`, 'error');
      return false;
    }
  }

  // Générer le rapport de test
  generateReport() {
    console.log('\n' + '='.repeat(50));
    console.log('📧 RAPPORT DE TEST - FONCTIONNALITÉS EMAIL');
    console.log('='.repeat(50));
    
    const successCount = this.results.filter(r => r.type === 'success').length;
    const errorCount = this.results.filter(r => r.type === 'error').length;
    const warningCount = this.results.filter(r => r.type === 'warning').length;
    
    console.log(`✅ Succès: ${successCount}`);
    console.log(`⚠️ Avertissements: ${warningCount}`);
    console.log(`❌ Erreurs: ${errorCount}`);
    
    const globalStatus = errorCount === 0 ? 
      (warningCount === 0 ? 'PARFAIT' : 'BON') : 'PROBLÈMES';
    
    console.log(`\n🎯 État global: ${globalStatus}`);
    
    if (errorCount === 0) {
      console.log('\n💡 Les fonctionnalités email sont prêtes !');
      console.log('   📧 Configurez SMTP pour envoyer des emails');
      console.log('   📋 Ajoutez Google credentials pour Google Sheets');
    }
    
    console.log('='.repeat(50));
  }

  // Exécuter tous les tests
  async runAllTests() {
    console.log('🚀 Test des fonctionnalités email...\n');
    
    await this.testExcelExport();
    this.testEmailTemplates();
    await this.testCleanupExports();
    await this.testWeeklyReport();
    
    this.generateReport();
  }
}

// Exécution
if (require.main === module) {
  const tester = new EmailFeatureTester();
  tester.runAllTests().catch(console.error);
}

module.exports = EmailFeatureTester; 