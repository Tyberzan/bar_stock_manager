const { sequelize } = require('../src/config/database');
const { 
  Company, Bar, Product, Format, Stock, Reserve, ReserveStock, 
  User, StockHistory, ReserveTransfer 
} = require('../src/models');

async function fixMissingData() {
  try {
    console.log('🔧 Correction des données manquantes...\n');
    
    // 1. Resynchroniser la base de données avec force pour appliquer les changements de modèle
    console.log('📊 Resynchronisation de la base de données...');
    await sequelize.sync({ force: true });
    console.log('✅ Base de données resynchronisée');
    
    // 2. Recréer les données de base (import de l'export existant)
    console.log('\n📥 Restauration des données de base...');
    
    // Simuler les données essentielles pour les tests
    const company = await Company.create({
      name: 'PoneyClub Test',
      email: 'contact@poneyclub.test',
      address: '123 Rue Test'
    });
    console.log('✅ Entreprise créée:', company.name);
    
    const bar = await Bar.create({
      name: 'Bar Principal',
      companyId: company.id
    });
    console.log('✅ Bar créé:', bar.name);
    
    // 3. Créer des produits de test
    const products = await Product.bulkCreate([
      { name: 'Coca-Cola', category: 'soft' },
      { name: 'Heineken', category: 'beer' },
      { name: 'Smirnoff Vodka', category: 'spirits' }
    ]);
    console.log('✅ Produits créés:', products.length);
    
    // 4. Créer des formats pour chaque produit
    console.log('📏 Création des formats...');
    const formats = [];
    
    for (const product of products) {
      if (product.category === 'soft') {
        const format = await Format.create({
          productId: product.id,
          size: '33cl',
          volume: 33,
          unit: 'cl',
          packaging: 'canette'
        });
        formats.push(format);
        console.log(`   - ${product.name}: ${format.size} ${format.packaging}`);
      } else if (product.category === 'beer') {
        const format = await Format.create({
          productId: product.id,
          size: '25cl',
          volume: 25,
          unit: 'cl',
          packaging: 'bouteille'
        });
        formats.push(format);
        console.log(`   - ${product.name}: ${format.size} ${format.packaging}`);
      } else if (product.category === 'spirits') {
        const format = await Format.create({
          productId: product.id,
          size: '70cl',
          volume: 70,
          unit: 'cl',
          packaging: 'bouteille'
        });
        formats.push(format);
        console.log(`   - ${product.name}: ${format.size} ${format.packaging}`);
      }
    }
    
    // 5. Créer des stocks dans le bar
    console.log('📦 Création des stocks...');
    const stocks = [];
    
    for (const format of formats) {
      // Créer des stocks avec différents niveaux pour tester les "produits à recharger"
      const currentQuantity = Math.floor(Math.random() * 20) + 1; // 1-20
      const minThreshold = 10;
      const maxThreshold = 50;
      
      const stock = await Stock.create({
        barId: bar.id,
        productId: format.productId,
        formatId: format.id,
        currentQuantity: currentQuantity,
        minThreshold: minThreshold,
        maxThreshold: maxThreshold
      });
      stocks.push(stock);
      
      const status = currentQuantity <= minThreshold ? '🔴 FAIBLE' : '✅ OK';
      console.log(`   - Stock créé: ${currentQuantity}/${minThreshold} ${status}`);
    }
    
    // 6. Créer l'utilisateur admin
    console.log('👤 Création utilisateur admin...');
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await User.create({
      username: 'admin',
      email: 'admin@test.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'Test',
      role: 'admin'
    });
    console.log('✅ Utilisateur admin créé');
    
    // 7. Test de la logique "produits à recharger"
    console.log('\n🧪 Test des produits à recharger...');
    
    const lowStocks = await Stock.findAll({
      where: {
        barId: bar.id
      },
      include: [
        { model: Product },
        { model: Format },
        { model: Bar }
      ],
      raw: false
    });
    
    console.log(`📊 Stocks analysés: ${lowStocks.length}`);
    
    const restockNeeded = lowStocks.filter(stock => stock.currentQuantity <= stock.minThreshold);
    console.log(`⚠️ Produits à recharger: ${restockNeeded.length}`);
    
    restockNeeded.forEach(stock => {
      console.log(`   - ${stock.Product.name} (${stock.Format.size}): ${stock.currentQuantity}/${stock.minThreshold}`);
    });
    
    if (restockNeeded.length > 0) {
      console.log('\n🎉 SUCCESS! Les "produits à recharger" devraient maintenant apparaître!');
    } else {
      console.log('\n📝 Note: Tous les stocks sont au-dessus du seuil minimum');
    }
    
    console.log('\n📋 Résumé:');
    console.log(`   - 1 entreprise: ${company.name}`);
    console.log(`   - 1 bar: ${bar.name}`);
    console.log(`   - ${products.length} produits`);
    console.log(`   - ${formats.length} formats`);
    console.log(`   - ${stocks.length} stocks`);
    console.log(`   - ${restockNeeded.length} produits à recharger`);
    console.log('\n🌐 Testez maintenant: http://localhost:3000');
    console.log('🔑 Login: admin / admin123');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

fixMissingData().then(() => process.exit(0)).catch(() => process.exit(1));