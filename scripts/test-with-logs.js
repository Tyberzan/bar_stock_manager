const express = require('express');
const path = require('path');
const { sequelize } = require('../src/config/database');

async function testServerWithLogs() {
  try {
    console.log('🚀 [TEST] Démarrage du serveur avec logs détaillés activés...\n');
    
    // Test connexion base de données
    console.log('🔌 [TEST] Test connexion base de données...');
    await sequelize.authenticate();
    console.log('✅ [TEST] Base de données connectée\n');
    
    // Test structure des modèles
    console.log('📋 [TEST] Vérification des modèles...');
    const { Stock, Bar, Product, Format } = require('../src/models');
    
    const stockCount = await Stock.count();
    const barCount = await Bar.count();
    const productCount = await Product.count();
    const formatCount = await Format.count();
    
    console.log(`   - Stocks: ${stockCount}`);
    console.log(`   - Bars: ${barCount}`);
    console.log(`   - Produits: ${productCount}`);
    console.log(`   - Formats: ${formatCount}\n`);
    
    if (stockCount === 0 || barCount === 0) {
      console.log('⚠️ [TEST] Base de données vide - Recommandé: node scripts/populate-full-database.js\n');
    }
    
    // Test API direct avec logs
    console.log('🌐 [TEST] Test API avec logs (simulation navigateur)...');
    
    const stockController = require('../src/controllers/stockController');
    
    // Test 1: Tous les stocks
    console.log('\n   📊 Test 1: GET /api/stocks');
    const mockReq1 = { query: {} };
    const mockRes1 = createMockResponse();
    await stockController.getAllStocks(mockReq1, mockRes1);
    console.log(`      → Status: ${mockRes1.statusCode}, Count: ${mockRes1.jsonData?.count || 0}\n`);
    
    // Test 2: Stocks Bar Terrasse
    console.log('   📊 Test 2: GET /api/stocks?barId=2 (Bar Terrasse)');
    const mockReq2 = { query: { barId: '2' } };
    const mockRes2 = createMockResponse();
    await stockController.getAllStocks(mockReq2, mockRes2);
    console.log(`      → Status: ${mockRes2.statusCode}, Count: ${mockRes2.jsonData?.count || 0}`);
    
    if (mockRes2.jsonData?.data?.[0]) {
      const stock = mockRes2.jsonData.data[0];
      console.log('      → Premier stock:', {
        id: stock.id,
        productName: stock.Product?.name || 'MANQUANT',
        barName: stock.Bar?.name || 'MANQUANT',
        quantities: `${stock.currentQuantity}/${stock.minThreshold}/${stock.maxThreshold}`
      });
    }
    
    // Test 3: Produits à recharger
    console.log('\n   📊 Test 3: GET /api/stocks/restock/2 (Produits à recharger)');
    const mockReq3 = { params: { barId: '2' } };
    const mockRes3 = createMockResponse();
    await stockController.getStocksToRestock(mockReq3, mockRes3);
    console.log(`      → Status: ${mockRes3.statusCode}, Count: ${mockRes3.jsonData?.count || 0}\n`);
    
    // Instructions finales
    console.log('🎯 [TEST] INSTRUCTIONS POUR TESTER DANS LE NAVIGATEUR:\n');
    
    console.log('1. 📱 DÉMARRER LE SERVEUR:');
    console.log('   npm run dev\n');
    
    console.log('2. 🌐 OUVRIR DANS LE NAVIGATEUR:');
    console.log('   http://localhost:3000/stocks.html\n');
    
    console.log('3. 🔍 OUVRIR F12 → CONSOLE pour voir les logs:');
    console.log('   - Logs serveur: Dans la console où tourne "npm run dev"');
    console.log('   - Logs client: Dans F12 → Console du navigateur\n');
    
    console.log('4. 🧪 TESTER:');
    console.log('   - Sélectionner "Bar Terrasse" dans le dropdown');
    console.log('   - Regarder les logs serveur ET client');
    console.log('   - Noter tous les messages d\'erreur\n');
    
    console.log('📋 LOGS À SURVEILLER:');
    console.log('   SERVEUR (console npm run dev):');
    console.log('     🔍 [STOCK API] getAllStocks appelé');
    console.log('     📥 [STOCK API] Query params: { barId: "2" }');
    console.log('     📊 [STOCK API] Requête WHERE: { barId: "2" }');
    console.log('     ✅ [STOCK API] 8 stocks trouvés');
    console.log('     📤 [STOCK API] Envoi réponse 200 OK\n');
    
    console.log('   CLIENT (F12 → Console):');
    console.log('     🔍 [CLIENT] loadStocksTable appelé avec barId: 2');
    console.log('     📤 [CLIENT] Appel API: /stocks?barId=2');
    console.log('     📥 [CLIENT] Réponse API reçue: { success: true, count: 8 }');
    console.log('     🎨 [CLIENT] displayStocks appelé avec 8 stocks');
    console.log('     📊 [CLIENT] Affichage de 8 stocks\n');
    
    console.log('❌ EN CAS D\'ERREUR:');
    console.log('   - Copier TOUS les logs (serveur + client)');
    console.log('   - Noter à quelle étape ça échoue');
    console.log('   - Vérifier si "hasProduct: true" dans les logs\n');
    
    console.log('✅ [TEST] Configuration terminée - Le serveur est prêt avec logs détaillés !');
    
  } catch (error) {
    console.error('❌ [TEST] Erreur:', error);
  }
}

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
    }
  };
}

testServerWithLogs().then(() => process.exit(0)).catch(() => process.exit(1));