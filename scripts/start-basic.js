const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { sequelize, testConnection } = require('../src/config/database');

// Charger seulement les modèles de base
const Bar = require('../src/models/Bar');
const Product = require('../src/models/Product');
const Format = require('../src/models/Format');
const Stock = require('../src/models/Stock');
const StockHistory = require('../src/models/StockHistory');
const User = require('../src/models/User');
const Company = require('../src/models/Company');

// Définir les relations de base
Company.hasMany(Bar, { foreignKey: 'companyId', onDelete: 'SET NULL' });
Bar.belongsTo(Company, { foreignKey: 'companyId' });

Product.hasMany(Format, { foreignKey: 'productId', onDelete: 'CASCADE' });
Format.belongsTo(Product, { foreignKey: 'productId' });

Bar.hasMany(Stock, { foreignKey: 'barId', onDelete: 'CASCADE' });
Stock.belongsTo(Bar, { foreignKey: 'barId' });

Format.hasMany(Stock, { foreignKey: 'formatId', onDelete: 'CASCADE' });
Stock.belongsTo(Format, { foreignKey: 'formatId' });

Stock.hasMany(StockHistory, { foreignKey: 'stockId', onDelete: 'CASCADE' });
StockHistory.belongsTo(Stock, { foreignKey: 'stockId' });

Bar.hasMany(StockHistory, { foreignKey: 'barId', onDelete: 'CASCADE' });
StockHistory.belongsTo(Bar, { foreignKey: 'barId' });

Bar.hasMany(User, { foreignKey: 'barId', onDelete: 'SET NULL' });
User.belongsTo(Bar, { foreignKey: 'barId' });

// Routes de base
const authRoutes = require('../src/routes/authRoutes');
const barRoutes = require('../src/routes/barRoutes');
const productRoutes = require('../src/routes/productRoutes');
const formatRoutes = require('../src/routes/formatRoutes');
const stockRoutes = require('../src/routes/stockRoutes');
const companyRoutes = require('../src/routes/companyRoutes');

// Initialiser l'application Express
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, '../public')));

// Routes API de base
app.use('/api/auth', authRoutes);
app.use('/api/bars', barRoutes);
app.use('/api/products', productRoutes);
app.use('/api/formats', formatRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/companies', companyRoutes);

// Route pour l'interface admin
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Port
const PORT = process.env.PORT || 3000;

// Démarrer le serveur
const startBasicServer = async () => {
  try {
    // Tester la connexion à la base de données
    await testConnection();
    
    // Synchroniser les modèles avec la base de données
    await sequelize.sync();
    console.log('Base de données synchronisée avec succès');
    
    // Créer des données de base si nécessaire
    await createBasicDataIfNeeded();
    
    // Démarrer le serveur
    app.listen(PORT, () => {
      console.log(`Serveur basique démarré sur le port ${PORT}`);
      console.log('🎉 Système de base fonctionnel !');
      console.log('📋 Fonctionnalités disponibles :');
      console.log('   - Gestion des entreprises');
      console.log('   - Gestion des bars');
      console.log('   - Gestion des produits et formats');
      console.log('   - Gestion des stocks');
    });
    
  } catch (error) {
    console.error('Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
};

async function createBasicDataIfNeeded() {
  try {
    // Vérifier s'il y a déjà des données
    const companyCount = await Company.count();
    
    if (companyCount === 0) {
      console.log('📝 Création des données de base...');
      
      // Créer une entreprise par défaut
      const company = await Company.create({
        name: 'Restaurant Le Gourmet',
        address: '123 Rue de la Paix, 75001 Paris',
        phone: '01 23 45 67 89',
        email: 'contact@legourmet.fr'
      });
      
      // Créer des bars
      await Bar.bulkCreate([
        {
          name: 'Bar Principal',
          location: 'Rez-de-chaussée',
          companyId: company.id
        },
        {
          name: 'Bar Lounge',
          location: 'Premier étage',
          companyId: company.id
        }
      ]);
      
      // Créer quelques produits
      const products = await Product.bulkCreate([
        { name: 'Coca-Cola', brand: 'Coca-Cola', category: 'soft' },
        { name: 'Heineken', brand: 'Heineken', category: 'beer' }
      ]);
      
      // Créer des formats
      await Format.bulkCreate([
        { productId: products[0].id, size: '33cl', volume: 33, unit: 'cl', packaging: 'canette' },
        { productId: products[1].id, size: '33cl', volume: 33, unit: 'cl', packaging: 'bouteille' }
      ]);
      
      console.log('✅ Données de base créées !');
      
      // Créer l'utilisateur admin
      await createAdminUser();
    }
  } catch (error) {
    console.log('⚠️  Erreur lors de la création des données de base:', error.message);
    console.log('💡 Le serveur va démarrer sans données de base');
  }
}

async function createAdminUser() {
  try {
    const bcrypt = require('bcrypt');
    const User = require('../src/models/User');
    const Bar = require('../src/models/Bar');
    
    // Vérifier s'il y a déjà un admin
    const existingAdmin = await User.findOne({ where: { username: 'admin' } });
    
    if (!existingAdmin) {
      // Récupérer le premier bar
      const firstBar = await Bar.findOne();
      
      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      // Créer l'utilisateur admin
      await User.create({
        username: 'admin',
        password: hashedPassword,
        email: 'admin@legourmet.fr',
        role: 'admin',
        barId: firstBar ? firstBar.id : null
      });
      
      console.log('👤 Utilisateur admin créé (admin/admin123)');
    }
  } catch (error) {
    console.log('⚠️  Erreur lors de la création de l\'admin:', error.message);
  }
}

// Démarrer le serveur
startBasicServer(); 