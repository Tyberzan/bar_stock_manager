const { sequelize } = require('../src/config/database');
const { 
  Company, Bar, Product, Format, Stock, Reserve, ReserveStock, 
  User, StockHistory, ReserveTransfer 
} = require('../src/models');
const bcrypt = require('bcrypt');

async function populateFullDatabase() {
  try {
    console.log('🔄 Création d\'une base de données complète pour les tests...\n');
    
    // Vérifier s'il y a déjà des données
    const existingCompanies = await Company.count();
    if (existingCompanies > 1) {
      console.log('📊 Base de données déjà peuplée, ajout des données manquantes...');
    }
    
    // 1. S'assurer qu'on a une entreprise principale
    let company = await Company.findOne({ where: { name: 'PoneyClub Test' } });
    if (!company) {
      company = await Company.create({
        name: 'PoneyClub Test',
        email: 'contact@poneyclub.test',
        address: '123 Rue Test'
      });
    }
    
    // 2. Créer une deuxième entreprise pour tester le multi-tenant
    let company2 = await Company.findOne({ where: { name: 'Restaurant Le Gourmet' } });
    if (!company2) {
      company2 = await Company.create({
        name: 'Restaurant Le Gourmet',
        email: 'contact@legourmet.fr',
        address: '456 Avenue Gastronomique'
      });
      console.log('✅ Entreprise 2 créée: Restaurant Le Gourmet'); 
    }
    
    // 3. Créer plusieurs bars pour tester
    const bars = [];
    const barData = [
      { name: 'Bar Principal', companyId: company.id },
      { name: 'Bar Terrasse', companyId: company.id },
      { name: 'Bar VIP', companyId: company.id },
      { name: 'Bar Restaurant', companyId: company2.id }
    ];
    
    for (const barInfo of barData) {
      let bar = await Bar.findOne({ where: { name: barInfo.name, companyId: barInfo.companyId } });
      if (!bar) {
        bar = await Bar.create(barInfo);
        console.log(`✅ Bar créé: ${bar.name}`);
      }
      bars.push(bar);
    }
    
    // 4. Créer plus de produits variés
    const productData = [
      { name: 'Coca-Cola', category: 'soft' },
      { name: 'Pepsi', category: 'soft' },
      { name: 'Sprite', category: 'soft' },
      { name: 'Heineken', category: 'beer' },
      { name: 'Desperados', category: 'beer' },
      { name: 'Corona', category: 'beer' },
      { name: 'Smirnoff Vodka', category: 'spirits' },
      { name: 'Jack Daniels', category: 'spirits' },
      { name: 'Grey Goose', category: 'spirits' },
      { name: 'Champagne Moët', category: 'champagne' },
      { name: 'Vin Rouge Bordeaux', category: 'wine' },
      { name: 'Vin Blanc Chardonnay', category: 'wine' }
    ];
    
    const products = [];
    for (const productInfo of productData) {
      let product = await Product.findOne({ where: { name: productInfo.name } });
      if (!product) {
        product = await Product.create(productInfo);
        console.log(`✅ Produit créé: ${product.name}`);
      }
      products.push(product);
    }
    
    // 5. Créer des formats pour chaque produit
    console.log('📏 Création des formats...');
    const formats = [];
    
    for (const product of products) {
      // Vérifier si le produit a déjà des formats
      const existingFormats = await Format.count({ where: { productId: product.id } });
      if (existingFormats > 0) continue;
      
      let formatData = [];
      
      if (product.category === 'soft') {
        formatData = [
          { size: '25cl', volume: 25, unit: 'cl', packaging: 'canette' },
          { size: '33cl', volume: 33, unit: 'cl', packaging: 'canette' },
          { size: '50cl', volume: 50, unit: 'cl', packaging: 'bouteille' }
        ];
      } else if (product.category === 'beer') {
        formatData = [
          { size: '25cl', volume: 25, unit: 'cl', packaging: 'bouteille' },
          { size: '33cl', volume: 33, unit: 'cl', packaging: 'bouteille' },
          { size: '50cl', volume: 50, unit: 'cl', packaging: 'pression' }
        ];
      } else if (product.category === 'spirits') {
        formatData = [
          { size: '4cl', volume: 4, unit: 'cl', packaging: 'shot' },
          { size: '70cl', volume: 70, unit: 'cl', packaging: 'bouteille' }
        ];
      } else if (product.category === 'wine' || product.category === 'champagne') {
        formatData = [
          { size: '12.5cl', volume: 12.5, unit: 'cl', packaging: 'verre' },
          { size: '75cl', volume: 75, unit: 'cl', packaging: 'bouteille' }
        ];
      }
      
      for (const format of formatData) {
        const newFormat = await Format.create({
          productId: product.id,
          ...format
        });
        formats.push(newFormat);
      }
    }
    
    console.log(`✅ ${formats.length} formats créés`);
    
    // 6. Créer des stocks réalistes dans chaque bar
    console.log('📦 Création des stocks...');
    
    for (const bar of bars) {
      // Vérifier si ce bar a déjà des stocks
      const existingStocks = await Stock.count({ where: { barId: bar.id } });
      if (existingStocks > 0) continue;
      
      // Créer des stocks pour quelques produits sélectionnés
      const selectedFormats = await Format.findAll({ 
        include: [Product],
        limit: 8 // Limiter pour ne pas surcharger
      });
      
      for (const format of selectedFormats) {
        // Quantités variées pour tester les différents statuts
        const quantities = [5, 12, 25, 8, 30, 15, 3, 40];
        const currentQuantity = quantities[Math.floor(Math.random() * quantities.length)];
        
        await Stock.create({
          barId: bar.id,
          productId: format.productId,
          formatId: format.id,
          currentQuantity: currentQuantity,
          minThreshold: 10,
          maxThreshold: 50
        });
      }
      
      console.log(`✅ Stocks créés pour ${bar.name}`);
    }
    
    // 7. Créer des réserves
    console.log('🏪 Création des réserves...');
    
    const reserveTypes = [
      { name: 'Réserve Frigofirque 1', type: 'cold', temperature: -2, companyId: company.id },
      { name: 'Réserve Sèche', type: 'dry', temperature: 20, companyId: company.id },
      { name: 'Cave à Vin', type: 'wine', temperature: 12, companyId: company.id },
      { name: 'Réserve Restaurant', type: 'mixed', temperature: 15, companyId: company2.id }
    ];
    
    const reserves = [];
    for (const reserveInfo of reserveTypes) {
      let reserve = await Reserve.findOne({ where: { name: reserveInfo.name } });
      if (!reserve) {
        reserve = await Reserve.create(reserveInfo);
        console.log(`✅ Réserve créée: ${reserve.name}`);
      }
      reserves.push(reserve);
    }
    
    // 8. Créer des stocks de réserves
    console.log('📦 Création des stocks de réserves...');
    
    for (const reserve of reserves) {
      const existingReserveStocks = await ReserveStock.count({ where: { reserveId: reserve.id } });
      if (existingReserveStocks > 0) continue;
      
      // Quelques formats pour chaque réserve
      const reserveFormats = await Format.findAll({ limit: 5 });
      
      for (const format of reserveFormats) {
        await ReserveStock.create({
          reserveId: reserve.id,
          formatId: format.id,
          quantity: Math.floor(Math.random() * 100) + 20, // 20-120
          lotNumber: `LOT${Math.floor(Math.random() * 1000) + 1000}`,
          expirationDate: new Date(Date.now() + (Math.random() * 365 * 24 * 60 * 60 * 1000)), // Jusqu'à 1 an
          location: `Zone-${Math.floor(Math.random() * 10) + 1}`
        });
      }
      
      console.log(`✅ Stocks de réserve créés pour ${reserve.name}`);
    }
    
    // 9. Créer des utilisateurs de test avec différents rôles
    console.log('👥 Création des utilisateurs...');
    
    const userData = [
      { username: 'admin', email: 'admin@test.com', role: 'admin', password: 'admin123' },
      { username: 'manager1', email: 'manager@poneyclub.test', role: 'manager', password: 'manager123', companyId: company.id },
      { username: 'barman1', email: 'barman@poneyclub.test', role: 'user', password: 'barman123', barId: bars[0].id },
      { username: 'admin2', email: 'admin@legourmet.fr', role: 'admin', password: 'admin123', companyId: company2.id }
    ];
    
    for (const userInfo of userData) {
      const existingUser = await User.findOne({ where: { username: userInfo.username } });
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(userInfo.password, 10);
        await User.create({
          username: userInfo.username,
          email: userInfo.email,
          password: hashedPassword,
          firstName: userInfo.username.charAt(0).toUpperCase() + userInfo.username.slice(1),
          lastName: 'Test',
          role: userInfo.role,
          companyId: userInfo.companyId,
          barId: userInfo.barId
        });
        console.log(`✅ Utilisateur créé: ${userInfo.username} (${userInfo.role})`);
      }
    }
    
    // 10. Statistiques finales
    console.log('\n📊 STATISTIQUES FINALES:');
    console.log('=' .repeat(50));
    
    const stats = {
      companies: await Company.count(),
      bars: await Bar.count(),
      products: await Product.count(),
      formats: await Format.count(),
      stocks: await Stock.count(),
      reserves: await Reserve.count(),
      reserveStocks: await ReserveStock.count(),
      users: await User.count()
    };
    
    Object.entries(stats).forEach(([key, count]) => {
      console.log(`   ${key.padEnd(15)}: ${count}`);
    });
    
    // Calculer les produits à recharger
    const lowStocks = await Stock.findAll({
      where: {
        currentQuantity: {
          [sequelize.Sequelize.Op.lte]: sequelize.col('minThreshold')
        }
      }
    });
    
    console.log(`   ${'low stocks'.padEnd(15)}: ${lowStocks.length} (produits à recharger)`);
    
    console.log('\n🎯 TESTS RECOMMANDÉS:');
    console.log('   1. Login: admin / admin123');
    console.log('   2. Dashboard → Voir tous les bars');
    console.log('   3. Bars → Ajouter/Modifier un bar');
    console.log('   4. Produits → Ajouter/Modifier un produit'); 
    console.log('   5. Stock → Sélectionner un bar → Voir produits à recharger');
    console.log('   6. Stock → Boutons +/- pour modifier quantités');
    console.log('   7. Réserves → Créer une réserve');
    console.log('   8. Réserves → Transfert vers un bar');
    console.log('   9. Utilisateurs → Gérer les comptes');
    console.log('   10. Historique → Voir les mouvements');
    
    console.log('\n🎉 BASE DE DONNÉES COMPLÈTE PRÊTE POUR TOUS LES TESTS!');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

populateFullDatabase().then(() => process.exit(0)).catch(() => process.exit(1));