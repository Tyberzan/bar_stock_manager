const { sequelize } = require('../src/config/database');
const { 
  Company, Bar, Product, Format, Stock, Reserve, ReserveStock, 
  User, StockHistory, ReserveTransfer 
} = require('../src/models');

async function debugBarTerrasse() {
  try {
    console.log('🔍 DEBUG Bar Terrasse - Problème interface utilisateur\n');
    
    // 1. Trouver le Bar Terrasse
    const barTerrasse = await Bar.findOne({ 
      where: { name: 'Bar Terrasse' },
      include: [Company]
    });
    
    if (!barTerrasse) {
      console.log('❌ Bar Terrasse non trouvé dans la base de données');
      return;
    }
    
    console.log(`✅ Bar Terrasse trouvé:`);
    console.log(`   - ID: ${barTerrasse.id}`);
    console.log(`   - Nom: ${barTerrasse.name}`);
    console.log(`   - Entreprise: ${barTerrasse.Company ? barTerrasse.Company.name : 'Non définie'}`);
    
    // 2. Vérifier les stocks de ce bar
    console.log('\n📊 Stocks du Bar Terrasse:');
    
    const stocks = await Stock.findAll({
      where: { barId: barTerrasse.id },
      include: [
        {
          model: Product,
          attributes: ['id', 'name', 'category']
        },
        {
          model: Format,
          attributes: ['id', 'size', 'volume', 'packaging']
        }
      ]
    });
    
    console.log(`   Nombre de stocks: ${stocks.length}`);
    
    if (stocks.length === 0) {
      console.log('❌ PROBLÈME: Aucun stock trouvé pour Bar Terrasse');
      console.log('   → C\'est pourquoi l\'interface affiche "Aucun stock trouvé"');
      
      // Vérifier si d'autres bars ont des stocks
      const allStocks = await Stock.findAll({ include: [Bar] });
      console.log(`\n📊 Stocks totaux dans la base: ${allStocks.length}`);
      
      if (allStocks.length > 0) {
        console.log('   Répartition par bar:');
        const stocksByBar = {};
        allStocks.forEach(stock => {
          const barName = stock.Bar ? stock.Bar.name : 'Bar inconnu';
          stocksByBar[barName] = (stocksByBar[barName] || 0) + 1;
        });
        
        Object.entries(stocksByBar).forEach(([barName, count]) => {
          console.log(`   - ${barName}: ${count} stocks`);
        });
      }
    } else {
      console.log('   Détails des stocks:');
      stocks.forEach((stock, index) => {
        const productName = stock.Product ? stock.Product.name : 'Produit inconnu';
        const formatInfo = stock.Format ? `${stock.Format.size} ${stock.Format.packaging}` : 'Format inconnu';
        console.log(`   ${index + 1}. ${productName} (${formatInfo}): ${stock.currentQuantity}/${stock.minThreshold}`);
      });
    }
    
    // 3. Simuler l'appel API que fait l'interface
    console.log('\n🌐 Test des appels API que fait l\'interface:');
    
    // Test 1: GET /stocks?barId=X (pour le tableau)
    console.log(`\n   Test 1: GET /stocks?barId=${barTerrasse.id}`);
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
      
      if (mockRes.jsonData?.data) {
        console.log(`   Données retournées: ${mockRes.jsonData.data.length} stocks`);
      }
      
    } catch (error) {
      console.log(`   ❌ Erreur API stocks: ${error.message}`);
    }
    
    // Test 2: GET /stocks/restock/:barId (pour les produits à recharger)
    console.log(`\n   Test 2: GET /stocks/restock/${barTerrasse.id}`);
    try {
      const stockController = require('../src/controllers/stockController');
      
      const mockReq = {
        params: { barId: barTerrasse.id.toString() }
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
      
      console.log(`   Status: ${mockRes.statusCode}`);
      console.log(`   Success: ${mockRes.jsonData?.success}`);
      console.log(`   Count: ${mockRes.jsonData?.count || 0}`);
      
      if (mockRes.jsonData?.error) {
        console.log(`   ❌ Erreur: ${mockRes.jsonData.error}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Erreur API restock: ${error.message}`);
    }
    
    // 4. Recommandations de correction
    console.log('\n🔧 RECOMMANDATIONS:');
    
    if (stocks.length === 0) {
      console.log('1. ❌ Pas de stocks pour Bar Terrasse');
      console.log('   → Solution: Créer des stocks pour ce bar');
      console.log('   → Commande: Voir script de correction ci-dessous');
    }
    
    console.log('2. 🔍 Vérifier les logs du serveur pendant que vous utilisez l\'interface');
    console.log('3. 🌐 Ouvrir les DevTools du navigateur (F12) → onglet Console');
    console.log('4. 🔍 Onglet Network pour voir les appels API et leurs réponses');
    
    // 5. Script de correction automatique
    console.log('\n🛠️ CORRECTION AUTOMATIQUE:');
    
    if (stocks.length === 0) {
      console.log('Création de stocks pour Bar Terrasse...');
      
      // Récupérer quelques formats disponibles
      const availableFormats = await Format.findAll({
        include: [Product],
        limit: 5
      });
      
      if (availableFormats.length > 0) {
        console.log(`Formats disponibles: ${availableFormats.length}`);
        
        for (const format of availableFormats) {
          // Créer un stock avec une quantité faible pour tester les produits à recharger
          const quantity = Math.floor(Math.random() * 15) + 5; // 5-20
          
          await Stock.create({
            barId: barTerrasse.id,
            productId: format.productId,
            formatId: format.id,
            currentQuantity: quantity,
            minThreshold: 10,
            maxThreshold: 50
          });
          
          const productName = format.Product ? format.Product.name : 'Produit';
          console.log(`   ✅ Stock créé: ${productName} (${format.size}) - ${quantity}/10`);
        }
        
        console.log('\n🎉 Stocks créés pour Bar Terrasse!');
        console.log('   → Actualisez la page web pour voir les changements');
        
      } else {
        console.log('❌ Aucun format disponible pour créer des stocks');
      }
    }
    
    console.log('\n🌐 Après correction, testez:');
    console.log('1. Actualisez la page (F5)');
    console.log('2. Sélectionnez à nouveau "Bar Terrasse"');
    console.log('3. Le tableau devrait maintenant afficher des stocks');
    console.log('4. La section "Produits à recharger" devrait fonctionner');
    
  } catch (error) {
    console.error('❌ Erreur pendant le debug:', error);
  }
}

debugBarTerrasse().then(() => process.exit(0)).catch(() => process.exit(1));