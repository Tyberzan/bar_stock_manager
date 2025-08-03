const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const moment = require('moment');

class GoogleSheetsService {
  constructor() {
    this.auth = null;
    this.sheets = null;
    this.initializeAuth();
  }

  // Initialiser l'authentification Google
  async initializeAuth() {
    try {
      // Chemin vers le fichier de credentials (à créer)
      const credentialsPath = path.join(__dirname, '../../config/google-credentials.json');
      
      if (!fs.existsSync(credentialsPath)) {
        console.log('⚠️ Fichier Google credentials non trouvé. Fonctionnalité Google Sheets désactivée.');
        console.log('📝 Créez le fichier:', credentialsPath);
        return;
      }

      const credentials = JSON.parse(fs.readFileSync(credentialsPath));
      
      this.auth = new google.auth.GoogleAuth({
        credentials,
        scopes: [
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/drive.file'
        ]
      });

      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      this.drive = google.drive({ version: 'v3', auth: this.auth });
      
      console.log('✅ Google Sheets API initialisée');
    } catch (error) {
      console.error('❌ Erreur initialisation Google Sheets:', error.message);
    }
  }

  // Vérifier si Google Sheets est disponible
  isAvailable() {
    return this.sheets !== null && this.auth !== null;
  }

  // Créer une nouvelle feuille de calcul
  async createSpreadsheet(title) {
    try {
      if (!this.isAvailable()) {
        throw new Error('Google Sheets non disponible');
      }

      const response = await this.sheets.spreadsheets.create({
        resource: {
          properties: {
            title
          }
        }
      });

      const spreadsheetId = response.data.spreadsheetId;
      const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

      console.log('✅ Feuille Google Sheets créée:', spreadsheetUrl);
      return { spreadsheetId, spreadsheetUrl };

    } catch (error) {
      console.error('❌ Erreur création Google Sheets:', error);
      throw error;
    }
  }

  // Ajouter des données à une feuille
  async addDataToSheet(spreadsheetId, sheetName, data) {
    try {
      if (!this.isAvailable()) {
        throw new Error('Google Sheets non disponible');
      }

      // Créer la feuille si elle n'existe pas
      await this.createSheet(spreadsheetId, sheetName);

      // Ajouter les données
      const range = `${sheetName}!A1`;
      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'RAW',
        resource: {
          values: data
        }
      });

      console.log(`✅ Données ajoutées à la feuille ${sheetName}`);
      return true;

    } catch (error) {
      console.error('❌ Erreur ajout données Google Sheets:', error);
      throw error;
    }
  }

  // Créer une feuille dans un spreadsheet
  async createSheet(spreadsheetId, sheetName) {
    try {
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: {
          requests: [{
            addSheet: {
              properties: {
                title: sheetName
              }
            }
          }]
        }
      });
    } catch (error) {
      // Ignorer si la feuille existe déjà
      if (!error.message.includes('already exists')) {
        throw error;
      }
    }
  }

  // Formater les headers
  async formatHeaders(spreadsheetId, sheetName, headerCount) {
    try {
      if (!this.isAvailable()) return;

      const sheetId = await this.getSheetId(spreadsheetId, sheetName);
      
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: {
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId,
                  startRowIndex: 0,
                  endRowIndex: 1,
                  startColumnIndex: 0,
                  endColumnIndex: headerCount
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.2, green: 0.38, blue: 0.57 },
                    textFormat: {
                      foregroundColor: { red: 1, green: 1, blue: 1 },
                      bold: true
                    }
                  }
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat)'
              }
            }
          ]
        }
      });

    } catch (error) {
      console.error('❌ Erreur formatage headers:', error);
    }
  }

  // Obtenir l'ID d'une feuille
  async getSheetId(spreadsheetId, sheetName) {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId
      });

      const sheet = response.data.sheets.find(s => s.properties.title === sheetName);
      return sheet ? sheet.properties.sheetId : 0;

    } catch (error) {
      console.error('❌ Erreur récupération sheet ID:', error);
      return 0;
    }
  }

  // Exporter les stocks vers Google Sheets
  async exportBarStocks(barId, barName, companyName) {
    try {
      if (!this.isAvailable()) {
        throw new Error('Google Sheets non disponible');
      }

      const { Stock, Format, Product } = require('../models');
      
      // Récupérer les stocks
      const stocks = await Stock.findAll({
        where: { barId },
        include: [{ model: Format, include: [{ model: Product }] }],
        order: [['updatedAt', 'DESC']]
      });

      // Créer la feuille de calcul
      const title = `Stocks ${barName} - ${moment().format('DD/MM/YYYY')}`;
      const { spreadsheetId, spreadsheetUrl } = await this.createSpreadsheet(title);

      // Préparer les données
      const data = [
        // Titre
        [`📊 STOCKS - ${barName.toUpperCase()}`],
        [`🏢 ${companyName} - ${moment().format('DD/MM/YYYY HH:mm')}`],
        [], // Ligne vide
        // Headers
        ['Produit', 'Format', 'Packaging', 'Stock Actuel', 'Stock Min', 'Stock Max', 'Statut', 'Dernière MAJ']
      ];

      // Ajouter les données des stocks
      stocks.forEach(stock => {
        const product = stock.Format?.Product;
        const format = stock.Format;
        
        let status = '✅ Bon';
        if (stock.currentQuantity <= stock.minQuantity) {
          status = stock.currentQuantity === 0 ? '🚫 Rupture' : '⚠️ Faible';
        }

        data.push([
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

      // Ajouter les statistiques
      const totalProducts = stocks.length;
      const goodStock = stocks.filter(s => s.currentQuantity > s.minQuantity).length;
      const lowStock = stocks.filter(s => s.currentQuantity <= s.minQuantity && s.currentQuantity > 0).length;
      const outOfStock = stocks.filter(s => s.currentQuantity === 0).length;

      data.push(
        [], // Ligne vide
        ['📈 STATISTIQUES'],
        ['Total produits:', totalProducts],
        ['✅ Bon stock:', goodStock],
        ['⚠️ Stock faible:', lowStock],
        ['🚫 Ruptures:', outOfStock]
      );

      // Ajouter les données à la feuille
      await this.addDataToSheet(spreadsheetId, 'Stocks', data);
      
      // Formater les headers
      await this.formatHeaders(spreadsheetId, 'Stocks', 8);

      return {
        success: true,
        spreadsheetId,
        spreadsheetUrl,
        stats: { totalProducts, goodStock, lowStock, outOfStock }
      };

    } catch (error) {
      console.error('❌ Erreur export Google Sheets stocks:', error);
      throw error;
    }
  }

  // Exporter un rapport hebdomadaire vers Google Sheets
  async exportWeeklyReport(barId, barName, companyName, startDate, endDate) {
    try {
      if (!this.isAvailable()) {
        throw new Error('Google Sheets non disponible');
      }

      const { Stock, Format, Product, StockHistory } = require('../models');
      
      // Créer la feuille de calcul
      const title = `Rapport ${barName} - ${moment(startDate).format('DD/MM')} au ${moment(endDate).format('DD/MM/YYYY')}`;
      const { spreadsheetId, spreadsheetUrl } = await this.createSpreadsheet(title);

      // === FEUILLE STOCKS ===
      await this.addStocksSheet(spreadsheetId, barId, barName, companyName);
      
      // === FEUILLE MOUVEMENTS ===
      await this.addMovementsSheet(spreadsheetId, barId, barName, startDate, endDate);

      return {
        success: true,
        spreadsheetId,
        spreadsheetUrl
      };

    } catch (error) {
      console.error('❌ Erreur export rapport Google Sheets:', error);
      throw error;
    }
  }

  // Ajouter la feuille des stocks
  async addStocksSheet(spreadsheetId, barId, barName, companyName) {
    const { Stock, Format, Product } = require('../models');
    
    const stocks = await Stock.findAll({
      where: { barId },
      include: [{ model: Format, include: [{ model: Product }] }]
    });

    const data = [
      [`📊 STOCKS ACTUELS - ${barName.toUpperCase()}`],
      [`🏢 ${companyName} - ${moment().format('DD/MM/YYYY')}`],
      [],
      ['Produit', 'Format', 'Stock Actuel', 'Stock Min', 'Stock Max', 'Statut']
    ];

    stocks.forEach(stock => {
      const product = stock.Format?.Product;
      const format = stock.Format;
      
      let status = '✅ Bon';
      if (stock.currentQuantity <= stock.minQuantity) {
        status = stock.currentQuantity === 0 ? '🚫 Rupture' : '⚠️ Faible';
      }

      data.push([
        product?.name || 'N/A',
        format ? `${format.size} ${format.unit}` : 'N/A',
        stock.currentQuantity,
        stock.minQuantity,
        stock.maxQuantity,
        status
      ]);
    });

    await this.addDataToSheet(spreadsheetId, 'Stocks Actuels', data);
    await this.formatHeaders(spreadsheetId, 'Stocks Actuels', 6);
  }

  // Ajouter la feuille des mouvements
  async addMovementsSheet(spreadsheetId, barId, barName, startDate, endDate) {
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

    const data = [
      [`📈 MOUVEMENTS - ${barName.toUpperCase()}`],
      [`📅 Période: ${moment(startDate).format('DD/MM/YYYY')} - ${moment(endDate).format('DD/MM/YYYY')}`],
      [],
      ['Date', 'Produit', 'Format', 'Type', 'Quantité', 'Stock Avant', 'Stock Après', 'Motif']
    ];

    movements.forEach(movement => {
      const product = movement.Stock?.Format?.Product;
      const format = movement.Stock?.Format;

      data.push([
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

    await this.addDataToSheet(spreadsheetId, 'Mouvements', data);
    await this.formatHeaders(spreadsheetId, 'Mouvements', 8);
  }

  // Rendre la feuille publique (lecture seule)
  async makePublic(spreadsheetId) {
    try {
      if (!this.drive) return null;

      await this.drive.permissions.create({
        fileId: spreadsheetId,
        resource: {
          role: 'reader',
          type: 'anyone'
        }
      });

      return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit?usp=sharing`;

    } catch (error) {
      console.error('❌ Erreur partage public:', error);
      return null;
    }
  }
}

module.exports = GoogleSheetsService; 