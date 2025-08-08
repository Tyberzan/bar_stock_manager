const { sequelize } = require('../src/config/database');
const { 
  Company, Bar, Product, Format, Stock, Reserve, ReserveStock, 
  User, StockHistory, ReserveTransfer 
} = require('../src/models');

// Simuler les contrôleurs pour tester les endpoints
const controllers = {
  barController: require('../src/controllers/barController'),
  productController: require('../src/controllers/productController'),
  stockController: require('../src/controllers/stockController'),
  companyController: require('../src/controllers/companyController'),
  reserveController: require('../src/controllers/reserveController'),
  userController: require('../src/controllers/userController')
};

// Mock response object
function createMockResponse() {
  return {
    statusCode: null,
    jsonData: null,
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.jsonData = data;
      return this;
    },
    send: function(data) {
      this.jsonData = data;
      return this;
    }
  };
}

async function testAllEndpoints() {
  try {
    console.log('🧪 TEST COMPLET DE TOUS LES ENDPOINTS ET BOUTONS\n');
    console.log('=' .repeat(60));
    
    // Récupérer les données de test
    const company = await Company.findOne();
    const bar = await Bar.findOne();
    const products = await Product.findAll();
    const formats = await Format.findAll();
    const stocks = await Stock.findAll();
    const user = await User.findOne();
    
    console.log(`📊 Données disponibles:`);
    console.log(`   - Companies: ${company ? 1 : 0}`);
    console.log(`   - Bars: ${bar ? 1 : 0}`);
    console.log(`   - Products: ${products.length}`);
    console.log(`   - Formats: ${formats.length}`);
    console.log(`   - Stocks: ${stocks.length}`);
    console.log(`   - Users: ${user ? 1 : 0}\n`);
    
    const testResults = [];
    
    // 1. TEST COMPANIES ENDPOINTS
    console.log('🏢 TESTS COMPANIES:');
    
    try {
      const mockRes = createMockResponse();
      await controllers.companyController.getAllCompanies({}, mockRes);
      testResults.push({
        name: 'GET /companies',
        status: mockRes.statusCode,
        success: mockRes.jsonData?.success,
        count: mockRes.jsonData?.count
      });
      console.log(`   ✅ GET /companies: ${mockRes.statusCode} - ${mockRes.jsonData?.count || 0} companies`);
    } catch (error) {
      testResults.push({ name: 'GET /companies', status: 'ERROR', error: error.message });
      console.log(`   ❌ GET /companies: ERROR - ${error.message}`);
    }
    
    if (company) {
      try {
        const mockRes = createMockResponse();
        await controllers.companyController.getCompanyById({ params: { id: company.id } }, mockRes);
        testResults.push({
          name: 'GET /companies/:id',
          status: mockRes.statusCode,
          success: mockRes.jsonData?.success
        });
        console.log(`   ✅ GET /companies/${company.id}: ${mockRes.statusCode}`);
      } catch (error) {
        testResults.push({ name: 'GET /companies/:id', status: 'ERROR', error: error.message });
        console.log(`   ❌ GET /companies/${company.id}: ERROR - ${error.message}`);
      }
    }
    
    // 2. TEST BARS ENDPOINTS
    console.log('\n🍺 TESTS BARS:');
    
    try {
      const mockRes = createMockResponse();
      await controllers.barController.getAllBars({}, mockRes);
      testResults.push({
        name: 'GET /bars',
        status: mockRes.statusCode,
        success: mockRes.jsonData?.success,
        count: mockRes.jsonData?.count
      });
      console.log(`   ✅ GET /bars: ${mockRes.statusCode} - ${mockRes.jsonData?.count || 0} bars`);
    } catch (error) {
      testResults.push({ name: 'GET /bars', status: 'ERROR', error: error.message });
      console.log(`   ❌ GET /bars: ERROR - ${error.message}`);
    }
    
    if (bar) {
      try {
        const mockRes = createMockResponse();
        await controllers.barController.getBarById({ params: { id: bar.id } }, mockRes);
        testResults.push({
          name: 'GET /bars/:id',
          status: mockRes.statusCode,
          success: mockRes.jsonData?.success
        });
        console.log(`   ✅ GET /bars/${bar.id}: ${mockRes.statusCode}`);
      } catch (error) {
        testResults.push({ name: 'GET /bars/:id', status: 'ERROR', error: error.message });
        console.log(`   ❌ GET /bars/${bar.id}: ERROR - ${error.message}`);
      }
    }
    
    // 3. TEST PRODUCTS ENDPOINTS
    console.log('\n📦 TESTS PRODUCTS:');
    
    try {
      const mockRes = createMockResponse();
      await controllers.productController.getAllProducts({}, mockRes);
      testResults.push({
        name: 'GET /products',
        status: mockRes.statusCode,
        success: mockRes.jsonData?.success,
        count: mockRes.jsonData?.count
      });
      console.log(`   ✅ GET /products: ${mockRes.statusCode} - ${mockRes.jsonData?.count || 0} products`);
    } catch (error) {
      testResults.push({ name: 'GET /products', status: 'ERROR', error: error.message });
      console.log(`   ❌ GET /products: ERROR - ${error.message}`);
    }
    
    if (products.length > 0) {
      try {
        const mockRes = createMockResponse();
        await controllers.productController.getProductById({ params: { id: products[0].id } }, mockRes);
        testResults.push({
          name: 'GET /products/:id',
          status: mockRes.statusCode,
          success: mockRes.jsonData?.success
        });
        console.log(`   ✅ GET /products/${products[0].id}: ${mockRes.statusCode}`);
      } catch (error) {
        testResults.push({ name: 'GET /products/:id', status: 'ERROR', error: error.message });
        console.log(`   ❌ GET /products/${products[0].id}: ERROR - ${error.message}`);
      }
    }
    
    // 4. TEST STOCKS ENDPOINTS
    console.log('\n📊 TESTS STOCKS:');
    
    try {
      const mockRes = createMockResponse();
      await controllers.stockController.getAllStocks({}, mockRes);
      testResults.push({
        name: 'GET /stocks',
        status: mockRes.statusCode,
        success: mockRes.jsonData?.success,
        count: mockRes.jsonData?.count
      });
      console.log(`   ✅ GET /stocks: ${mockRes.statusCode} - ${mockRes.jsonData?.count || 0} stocks`);
    } catch (error) {
      testResults.push({ name: 'GET /stocks', status: 'ERROR', error: error.message });
      console.log(`   ❌ GET /stocks: ERROR - ${error.message}`);
    }
    
    if (bar) {
      try {
        const mockRes = createMockResponse();
        await controllers.stockController.getAllStocks({ query: { barId: bar.id } }, mockRes);
        testResults.push({
          name: 'GET /stocks?barId=X',
          status: mockRes.statusCode,
          success: mockRes.jsonData?.success,
          count: mockRes.jsonData?.count
        });
        console.log(`   ✅ GET /stocks?barId=${bar.id}: ${mockRes.statusCode} - ${mockRes.jsonData?.count || 0} stocks`);
      } catch (error) {
        testResults.push({ name: 'GET /stocks?barId=X', status: 'ERROR', error: error.message });
        console.log(`   ❌ GET /stocks?barId=${bar.id}: ERROR - ${error.message}`);
      }
      
      // Test produits à recharger (endpoint principal)
      try {
        const mockRes = createMockResponse();
        await controllers.stockController.getStocksToRestock({ params: { barId: bar.id } }, mockRes);
        testResults.push({
          name: 'GET /stocks/restock/:barId',
          status: mockRes.statusCode,
          success: mockRes.jsonData?.success,
          count: mockRes.jsonData?.count
        });
        console.log(`   ✅ GET /stocks/restock/${bar.id}: ${mockRes.statusCode} - ${mockRes.jsonData?.count || 0} produits à recharger`);
      } catch (error) {
        testResults.push({ name: 'GET /stocks/restock/:barId', status: 'ERROR', error: error.message });
        console.log(`   ❌ GET /stocks/restock/${bar.id}: ERROR - ${error.message}`);
      }
    }
    
    if (stocks.length > 0) {
      try {
        const mockRes = createMockResponse();
        await controllers.stockController.getStockById({ params: { id: stocks[0].id } }, mockRes);
        testResults.push({
          name: 'GET /stocks/:id',
          status: mockRes.statusCode,
          success: mockRes.jsonData?.success
        });
        console.log(`   ✅ GET /stocks/${stocks[0].id}: ${mockRes.statusCode}`);
      } catch (error) {
        testResults.push({ name: 'GET /stocks/:id', status: 'ERROR', error: error.message });
        console.log(`   ❌ GET /stocks/${stocks[0].id}: ERROR - ${error.message}`);
      }
      
      // Test mise à jour stock (simulation bouton + / -)
      try {
        const mockRes = createMockResponse();
        await controllers.stockController.updateStock({ 
          params: { id: stocks[0].id },
          body: { currentQuantity: stocks[0].currentQuantity + 1, reason: 'Test automatique' }
        }, mockRes);
        testResults.push({
          name: 'PUT /stocks/:id (update quantity)',
          status: mockRes.statusCode,
          success: mockRes.jsonData?.success
        });
        console.log(`   ✅ PUT /stocks/${stocks[0].id} (quantity update): ${mockRes.statusCode}`);
      } catch (error) {
        testResults.push({ name: 'PUT /stocks/:id', status: 'ERROR', error: error.message });
        console.log(`   ❌ PUT /stocks/${stocks[0].id}: ERROR - ${error.message}`);
      }
    }
    
    // 5. TEST RESERVES ENDPOINTS
    console.log('\n🏪 TESTS RESERVES:');
    
    try {
      const mockRes = createMockResponse();
      await controllers.reserveController.getAllReserves({}, mockRes);
      testResults.push({
        name: 'GET /reserves',
        status: mockRes.statusCode,
        success: mockRes.jsonData?.success,
        count: mockRes.jsonData?.count
      });
      console.log(`   ✅ GET /reserves: ${mockRes.statusCode} - ${mockRes.jsonData?.count || 0} reserves`);
    } catch (error) {
      testResults.push({ name: 'GET /reserves', status: 'ERROR', error: error.message });
      console.log(`   ❌ GET /reserves: ERROR - ${error.message}`);
    }
    
    // 6. TEST USERS ENDPOINTS  
    console.log('\n👥 TESTS USERS:');
    
    try {
      const mockRes = createMockResponse();
      await controllers.userController.getAllUsers({}, mockRes);
      testResults.push({
        name: 'GET /users',
        status: mockRes.statusCode,
        success: mockRes.jsonData?.success,
        count: mockRes.jsonData?.count
      });
      console.log(`   ✅ GET /users: ${mockRes.statusCode} - ${mockRes.jsonData?.count || 0} users`);
    } catch (error) {
      testResults.push({ name: 'GET /users', status: 'ERROR', error: error.message });
      console.log(`   ❌ GET /users: ERROR - ${error.message}`);
    }
    
    // RÉSUMÉ DES TESTS
    console.log('\n' + '=' .repeat(60));
    console.log('📋 RÉSUMÉ DES TESTS:');
    console.log('=' .repeat(60));
    
    const successfulTests = testResults.filter(t => t.status === 200 || (t.status >= 200 && t.status < 300));
    const failedTests = testResults.filter(t => t.status === 'ERROR' || t.status >= 400);
    
    console.log(`✅ Tests réussis: ${successfulTests.length}/${testResults.length}`);
    console.log(`❌ Tests échoués: ${failedTests.length}/${testResults.length}`);
    
    if (failedTests.length > 0) {
      console.log('\n🚨 ENDPOINTS EN ERREUR:');
      failedTests.forEach(test => {
        console.log(`   ❌ ${test.name}: ${test.error || test.status}`);
      });
    }
    
    console.log('\n🎯 BOUTONS UI À VÉRIFIER MANUELLEMENT:');
    console.log('   📊 Dashboard: Actualiser tous les bars');
    console.log('   🍺 Bars: Ajouter/Modifier/Supprimer bar');
    console.log('   📦 Products: Ajouter/Modifier/Supprimer produit');
    console.log('   📏 Formats: Ajouter/Modifier format');
    console.log('   📊 Stocks: Boutons +/- pour quantités');
    console.log('   🔄 Stocks: Initialiser tous les stocks');
    console.log('   📝 Stocks: Fin de service globale');
    console.log('   🏪 Réserves: Créer/Gérer réserves');
    console.log('   ↔️  Transferts: Réserve → Bar');
    console.log('   👥 Users: Gestion utilisateurs');
    
    if (successfulTests.length === testResults.length) {
      console.log('\n🎉 TOUS LES ENDPOINTS FONCTIONNENT!');
      console.log('   → Les accès à la base de données sont corrects');
      console.log('   → Vous pouvez tester les boutons dans l\'interface');
    } else {
      console.log('\n⚠️  CERTAINS ENDPOINTS NÉCESSITENT CORRECTION');
      console.log('   → Vérifiez les erreurs ci-dessus');
      console.log('   → Les boutons correspondants pourraient ne pas fonctionner');
    }
    
    console.log('\n🌐 Pour tester l\'interface:');
    console.log('   1. Ouvrez http://localhost:3000');
    console.log('   2. Connectez-vous: admin / admin123');
    console.log('   3. Testez chaque onglet et bouton');
    
  } catch (error) {
    console.error('❌ Erreur pendant les tests:', error);
  }
}

testAllEndpoints().then(() => process.exit(0)).catch(() => process.exit(1));