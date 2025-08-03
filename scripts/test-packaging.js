const { sequelize, Format, Product } = require('../src/models');

// Script de test pour vérifier que les formats avec packaging fonctionnent
async function testPackaging() {
  try {
    console.log('Connexion à la base de données...');
    await sequelize.authenticate();
    
    console.log('Test de création d\'un format avec packaging...');
    
    // Rechercher un produit existant
    const product = await Product.findOne();
    
    if (!product) {
      console.log('Aucun produit trouvé. Création d\'un produit de test...');
      const testProduct = await Product.create({
        name: 'Test Packaging',
        brand: 'Test',
        category: 'beer',
        isActive: true
      });
      
      // Créer un format avec packaging
      const format = await Format.create({
        productId: testProduct.id,
        size: '33cl Test',
        unit: 'cl',
        volume: 33,
        packaging: 'canette',
        isActive: true
      });
      
      console.log('✅ Format créé avec succès:', {
        id: format.id,
        size: format.size,
        packaging: format.packaging,
        volume: format.volume,
        unit: format.unit
      });
      
      // Nettoyage
      await format.destroy();
      await testProduct.destroy();
      console.log('✅ Données de test nettoyées');
      
    } else {
      console.log('✅ Produit trouvé:', product.name);
      
      // Vérifier les formats existants
      const formats = await Format.findAll({
        where: { productId: product.id },
        limit: 3
      });
      
      console.log(`✅ ${formats.length} format(s) trouvé(s) pour ce produit:`);
      formats.forEach(format => {
        console.log(`  - ${format.size} (${format.volume} ${format.unit}) - ${format.packaging || 'pas de packaging'}`);
      });
    }
    
    console.log('\n🎉 Test réussi ! Le champ packaging fonctionne correctement.');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.error('Détails:', error);
  } finally {
    await sequelize.close();
  }
}

// Exécuter le test
testPackaging(); 