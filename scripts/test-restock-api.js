const { sequelize } = require('../src/config/database');
const { Bar, Stock, Product, Format } = require('../src/models');

async function testRestockAPI() {
  try {
    console.log('🧪 Test de l\'API des produits à recharger...\n');
    
    // 1. Trouver le bar créé
    const bar = await Bar.findOne({ where: { name: 'Bar Principal' } });
    if (!bar) {
      console.log('❌ Bar non trouvé');
      return;
    }
    
    console.log(`✅ Bar trouvé: ${bar.name} (ID: ${bar.id})`);
    
    // 2. Tester la logique directement dans la base
    console.log('\n📊 Test de la logique SQL...');
    
    const stocksToRestock = await Stock.findAll({
      where: {
        barId: bar.id,
        currentQuantity: {
          [sequelize.Sequelize.Op.lt]: sequelize.col('minThreshold')
        }
      },
      include: [
        {
          model: Format,
          include: [Product]
        }
      ]
    });
    
    console.log(`📉 Stocks à recharger trouvés: ${stocksToRestock.length}`);
    
    stocksToRestock.forEach(stock => {
      const productName = stock.Product ? stock.Product.name : 'Produit inconnu';
      const formatSize = stock.Format ? stock.Format.size : 'Format inconnu';
      console.log(`   - ${productName} (${formatSize}): ${stock.currentQuantity}/${stock.minThreshold}`);
    });
    
    // 3. Tester l'endpoint complet (simuler l'appel HTTP)
    console.log('\n🌐 Test de l\'endpoint API...');
    
    // Simuler l'appel au contrôleur
    const stockController = require('../src/controllers/stockController');
    
    const mockReq = {
      params: { barId: bar.id.toString() }
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
    
    await stockController.getStocksToRestock(mockReq, mockRes);
    
    console.log(`🔍 Status Code: ${mockRes.statusCode}`);
    console.log(`📦 Réponse API:`, {
      success: mockRes.jsonData.success,
      count: mockRes.jsonData.count,
      productsFound: mockRes.jsonData.data ? mockRes.jsonData.data.length : 0
    });
    
    if (mockRes.statusCode === 200 && mockRes.jsonData.success) {
      console.log('\n🎉 L\'API fonctionne parfaitement !');
      
      if (mockRes.jsonData.count > 0) {
        console.log(`✅ ${mockRes.jsonData.count} produits à recharger détectés`);
        console.log('\n📋 Détails des produits:');
        mockRes.jsonData.data.forEach((stock, index) => {
          const productName = stock.Format?.Product?.name || 'Produit inconnu';
          const formatSize = stock.Format?.size || 'Format inconnu';
          console.log(`   ${index + 1}. ${productName} (${formatSize})`);
          console.log(`      Stock: ${stock.currentQuantity}/${stock.minThreshold}`);
          console.log(`      Status: ${stock.currentQuantity <= stock.minThreshold ? '🔴 À recharger' : '✅ OK'}`);
        });
      } else {
        console.log('📝 Aucun produit à recharger (tous les stocks sont OK)');
      }
    } else {
      console.log('❌ L\'API a retourné une erreur:');
      console.log(mockRes.jsonData);
    }
    
    // 4. Instructions pour tester dans le navigateur
    console.log('\n🌐 Pour tester dans le navigateur:');
    console.log('1. Ouvrez http://localhost:3000');
    console.log('2. Connectez-vous avec: admin / admin123');
    console.log('3. Allez dans l\'onglet "Stock"');
    console.log(`4. Sélectionnez le bar "${bar.name}"`);
    console.log('5. La section "Produits à recharger" devrait apparaître avec les produits trouvés');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

testRestockAPI().then(() => process.exit(0)).catch(() => process.exit(1));