const { sequelize } = require('../src/config/database');
const { Bar } = require('../src/models');

async function testProductRelationFix() {
  try {
    console.log('🧪 Test correction relation Product...\n');
    
    // Tester l'API avec Bar Terrasse après correction
    const barTerrasse = await Bar.findOne({ where: { name: 'Bar Terrasse' } });
    
    if (!barTerrasse) {
      console.log('❌ Bar Terrasse non trouvé');
      return;
    }
    
    console.log(`✅ Test avec Bar Terrasse (ID: ${barTerrasse.id})`);
    
    // Test de l'API corrigée
    console.log('\n🌐 Test API GET /stocks?barId=2 (après correction):');
    
    try {
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
      
      console.log(`   Status: ${mockRes.statusCode}`);
      console.log(`   Success: ${mockRes.jsonData?.success}`);
      console.log(`   Count: ${mockRes.jsonData?.count || 0}`);
      
      if (mockRes.jsonData?.data && mockRes.jsonData.data.length > 0) {
        // Analyser le premier stock pour voir si Product est maintenant chargé
        const firstStock = mockRes.jsonData.data[0];
        
        console.log('\n📊 Structure du premier stock (après correction):');
        console.log({
          id: firstStock.id,
          currentQuantity: firstStock.currentQuantity,
          minThreshold: firstStock.minThreshold,
          maxThreshold: firstStock.maxThreshold,
          // Relations directes
          hasBar: !!firstStock.Bar,
          barName: firstStock.Bar?.name,
          hasProduct: !!firstStock.Product,
          productName: firstStock.Product?.name,
          productCategory: firstStock.Product?.category,
          hasFormat: !!firstStock.Format,
          formatSize: firstStock.Format?.size,
          // Relations imbriquées
          hasFormatProduct: !!firstStock.Format?.Product,
          formatProductName: firstStock.Format?.Product?.name
        });
        
        // Vérifier si on a maintenant les deux façons d'accéder au Product
        const directProduct = firstStock.Product;
        const formatProduct = firstStock.Format?.Product;
        
        if (directProduct && formatProduct) {
          console.log('\n✅ SUCCÈS: Product accessible de deux façons!');
          console.log(`   - Direct: ${directProduct.name}`);
          console.log(`   - Via Format: ${formatProduct.name}`);
        } else if (directProduct) {
          console.log('\n✅ SUCCÈS: Product accessible directement!');
          console.log(`   - Direct: ${directProduct.name}`);
        } else if (formatProduct) {
          console.log('\n⚠️  Product accessible seulement via Format');
          console.log(`   - Via Format: ${formatProduct.name}`);
        } else {
          console.log('\n❌ ÉCHEC: Product toujours pas accessible');
        }
        
        // Simuler displayStocks avec les nouvelles données
        console.log('\n🎨 Simulation displayStocks() avec nouvelles données:');
        
        mockRes.jsonData.data.slice(0, 3).forEach((stock, index) => {
          const productName = stock.Product ? stock.Product.name : 
                             (stock.Format?.Product ? stock.Format.Product.name : 'Produit inconnu');
          const formatInfo = stock.Format ? `${stock.Format.size} ${stock.Format.packaging || ''}` : 'Format inconnu';
          const barName = stock.Bar ? stock.Bar.name : 'Bar inconnu';
          
          let statusClass = 'success';
          let statusText = 'Bon';
          
          if (stock.currentQuantity <= stock.minThreshold) {
            statusClass = 'danger';
            statusText = 'Stock faible';
          } else if (stock.currentQuantity <= (stock.minThreshold + (stock.maxThreshold - stock.minThreshold) * 0.3)) {
            statusClass = 'warning';
            statusText = 'Stock moyen';
          }
          
          console.log(`   Ligne ${index + 1} du tableau:`);
          console.log(`     Bar: ${barName}`);
          console.log(`     Produit: ${productName}`);
          console.log(`     Format: ${formatInfo}`);
          console.log(`     Quantités: ${stock.currentQuantity}/${stock.minThreshold}/${stock.maxThreshold}`);
          console.log(`     Statut: ${statusText} (${statusClass})`);
        });
        
        if (mockRes.jsonData.data.every(stock => stock.Product || stock.Format?.Product)) {
          console.log('\n🎉 PARFAIT! Tous les stocks ont maintenant accès au Product');
          console.log('   → Le tableau devrait maintenant s\'afficher correctement');
          console.log('   → Actualisez votre page (F5) et testez Bar Terrasse');
        } else {
          console.log('\n⚠️  Certains stocks n\'ont toujours pas accès au Product');
        }
        
      } else {
        console.log('❌ Aucune donnée retournée par l\'API');
      }
      
    } catch (error) {
      console.log(`❌ Erreur API: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

testProductRelationFix().then(() => process.exit(0)).catch(() => process.exit(1));