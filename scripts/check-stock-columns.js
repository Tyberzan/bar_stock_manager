const { sequelize } = require('../src/config/database');
const { Stock } = require('../src/models');

async function checkStockColumns() {
  try {
    console.log('🔍 Vérification des colonnes Stock...\n');
    
    // 1. Vérifier la structure de la table
    console.log('📋 Structure de la table Stocks:');
    const [results] = await sequelize.query("PRAGMA table_info(Stocks);");
    
    results.forEach(column => {
      console.log(`   - ${column.name}: ${column.type} (nullable: ${column.notnull === 0})`);
    });
    
    // 2. Tester un stock spécifique
    console.log('\n📊 Test d\'un stock spécifique (Bar Terrasse, Coca-Cola):');
    const testStock = await Stock.findOne({
      where: { barId: 2 },
      include: [
        { model: require('../src/models').Bar },
        { model: require('../src/models').Product },
        { model: require('../src/models').Format }
      ]
    });
    
    if (testStock) {
      console.log('   Stock trouvé:', {
        id: testStock.id,
        barId: testStock.barId,
        currentQuantity: testStock.currentQuantity,
        minThreshold: testStock.minThreshold,
        maxThreshold: testStock.maxThreshold,
        // Vérifier les anciennes colonnes
        minQuantity: testStock.minQuantity,
        idealQuantity: testStock.idealQuantity,
        barName: testStock.Bar?.name,
        productName: testStock.Product?.name
      });
      
      // Vérifier si les colonnes sont null ou undefined
      console.log('\n🔍 Analyse des valeurs:');
      console.log(`   - minThreshold: ${testStock.minThreshold} (type: ${typeof testStock.minThreshold})`);
      console.log(`   - maxThreshold: ${testStock.maxThreshold} (type: ${typeof testStock.maxThreshold})`);
      console.log(`   - minQuantity: ${testStock.minQuantity} (type: ${typeof testStock.minQuantity})`);
      console.log(`   - idealQuantity: ${testStock.idealQuantity} (type: ${typeof testStock.idealQuantity})`);
      
    } else {
      console.log('   ❌ Aucun stock trouvé pour Bar Terrasse');
    }
    
    // 3. Tester l'API directement
    console.log('\n🌐 Test API GET /stocks?barId=2:');
    const stockController = require('../src/controllers/stockController');
    
    const mockReq = { query: { barId: '2' } };
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
    
    if (mockRes.jsonData?.data?.[0]) {
      const apiStock = mockRes.jsonData.data[0];
      console.log('   Premier stock de l\'API:', {
        id: apiStock.id,
        currentQuantity: apiStock.currentQuantity,
        minThreshold: apiStock.minThreshold,
        maxThreshold: apiStock.maxThreshold,
        productName: apiStock.Product?.name,
        barName: apiStock.Bar?.name
      });
      
      console.log('\n🎯 DIAGNOSTIC:');
      if (apiStock.minThreshold === null || apiStock.minThreshold === undefined) {
        console.log('❌ PROBLÈME: minThreshold est null/undefined dans l\'API');
      } else {
        console.log('✅ minThreshold OK dans l\'API:', apiStock.minThreshold);
      }
      
      if (apiStock.maxThreshold === null || apiStock.maxThreshold === undefined) {
        console.log('❌ PROBLÈME: maxThreshold est null/undefined dans l\'API');
      } else {
        console.log('✅ maxThreshold OK dans l\'API:', apiStock.maxThreshold);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

checkStockColumns().then(() => process.exit(0)).catch(() => process.exit(1));