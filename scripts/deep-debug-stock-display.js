const { sequelize } = require('../src/config/database');
const { 
  Company, Bar, Product, Format, Stock, Reserve, ReserveStock, 
  User, StockHistory, ReserveTransfer 
} = require('../src/models');

async function deepDebugStockDisplay() {
  try {
    console.log('🔍 DIAGNOSTIC APPROFONDI - Problème affichage stocks\n');
    console.log('=' .repeat(70));
    
    // 1. Lister TOUS les bars disponibles
    console.log('📋 ÉTAPE 1: Tous les bars dans la base');
    const allBars = await Bar.findAll({
      include: [Company],
      order: [['id', 'ASC']]
    });
    
    console.log(`   Total bars: ${allBars.length}`);
    allBars.forEach(bar => {
      console.log(`   - ID: ${bar.id}, Nom: "${bar.name}", Entreprise: ${bar.Company ? bar.Company.name : 'N/A'}`);
    });
    
    // 2. Vérifier les stocks pour CHAQUE bar
    console.log('\n📊 ÉTAPE 2: Stocks par bar');
    
    for (const bar of allBars) {
      console.log(`\n   🍺 ${bar.name} (ID: ${bar.id}):`);
      
      const stockCount = await Stock.count({ where: { barId: bar.id } });
      console.log(`      Nombre de stocks: ${stockCount}`);
      
      if (stockCount > 0) {
        // Test API direct pour ce bar
        console.log(`      🌐 Test API GET /stocks?barId=${bar.id}:`);
        
        try {
          const stockController = require('../src/controllers/stockController');
          
          const mockReq = {
            query: { barId: bar.id.toString() }
          };
          
          const mockRes = {
            statusCode: null,
            jsonData: null,
            status: function(code) {
              this.statusCode = code;
              return this;
            },
            json: function(data) {
              this.jsonData = data;
              return this;
            }
          };
          
          await stockController.getAllStocks(mockReq, mockRes);
          
          console.log(`         Status: ${mockRes.statusCode}`);
          console.log(`         Success: ${mockRes.jsonData?.success}`);
          console.log(`         Count: ${mockRes.jsonData?.count || 0}`);
          
          if (mockRes.jsonData?.data && mockRes.jsonData.data.length > 0) {
            // Analyser la structure du premier stock
            const firstStock = mockRes.jsonData.data[0];
            console.log(`         Premier stock:`, {
              id: firstStock.id,
              barId: firstStock.barId,
              currentQuantity: firstStock.currentQuantity,
              minThreshold: firstStock.minThreshold,
              maxThreshold: firstStock.maxThreshold,
              hasBar: !!firstStock.Bar,
              barName: firstStock.Bar?.name,
              hasProduct: !!firstStock.Product,
              productName: firstStock.Product?.name,
              hasFormat: !!firstStock.Format,
              formatSize: firstStock.Format?.size,
              // Vérifier si les anciennes colonnes existent encore
              hasOldMinQuantity: firstStock.minQuantity !== undefined,
              hasOldIdealQuantity: firstStock.idealQuantity !== undefined
            });
            
            // Vérifier si toutes les relations sont chargées
            const missingRelations = [];
            if (!firstStock.Bar) missingRelations.push('Bar');
            if (!firstStock.Product) missingRelations.push('Product');  
            if (!firstStock.Format) missingRelations.push('Format');
            
            if (missingRelations.length > 0) {
              console.log(`         ⚠️  Relations manquantes: ${missingRelations.join(', ')}`);
            } else {
              console.log(`         ✅ Toutes les relations chargées`);
            }
            
          } else {
            console.log(`         ❌ Aucune donnée retournée`);
          }
          
        } catch (apiError) {
          console.log(`         ❌ Erreur API: ${apiError.message}`);
        }
        
      } else {
        console.log(`      ❌ Aucun stock pour ce bar`);
      }
    }
    
    // 3. Vérifier les relations dans la base de données
    console.log('\n🔗 ÉTAPE 3: Vérification des relations');
    
    const stocksWithRelations = await Stock.findAll({
      include: [
        { model: Bar, required: false },
        { model: Product, required: false },
        { model: Format, required: false }
      ],
      limit: 5
    });
    
    console.log(`   Stocks avec relations testés: ${stocksWithRelations.length}`);
    
    stocksWithRelations.forEach((stock, index) => {
      console.log(`   Stock ${index + 1}:`, {
        id: stock.id,
        barId: stock.barId,
        productId: stock.productId,
        formatId: stock.formatId,
        barLoaded: !!stock.Bar,
        productLoaded: !!stock.Product,
        formatLoaded: !!stock.Format
      });
    });
    
    // 4. Vérifier spécifiquement le contrôleur Stock
    console.log('\n🎯 ÉTAPE 4: Test du contrôleur Stock avec relations');
    
    try {
      const stocksFromController = await Stock.findAll({
        include: [
          {
            model: Format,
            include: [Product]
          },
          Bar
        ],
        limit: 3
      });
      
      console.log(`   Stocks du contrôleur: ${stocksFromController.length}`);
      
      stocksFromController.forEach((stock, index) => {
        console.log(`   Stock ${index + 1} détaillé:`);
        console.log(`     - ID: ${stock.id}`);
        console.log(`     - Bar: ${stock.Bar ? stock.Bar.name : 'MANQUANT'}`);
        console.log(`     - Format: ${stock.Format ? stock.Format.size : 'MANQUANT'}`);
        console.log(`     - Produit: ${stock.Format?.Product ? stock.Format.Product.name : 'MANQUANT'}`);
        console.log(`     - Quantités: ${stock.currentQuantity}/${stock.minThreshold}/${stock.maxThreshold}`);
      });
      
    } catch (controllerError) {
      console.log(`   ❌ Erreur contrôleur: ${controllerError.message}`);
    }
    
    // 5. Tester différents appels API
    console.log('\n🌐 ÉTAPE 5: Tests APIs multiples');
    
    const testCases = [
      { description: 'Tous les stocks', url: '/stocks' },
      { description: 'Stocks Bar ID 1', url: '/stocks?barId=1' },
      { description: 'Stocks Bar ID 2', url: '/stocks?barId=2' },
      { description: 'Produits à recharger Bar 1', url: '/stocks/restock/1' },
      { description: 'Produits à recharger Bar 2', url: '/stocks/restock/2' }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n   🧪 Test: ${testCase.description}`);
      
      try {
        const stockController = require('../src/controllers/stockController');
        
        let mockReq, handler;
        
        if (testCase.url.includes('/restock/')) {
          const barId = testCase.url.split('/').pop();
          mockReq = { params: { barId } };
          handler = stockController.getStocksToRestock;
        } else {
          const queryParams = {};
          if (testCase.url.includes('barId=')) {
            queryParams.barId = testCase.url.split('barId=')[1];
          }
          mockReq = { query: queryParams };
          handler = stockController.getAllStocks;
        }
        
        const mockRes = {
          statusCode: null,
          jsonData: null,
          status: function(code) {
            this.statusCode = code;
            return this;
          },
          json: function(data) {
            this.jsonData = data;
            return this;
          }
        };
        
        await handler(mockReq, mockRes);
        
        console.log(`      Status: ${mockRes.statusCode}`);
        console.log(`      Success: ${mockRes.jsonData?.success}`);
        console.log(`      Count: ${mockRes.jsonData?.count || 0}`);
        
        if (mockRes.jsonData?.error) {
          console.log(`      ❌ Erreur: ${mockRes.jsonData.error}`);
        }
        
      } catch (testError) {
        console.log(`      ❌ Erreur test: ${testError.message}`);
      }
    }
    
    // 6. Recommandations
    console.log('\n🛠️  ÉTAPE 6: Recommandations de correction');
    
    const totalStocks = await Stock.count();
    const totalBars = await Bar.count();
    
    if (totalStocks === 0) {
      console.log('❌ PROBLÈME: Aucun stock dans la base de données');
      console.log('   → Exécutez: node scripts/populate-full-database.js');
    } else if (totalBars === 0) {
      console.log('❌ PROBLÈME: Aucun bar dans la base de données');
      console.log('   → Exécutez: node scripts/populate-full-database.js');
    } else {
      console.log('✅ Données présentes dans la base');
      console.log(`   → ${totalStocks} stocks, ${totalBars} bars`);
      
      // Vérifier les relations
      const stocksWithoutBar = await Stock.count({ where: { barId: null } });
      const stocksWithoutFormat = await Stock.count({ where: { formatId: null } });
      const stocksWithoutProduct = await Stock.count({ where: { productId: null } });
      
      if (stocksWithoutBar > 0) console.log(`   ⚠️  ${stocksWithoutBar} stocks sans bar`);
      if (stocksWithoutFormat > 0) console.log(`   ⚠️  ${stocksWithoutFormat} stocks sans format`);
      if (stocksWithoutProduct > 0) console.log(`   ⚠️  ${stocksWithoutProduct} stocks sans produit`);
      
      if (stocksWithoutBar === 0 && stocksWithoutFormat === 0 && stocksWithoutProduct === 0) {
        console.log('✅ Toutes les relations semblent correctes');
        console.log('   → Le problème est probablement dans le JavaScript côté client');
        console.log('   → Ouvrez F12 → Console dans votre navigateur pour voir les erreurs');
      }
    }
    
    console.log('\n📱 ÉTAPE 7: Vérifications côté navigateur recommandées');
    console.log('1. Ouvrez F12 → Console');
    console.log('2. Rechargez la page (F5)');
    console.log('3. Sélectionnez un bar dans le dropdown');
    console.log('4. Regardez les erreurs JavaScript');
    console.log('5. Onglet Network → Voir les appels API et leurs réponses');
    
  } catch (error) {
    console.error('❌ Erreur pendant le diagnostic:', error);
  }
}

deepDebugStockDisplay().then(() => process.exit(0)).catch(() => process.exit(1));