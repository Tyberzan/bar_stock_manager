const { sequelize } = require('../src/config/database');
const fs = require('fs');
const path = require('path');

async function simpleReset() {
  try {
    console.log('🔄 Réinitialisation simple de la base de données...');
    
    // Supprimer le fichier de base de données directement
    const dbPath = path.join(__dirname, '../database.sqlite');
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
      console.log('🗑️  Fichier database.sqlite supprimé');
    }
    
    // Connecter et créer toutes les tables
    await sequelize.authenticate();
    console.log('✅ Connexion établie');
    
    // Créer toutes les tables
    await sequelize.sync({ force: true });
    console.log('🔄 Tables créées');
    
    // Créer les données de base
    await createBasicData();
    
    console.log('✅ Base de données réinitialisée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
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
      }
    ]);
    console.log('🍺 Bars créés:', bars.length);
    
    // Créer quelques produits de base
    const products = await Product.bulkCreate([
      { name: 'Coca-Cola', brand: 'Coca-Cola', category: 'soft' },
      { name: 'Heineken', brand: 'Heineken', category: 'beer' }
    ]);
    console.log('🥤 Produits créés:', products.length);
    
    // Créer des formats
    const formats = await Format.bulkCreate([
      { productId: products[0].id, size: '33cl', volume: 33, unit: 'cl', packaging: 'canette' },
      { productId: products[1].id, size: '33cl', volume: 33, unit: 'cl', packaging: 'bouteille' }
    ]);
    console.log('📦 Formats créés:', formats.length);
    
    console.log('✅ Données de base créées !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des données:', error);
    throw error;
  }
}

// Exécuter
if (require.main === module) {
  simpleReset()
    .then(() => {
      console.log('🎉 Terminé ! Vous pouvez démarrer le serveur.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Échec:', error);
      process.exit(1);
    });
}

module.exports = { simpleReset }; 