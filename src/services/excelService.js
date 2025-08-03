const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const moment = require('moment');

class ExcelService {
  constructor() {
    this.ensureExportsDir();
  }

  // Créer le dossier exports s'il n'existe pas
  ensureExportsDir() {
    const exportsDir = path.join(__dirname, '../../exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }
  }

  // Créer un workbook Excel avec style
  createStyledWorkbook() {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Bar Stock Manager';
    workbook.lastModifiedBy = 'Bar Stock Manager';
    workbook.created = new Date();
    workbook.modified = new Date();
    return workbook;
  }

  // Appliquer les styles aux headers
  styleHeaders(worksheet, headerRow) {
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '366092' }
      };
      cell.font = {
        color: { argb: 'FFFFFF' },
        bold: true,
        size: 12
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center'
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  }

  // Appliquer les styles aux données
  styleDataRows(worksheet, startRow, endRow) {
    for (let i = startRow; i <= endRow; i++) {
      const row = worksheet.getRow(i);
      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        
        // Couleur alternée pour les lignes
        if (i % 2 === 0) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'F8F9FA' }
          };
        }
        
        // Style pour les nombres
        if (typeof cell.value === 'number') {
          cell.alignment = { horizontal: 'right' };
        }
      });
    }
  }

  // Exporter les stocks d'un bar
  async exportBarStocks(barId, barName, companyName) {
    try {
      const { Stock, Format, Product, Bar } = require('../models');
      
      // Récupérer les stocks
      const stocks = await Stock.findAll({
        where: { barId },
        include: [
          {
            model: Format,
            include: [{ model: Product }]
          }
        ],
        order: [['updatedAt', 'DESC']]
      });

      const workbook = this.createStyledWorkbook();
      const worksheet = workbook.addWorksheet('Stocks');

      // Titre
      const titleRow = worksheet.addRow([`📊 STOCKS - ${barName.toUpperCase()}`]);
      titleRow.getCell(1).font = { size: 16, bold: true, color: { argb: '366092' } };
      worksheet.mergeCells('A1:H1');
      
      // Sous-titre
      const subtitleRow = worksheet.addRow([`🏢 ${companyName} - ${moment().format('DD/MM/YYYY HH:mm')}`]);
      subtitleRow.getCell(1).font = { size: 12, italic: true };
      worksheet.mergeCells('A2:H2');
      
      // Ligne vide
      worksheet.addRow([]);

      // Headers
      const headers = [
        'Produit',
        'Format',
        'Packaging',
        'Stock Actuel',
        'Stock Min',
        'Stock Max',
        'Statut',
        'Dernière MAJ'
      ];
      
      const headerRow = worksheet.addRow(headers);
      this.styleHeaders(worksheet, headerRow);

      // Données
      const dataStartRow = worksheet.rowCount + 1;
      stocks.forEach(stock => {
        const product = stock.Format?.Product;
        const format = stock.Format;
        
        let status = '✅ Bon';
        if (stock.currentQuantity <= stock.minQuantity) {
          status = stock.currentQuantity === 0 ? '🚫 Rupture' : '⚠️ Faible';
        }

        worksheet.addRow([
          product?.name || 'N/A',
          format ? `${format.size} ${format.unit}` : 'N/A',
          format?.packaging || 'N/A',
          stock.currentQuantity,
          stock.minQuantity,
          stock.maxQuantity,
          status,
          moment(stock.updatedAt).format('DD/MM/YYYY HH:mm')
        ]);
      });

      const dataEndRow = worksheet.rowCount;
      this.styleDataRows(worksheet, dataStartRow, dataEndRow);

      // Ajuster la largeur des colonnes
      worksheet.columns = [
        { width: 25 }, // Produit
        { width: 15 }, // Format
        { width: 12 }, // Packaging
        { width: 12 }, // Stock Actuel
        { width: 10 }, // Stock Min
        { width: 10 }, // Stock Max
        { width: 12 }, // Statut
        { width: 18 }  // Dernière MAJ
      ];

      // Statistiques
      worksheet.addRow([]);
      const statsRow = worksheet.addRow(['📈 STATISTIQUES']);
      statsRow.getCell(1).font = { bold: true, size: 14 };
      
      const totalProducts = stocks.length;
      const goodStock = stocks.filter(s => s.currentQuantity > s.minQuantity).length;
      const lowStock = stocks.filter(s => s.currentQuantity <= s.minQuantity && s.currentQuantity > 0).length;
      const outOfStock = stocks.filter(s => s.currentQuantity === 0).length;

      worksheet.addRow(['Total produits:', totalProducts]);
      worksheet.addRow(['✅ Bon stock:', goodStock]);
      worksheet.addRow(['⚠️ Stock faible:', lowStock]);
      worksheet.addRow(['🚫 Ruptures:', outOfStock]);

      // Sauvegarder le fichier
      const filename = `stocks_${barName.replace(/\s+/g, '_')}_${moment().format('YYYY-MM-DD_HH-mm')}.xlsx`;
      const filepath = path.join(__dirname, '../../exports', filename);
      
      await workbook.xlsx.writeFile(filepath);
      
      return {
        success: true,
        filename,
        filepath,
        stats: { totalProducts, goodStock, lowStock, outOfStock }
      };

    } catch (error) {
      console.error('❌ Erreur export Excel stocks:', error);
      throw error;
    }
  }

  // Exporter un rapport hebdomadaire
  async exportWeeklyReport(barId, barName, companyName, startDate, endDate) {
    try {
      const { Stock, Format, Product, StockHistory } = require('../models');
      
      const workbook = this.createStyledWorkbook();
      
      // === FEUILLE STOCKS ===
      const stocksSheet = workbook.addWorksheet('Stocks Actuels');
      await this.addStocksSheet(stocksSheet, barId, barName, companyName);
      
      // === FEUILLE MOUVEMENTS ===
      const movementsSheet = workbook.addWorksheet('Mouvements');
      await this.addMovementsSheet(movementsSheet, barId, barName, startDate, endDate);
      
      // === FEUILLE STATISTIQUES ===
      const statsSheet = workbook.addWorksheet('Statistiques');
      await this.addStatsSheet(statsSheet, barId, barName, startDate, endDate);

      // Sauvegarder
      const filename = `rapport_hebdomadaire_${barName.replace(/\s+/g, '_')}_${moment().format('YYYY-MM-DD')}.xlsx`;
      const filepath = path.join(__dirname, '../../exports', filename);
      
      await workbook.xlsx.writeFile(filepath);
      
      return {
        success: true,
        filename,
        filepath,
        url: `/exports/${filename}`
      };

    } catch (error) {
      console.error('❌ Erreur export rapport hebdomadaire:', error);
      throw error;
    }
  }

  // Ajouter la feuille des stocks
  async addStocksSheet(worksheet, barId, barName, companyName) {
    const { Stock, Format, Product } = require('../models');
    
    const stocks = await Stock.findAll({
      where: { barId },
      include: [{ model: Format, include: [{ model: Product }] }]
    });

    // Titre
    worksheet.addRow([`📊 STOCKS ACTUELS - ${barName.toUpperCase()}`]);
    worksheet.addRow([`🏢 ${companyName} - ${moment().format('DD/MM/YYYY')}`]);
    worksheet.addRow([]);

    // Headers et données comme dans exportBarStocks
    const headers = ['Produit', 'Format', 'Stock Actuel', 'Stock Min', 'Stock Max', 'Statut'];
    const headerRow = worksheet.addRow(headers);
    this.styleHeaders(worksheet, headerRow);

    stocks.forEach(stock => {
      const product = stock.Format?.Product;
      const format = stock.Format;
      
      let status = '✅ Bon';
      if (stock.currentQuantity <= stock.minQuantity) {
        status = stock.currentQuantity === 0 ? '🚫 Rupture' : '⚠️ Faible';
      }

      worksheet.addRow([
        product?.name || 'N/A',
        format ? `${format.size} ${format.unit}` : 'N/A',
        stock.currentQuantity,
        stock.minQuantity,
        stock.maxQuantity,
        status
      ]);
    });

    worksheet.columns = [
      { width: 25 }, { width: 15 }, { width: 12 }, 
      { width: 10 }, { width: 10 }, { width: 12 }
    ];
  }

  // Ajouter la feuille des mouvements
  async addMovementsSheet(worksheet, barId, barName, startDate, endDate) {
    const { StockHistory, Stock, Format, Product } = require('../models');
    
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

    // Titre
    worksheet.addRow([`📈 MOUVEMENTS - ${barName.toUpperCase()}`]);
    worksheet.addRow([`📅 Période: ${moment(startDate).format('DD/MM/YYYY')} - ${moment(endDate).format('DD/MM/YYYY')}`]);
    worksheet.addRow([]);

    // Headers
    const headers = ['Date', 'Produit', 'Format', 'Type', 'Quantité', 'Stock Avant', 'Stock Après', 'Motif'];
    const headerRow = worksheet.addRow(headers);
    this.styleHeaders(worksheet, headerRow);

    movements.forEach(movement => {
      const product = movement.Stock?.Format?.Product;
      const format = movement.Stock?.Format;

      worksheet.addRow([
        moment(movement.createdAt).format('DD/MM/YYYY HH:mm'),
        product?.name || 'N/A',
        format ? `${format.size} ${format.unit}` : 'N/A',
        movement.type,
        movement.quantity,
        movement.previousQuantity,
        movement.newQuantity,
        movement.reason || 'N/A'
      ]);
    });

    worksheet.columns = [
      { width: 18 }, { width: 25 }, { width: 15 }, { width: 12 },
      { width: 10 }, { width: 12 }, { width: 12 }, { width: 20 }
    ];
  }

  // Ajouter la feuille des statistiques
  async addStatsSheet(worksheet, barId, barName, startDate, endDate) {
    // Titre
    worksheet.addRow([`📊 STATISTIQUES - ${barName.toUpperCase()}`]);
    worksheet.addRow([`📅 Période: ${moment(startDate).format('DD/MM/YYYY')} - ${moment(endDate).format('DD/MM/YYYY')}`]);
    worksheet.addRow([]);

    // Calculs statistiques (simplifié pour l'exemple)
    worksheet.addRow(['📈 RÉSUMÉ DE LA PÉRIODE']);
    worksheet.addRow(['Total mouvements:', '...'  ]); // À implémenter avec vraies données
    worksheet.addRow(['Produits les plus utilisés:', '...']);
    worksheet.addRow(['Alertes générées:', '...']);
    
    worksheet.columns = [{ width: 30 }, { width: 20 }];
  }

  // Nettoyer les anciens fichiers d'export
  cleanOldExports(daysOld = 7) {
    try {
      const exportsDir = path.join(__dirname, '../../exports');
      const files = fs.readdirSync(exportsDir);
      const cutoffDate = moment().subtract(daysOld, 'days');

      files.forEach(file => {
        const filePath = path.join(exportsDir, file);
        const stats = fs.statSync(filePath);
        
        if (moment(stats.mtime).isBefore(cutoffDate)) {
          fs.unlinkSync(filePath);
          console.log(`🗑️ Fichier supprimé: ${file}`);
        }
      });

      console.log(`✅ Nettoyage des exports terminé (> ${daysOld} jours)`);
    } catch (error) {
      console.error('❌ Erreur nettoyage exports:', error);
    }
  }
}

module.exports = ExcelService; 