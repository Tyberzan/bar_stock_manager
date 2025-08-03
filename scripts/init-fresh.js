const { sequelize } = require('../src/config/database');

async function initFresh() {
  try {
    console.log('🔄 Initialisation propre de la base de données...');
    
    // Connecter à la base de données
    await sequelize.authenticate();
    console.log('✅ Connexion établie');
    
    // Créer toutes les tables (force: true supprime et recrée)
    await sequelize.sync({ force: true });
    console.log('🔄 Tables créées avec succès');
    
    // Créer les données de base
    await createBasicData();
    
    console.log('✅ Base de données initialisée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

async function createBasicData() {
  try {
    // Attendre que les modèles soient synchronisés avant de les utiliser
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const Company = require('../src/models/Company');
    const Bar = require('../src/models/Bar');
    const Product = require('../src/models/Product');
    const Format = require('../src/models/Format');
    
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
      { name: 'Heineken', brand: 'Heineken', category: 'beer' },
      { name: 'Jack Daniel\'s', brand: 'Jack Daniel\'s', category: 'spirit' }
    ]);
    console.log('🥤 Produits créés:', products.length);
    
    // Créer des formats
    const formats = await Format.bulkCreate([
      { productId: products[0].id, size: '33cl', volume: 33, unit: 'cl', packaging: 'canette' },
      { productId: products[1].id, size: '33cl', volume: 33, unit: 'cl', packaging: 'bouteille' },
      { productId: products[2].id, size: '70cl', volume: 70, unit: 'cl', packaging: 'bouteille' }
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
  initFresh()
    .then(() => {
      console.log('🎉 Initialisation terminée ! Vous pouvez démarrer le serveur avec: npm run dev');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Échec:', error);
      process.exit(1);
    });
}

module.exports = { initFresh }; 