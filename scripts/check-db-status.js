const { sequelize, Format, Product, Bar, Stock } = require('../src/models');

// Script pour vérifier l'état de la base de données
async function checkDbStatus() {
  try {
    console.log('Connexion à la base de données...');
    await sequelize.authenticate();
    
    console.log('\n📊 État de la base de données:');
    console.log('================================');
    
    // Compter les enregistrements
    const productCount = await Product.count();
    const formatCount = await Format.count();
    const barCount = await Bar.count();
    const stockCount = await Stock.count();
    
    console.log(`🏪 Bars: ${barCount}`);
    console.log(`📦 Produits: ${productCount}`);
    console.log(`📏 Formats: ${formatCount}`);
    console.log(`📊 Stocks: ${stockCount}`);
    
    if (formatCount > 0) {
      console.log('\n📏 Formats existants:');
      const formats = await Format.findAll({
        include: [Product],
        limit: 10
      });
      
      formats.forEach((format, index) => {
        const productName = format.Product ? format.Product.name : 'Produit supprimé';
        console.log(`  ${index + 1}. ${productName} - ${format.size} (${format.volume} ${format.unit}) - ${format.packaging || 'Pas de packaging'}`);
      });
      
      if (formatCount > 10) {
        console.log(`  ... et ${formatCount - 10} autres formats`);
      }
    }
    
    if (productCount > 0) {
      console.log('\n📦 Quelques produits:');
      const products = await Product.findAll({ limit: 5 });
      products.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name} ${product.brand ? `(${product.brand})` : ''} - ${product.category}`);
      });
    }
    
    console.log('\n✅ Vérification terminée !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
    console.error('Détails:', error);
  } finally {
    await sequelize.close();
  }
}

// Exécuter la vérification
checkDbStatus(); 