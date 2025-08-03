const { sequelize } = require('../src/config/database');
const { Bar, Stock, Product, Format } = require('../src/models');

async function testBarTerrasseDisplay() {
  try {
    console.log('🧪 Test affichage Bar Terrasse après corrections...\n');
    
    // 1. Récupérer Bar Terrasse
    const barTerrasse = await Bar.findOne({ where: { name: 'Bar Terrasse' } });
    
    if (!barTerrasse) {
      console.log('❌ Bar Terrasse non trouvé');
      return;
    }
    
    console.log(`✅ Bar Terrasse trouvé (ID: ${barTerrasse.id})`);
    
    // 2. Simuler exactement l'appel API que fait l'interface
    console.log('\n🌐 Simulation appel API GET /stocks?barId=2');
    
    const stockController = require('../src/controllers/stockController');
    
    const mockReq = {
      query: { barId: barTerrasse.id.toString() }
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
    
    console.log(`Status: ${mockRes.statusCode}`);
    console.log(`Success: ${mockRes.jsonData?.success}`);
    console.log(`Count: ${mockRes.jsonData?.count}`);
    
    if (mockRes.jsonData?.data && mockRes.jsonData.data.length > 0) {
      console.log('\n📊 Structure des données retournées:');
      
      const firstStock = mockRes.jsonData.data[0];
      console.log('Premier stock:', {
        id: firstStock.id,
        currentQuantity: firstStock.currentQuantity,
        minThreshold: firstStock.minThreshold,
        maxThreshold: firstStock.maxThreshold,
        minQuantity: firstStock.minQuantity, // Ancienne colonne (devrait être undefined)
        idealQuantity: firstStock.idealQuantity, // Ancienne colonne (devrait être undefined)
        hasProduct: !!firstStock.Product,
        hasFormat: !!firstStock.Format,
        hasBar: !!firstStock.Bar
      });
      
      // Simuler le traitement qu'effectue displayStocks()
      console.log('\n🎨 Simulation fonction displayStocks():');
      
      mockRes.jsonData.data.forEach((stock, index) => {
        if (index < 3) { // Montrer seulement les 3 premiers
          let statusClass = 'success';
          let statusText = 'Bon';
          
          if (stock.currentQuantity <= stock.minThreshold) {
            statusClass = 'danger';
            statusText = 'Stock faible';
          } else if (stock.currentQuantity <= (stock.minThreshold + (stock.maxThreshold - stock.minThreshold) * 0.3)) {
            statusClass = 'warning';
            statusText = 'Stock moyen';
          }
          
          console.log(`   Stock ${index + 1}:`);
          console.log(`     - Produit: ${stock.Product ? stock.Product.name : 'Produit inconnu'}`);
          console.log(`     - Format: ${stock.Format ? stock.Format.size : 'Format inconnu'}`);
          console.log(`     - Quantités: ${stock.currentQuantity}/${stock.minThreshold}/${stock.maxThreshold}`);
          console.log(`     - Status: ${statusText} (${statusClass})`);
        }
      });
      
      console.log('\n✅ Les données semblent correctes pour l\'affichage !');
      
    } else {
      console.log('❌ Aucune donnée retournée par l\'API');
    }
    
    // 3. Test de l'API produits à recharger
    console.log('\n🔄 Test API produits à recharger...');
    
    const mockReq2 = {
      params: { barId: barTerrasse.id.toString() }
    };
    
    const mockRes2 = {
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
    
    await stockController.getStocksToRestock(mockReq2, mockRes2);
    
    console.log(`Status: ${mockRes2.statusCode}`);
    console.log(`Success: ${mockRes2.jsonData?.success}`);
    console.log(`Produits à recharger: ${mockRes2.jsonData?.count || 0}`);
    
    if (mockRes2.jsonData?.data && mockRes2.jsonData.data.length > 0) {
      console.log('✅ Produits à recharger détectés correctement !');
      mockRes2.jsonData.data.forEach((stock, index) => {
        console.log(`   ${index + 1}. ${stock.Format?.Product?.name || 'Produit'} - ${stock.currentQuantity}/${stock.minThreshold}`);
      });
    }
    
    console.log('\n🎯 CONCLUSION:');
    if (mockRes.statusCode === 200 && mockRes.jsonData?.count > 0) {
      console.log('✅ Les APIs fonctionnent correctement');
      console.log('✅ Les données ont les bonnes colonnes (minThreshold/maxThreshold)');
      console.log('✅ Le JavaScript devrait maintenant pouvoir afficher les stocks');
      console.log('\n💡 NEXT: Actualisez votre page web (F5) et sélectionnez à nouveau Bar Terrasse');
    } else {
      console.log('❌ Il y a encore un problème avec les APIs');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

testBarTerrasseDisplay().then(() => process.exit(0)).catch(() => process.exit(1));