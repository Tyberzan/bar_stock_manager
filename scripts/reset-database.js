const { sequelize } = require('../src/config/database');
const fs = require('fs');
const path = require('path');

async function resetDatabase() {
  try {
    console.log('🔄 Début de la réinitialisation de la base de données...');
    
    // Fermer toutes les connexions
    await sequelize.close();
    console.log('🔌 Connexions fermées');
    
    // Supprimer le fichier de base de données
    const dbPath = path.join(__dirname, '../database.sqlite');
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
      console.log('🗑️  Fichier database.sqlite supprimé');
    }
    
    // Reconnecter et recréer toutes les tables
    await sequelize.authenticate();
    console.log('✅ Nouvelle connexion établie');
    
    // Forcer la création de toutes les tables
    await sequelize.sync({ force: true });
    console.log('🔄 Toutes les tables recréées');
    
    // Créer les données de base
    await createBasicData();
    
    console.log('✅ Base de données réinitialisée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

async function createBasicData() {
  try {
    const { Company, Bar, Product, Format } = require('../src/models');
    
    console.log('📝 Création des données de base...');
    
    // Créer une entreprise par défaut
    const company = await Company.create({
      name: 'Restaurant Le Gourmet',
      address: '123 Rue de la Paix, 75001 Paris',
      phone: '01 23 45 67 89',
      email: 'contact@legourmet.fr'
    });
    console.log('🏢 Entreprise créée:', company.name);
    
    // Créer des bars
    const bars = await Bar.bulkCreate([
      {
        name: 'Bar Principal',
        location: 'Rez-de-chaussée',
        companyId: company.id
      },
      {
        name: 'Bar Lounge',
        location: 'Premier étage',
        companyId: company.id
      },
      {
        name: 'Bar Piscine',
        location: 'Terrasse',
        companyId: company.id
      },
      {
        name: 'Bar Terrasse',
        location: 'Extérieur',
        companyId: company.id
      }
    ]);
    console.log('🍺 Bars créés:', bars.length);
    
    // Créer quelques produits de base
    const products = await Product.bulkCreate([
      { name: 'Coca-Cola', brand: 'Coca-Cola', category: 'soft' },
      { name: 'Heineken', brand: 'Heineken', category: 'beer' },
      { name: 'Jack Daniel\'s', brand: 'Jack Daniel\'s', category: 'spirit' },
      { name: 'Perrier', brand: 'Perrier', category: 'soft' }
    ]);
    console.log('🥤 Produits créés:', products.length);
    
    // Créer des formats
    const formats = await Format.bulkCreate([
      { productId: products[0].id, size: '33cl', volume: 33, unit: 'cl', packaging: 'canette' },
      { productId: products[1].id, size: '33cl', volume: 33, unit: 'cl', packaging: 'bouteille' },
      { productId: products[2].id, size: '70cl', volume: 70, unit: 'cl', packaging: 'bouteille' },
      { productId: products[3].id, size: '1L', volume: 100, unit: 'cl', packaging: 'bouteille' }
    ]);
    console.log('📦 Formats créés:', formats.length);
    
    console.log('✅ Données de base créées avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des données de base:', error);
    throw error;
  }
}

// Exécuter la réinitialisation
if (require.main === module) {
  resetDatabase()
    .then(() => {
      console.log('🎉 Réinitialisation terminée avec succès !');
      console.log('🚀 Vous pouvez maintenant démarrer le serveur avec: npm run dev');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Échec de la réinitialisation:', error);
      process.exit(1);
    });
}

module.exports = { resetDatabase }; 