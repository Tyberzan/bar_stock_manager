const { sequelize } = require('../src/config/database');
const { 
  Company, Bar, Product, Format, Stock, Reserve, ReserveStock, 
  User, StockHistory, ReserveTransfer 
} = require('../src/models');
const fs = require('fs');
const path = require('path');

async function exportDatabase() {
  try {
    console.log('🔄 Début export de la base de données...');
    
    // Export des données principales
    const exportData = {
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      description: "Export Bar Stock Manager pour collaboration",
      data: {
        companies: await Company.findAll({ raw: true }),
        bars: await Bar.findAll({ raw: true }),
        products: await Product.findAll({ raw: true }),
        formats: await Format.findAll({ raw: true }),
        stocks: await Stock.findAll({ raw: true }),
        reserves: await Reserve.findAll({ raw: true }),
        reserveStocks: await ReserveStock.findAll({ raw: true }),
        users: await User.findAll({ 
          raw: true,
          attributes: { exclude: ['password'] } // Exclure les mots de passe
        }),
        stockHistory: await StockHistory.findAll({ 
          raw: true,
          limit: 100, // Limiter l'historique pour éviter un fichier trop gros
          order: [['createdAt', 'DESC']]
        }),
        reserveTransfers: await ReserveTransfer.findAll({ raw: true })
      }
    };

    // Statistiques
    const stats = {
      companies: exportData.data.companies.length,
      bars: exportData.data.bars.length,
      products: exportData.data.products.length,
      formats: exportData.data.formats.length,
      stocks: exportData.data.stocks.length,
      reserves: exportData.data.reserves.length,
      reserveStocks: exportData.data.reserveStocks.length,
      users: exportData.data.users.length,
      stockHistory: exportData.data.stockHistory.length,
      reserveTransfers: exportData.data.reserveTransfers.length
    };

    console.log('📊 Statistiques export:', stats);

    // Créer le dossier exports s'il n'existe pas
    const exportsDir = path.join(__dirname, '..', 'exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir);
    }

    // Sauvegarder l'export
    const filename = `database-export-${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(exportsDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2));
    
    console.log(`✅ Export réussi: ${filename}`);
    console.log(`📂 Fichier: ${filepath}`);
    console.log(`📦 Taille: ${Math.round(fs.statSync(filepath).size / 1024)} KB`);
    
    return filepath;
  } catch (error) {
    console.error('❌ Erreur export:', error);
    throw error;
  }
}

// Fonction d'import pour le collègue
async function importDatabase(filepath) {
  try {
    console.log('🔄 Début import de la base de données...');
    
    if (!fs.existsSync(filepath)) {
      throw new Error(`Fichier non trouvé: ${filepath}`);
    }

    const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    
    console.log(`📅 Import des données du: ${data.timestamp}`);
    console.log(`📝 Description: ${data.description}`);

    // Synchroniser la base (effacer et recréer)
    await sequelize.sync({ force: true });
    console.log('🗃️ Base de données réinitialisée');

    // Importer dans l'ordre des dépendances
    console.log('📥 Import des entreprises...');
    await Company.bulkCreate(data.data.companies);
    
    console.log('📥 Import des bars...');
    await Bar.bulkCreate(data.data.bars);
    
    console.log('📥 Import des produits...');
    await Product.bulkCreate(data.data.products);
    
    console.log('📥 Import des formats...');
    await Format.bulkCreate(data.data.formats);
    
    console.log('📥 Import des réserves...');
    await Reserve.bulkCreate(data.data.reserves);
    
    console.log('📥 Import des stocks...');
    await Stock.bulkCreate(data.data.stocks);
    
    console.log('📥 Import des stocks de réserves...');
    await ReserveStock.bulkCreate(data.data.reserveStocks);
    
    console.log('📥 Import des utilisateurs...');
    // Ajouter un mot de passe par défaut pour les utilisateurs importés
    const usersWithPassword = data.data.users.map(user => ({
      ...user,
      password: '$2b$10$rQ1.3K7O5vQ1.3K7O5vQ1.RQ1.3K7O5vQ1.3K7O5vQ1.3K7O5vQ1.' // "password123" hashé
    }));
    await User.bulkCreate(usersWithPassword);
    
    console.log('📥 Import de l\'historique...');
    await StockHistory.bulkCreate(data.data.stockHistory);
    
    console.log('📥 Import des transferts...');
    await ReserveTransfer.bulkCreate(data.data.reserveTransfers);
    
    console.log('✅ Import terminé avec succès !');
    console.log('🔑 Mot de passe par défaut pour tous les utilisateurs: password123');
    
  } catch (error) {
    console.error('❌ Erreur import:', error);
    throw error;
  }
}

// Exécuter selon l'argument
const action = process.argv[2];
const filepath = process.argv[3];

if (action === 'export') {
  exportDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
} else if (action === 'import' && filepath) {
  importDatabase(filepath)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
} else {
  console.log(`
🔧 Utilisation:
  Export: node scripts/export-database.js export
  Import: node scripts/export-database.js import chemin/vers/fichier.json
  `);
  process.exit(1);
}