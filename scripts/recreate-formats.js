const { sequelize, Format, Product } = require('../src/models');

// Script pour recréer les formats avec packaging
async function recreateFormats() {
  try {
    console.log('Connexion à la base de données...');
    await sequelize.authenticate();
    
    console.log('Recherche des produits...');
    const products = await Product.findAll();
    
    console.log(`${products.length} produits trouvés. Création de formats...`);
    
    const formatMappings = {
      'soda': [
        { size: '33cl', volume: 33, unit: 'cl', packaging: 'canette' },
        { size: '50cl', volume: 50, unit: 'cl', packaging: 'bouteille' },
        { size: '1L', volume: 100, unit: 'cl', packaging: 'bouteille' }
      ],
      'bière': [
        { size: '25cl', volume: 25, unit: 'cl', packaging: 'bouteille' },
        { size: '33cl', volume: 33, unit: 'cl', packaging: 'canette' },
        { size: '33cl', volume: 33, unit: 'cl', packaging: 'bouteille' },
        { size: '50cl', volume: 50, unit: 'cl', packaging: 'pression' }
      ],
      'spiritueux': [
        { size: '70cl', volume: 70, unit: 'cl', packaging: 'bouteille' },
        { size: '1L', volume: 100, unit: 'cl', packaging: 'bouteille' }
      ],
      'eau': [
        { size: '33cl', volume: 33, unit: 'cl', packaging: 'verre' },
        { size: '50cl', volume: 50, unit: 'cl', packaging: 'bouteille' },
        { size: '1L', volume: 100, unit: 'cl', packaging: 'bouteille' }
      ],
      'whisky': [
        { size: '70cl', volume: 70, unit: 'cl', packaging: 'bouteille' }
      ]
    };
    
    let createdCount = 0;
    
    for (const product of products) {
      console.log(`\nCréation de formats pour: ${product.name} (${product.category})`);
      
      // Déterminer les formats selon la catégorie
      let formats = formatMappings[product.category.toLowerCase()] || formatMappings['soda'];
      
      // Cas spéciaux pour certains produits
      if (product.name.toLowerCase().includes('jack daniel')) {
        formats = formatMappings['whisky'];
      } else if (product.category.toLowerCase() === 'whisky') {
        formats = formatMappings['whisky'];
      }
      
      for (const formatData of formats) {
        try {
          const format = await Format.create({
            productId: product.id,
            size: formatData.size,
            volume: formatData.volume,
            unit: formatData.unit,
            packaging: formatData.packaging,
            isActive: true
          });
          
          console.log(`  ✅ ${formatData.size} (${formatData.packaging})`);
          createdCount++;
        } catch (error) {
          console.log(`  ❌ Erreur pour ${formatData.size}: ${error.message}`);
        }
      }
    }
    
    console.log(`\n🎉 ${createdCount} formats créés avec succès !`);
    
    // Vérification finale
    const totalFormats = await Format.count();
    console.log(`📏 Total de formats dans la base: ${totalFormats}`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des formats:', error.message);
    console.error('Détails:', error);
  } finally {
    await sequelize.close();
  }
}

// Exécuter la création
recreateFormats(); 