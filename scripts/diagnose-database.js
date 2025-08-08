const { sequelize } = require('../src/config/database');
const { 
  Company, Bar, Product, Format, Stock, Reserve, ReserveStock, 
  User, StockHistory, ReserveTransfer 
} = require('../src/models');

async function diagnoseDatabaseIssue() {
  try {
    console.log('🔍 Diagnostic complet de la base de données...\n');
    
    // Vérifier chaque table
    const tables = [
      { name: 'Companies', model: Company },
      { name: 'Bars', model: Bar },
      { name: 'Products', model: Product },
      { name: 'Formats', model: Format },
      { name: 'Stocks', model: Stock },
      { name: 'Reserves', model: Reserve },
      { name: 'ReserveStocks', model: ReserveStock },
      { name: 'Users', model: User }
    ];
    
    for (const table of tables) {
      try {
        const count = await table.model.count();
        const status = count > 0 ? '✅' : '❌';
        console.log(`${status} ${table.name}: ${count} enregistrements`);
        
        if (count > 0 && count <= 5) {
          const samples = await table.model.findAll({ limit: 3, raw: true });
          console.log(`   Échantillon:`, samples.map(s => s.name || s.username || s.id).join(', '));
        }
      } catch (error) {
        console.log(`❌ ${table.name}: ERREUR - ${error.message}`);
      }
    }
    
    console.log('\n🔍 Analyse des relations...');
    
    // Vérifier les relations critiques
    try {
      const barsWithCompany = await Bar.findAll({
        include: [{ model: Company }],
        limit: 3
      });
      console.log(`✅ Relations Bar-Company: ${barsWithCompany.length} bars avec entreprise`);
    } catch (error) {
      console.log(`❌ Relations Bar-Company: ERREUR - ${error.message}`);
    }
    
    try {
      const productsWithFormats = await Product.findAll({
        include: [{ model: Format }],
        limit: 3
      });
      console.log(`✅ Relations Product-Format: ${productsWithFormats.length} produits`);
      
      productsWithFormats.forEach(product => {
        console.log(`   - ${product.name}: ${product.Formats ? product.Formats.length : 0} formats`);
      });
    } catch (error) {
      console.log(`❌ Relations Product-Format: ERREUR - ${error.message}`);
    }
    
    try {
      const stocksWithDetails = await Stock.findAll({
        include: [
          { model: Bar },
          { model: Product },
          { model: Format }
        ],
        limit: 3
      });
      console.log(`✅ Relations Stock complètes: ${stocksWithDetails.length} stocks`);
    } catch (error) {
      console.log(`❌ Relations Stock complètes: ERREUR - ${error.message}`);
    }
    
    console.log('\n📊 Analyse des données pour "produits à recharger"...');
    
    // Simuler la logique de "produits à recharger"
    try {
      // Obtenir les stocks avec quantité faible
      const lowStocks = await sequelize.query(`
        SELECT 
          s.id,
          s.currentQuantity,
          s.minThreshold,
          s.maxThreshold,
          p.name as productName,
          b.name as barName
        FROM Stocks s
        LEFT JOIN Products p ON s.productId = p.id
        LEFT JOIN Bars b ON s.barId = b.id
        WHERE s.currentQuantity <= s.minThreshold
        LIMIT 10
      `, { type: sequelize.QueryTypes.SELECT });
      
      console.log(`📉 Stocks faibles trouvés: ${lowStocks.length}`);
      
      if (lowStocks.length > 0) {
        lowStocks.forEach(stock => {
          console.log(`   - ${stock.productName} (${stock.barName}): ${stock.currentQuantity}/${stock.minThreshold}`);
        });
      } else {
        console.log('   ⚠️ Aucun stock faible (normal si pas de stocks)');
      }
      
    } catch (error) {
      console.log(`❌ Analyse stocks faibles: ERREUR - ${error.message}`);
    }
    
    console.log('\n🔧 Recommandations:');
    
    const formatCount = await Format.count();
    const stockCount = await Stock.count();
    
    if (formatCount === 0) {
      console.log('❌ PROBLÈME: Aucun format de produit défini');
      console.log('   → Exécuter: node scripts/recreate-formats.js');
    }
    
    if (stockCount === 0) {
      console.log('❌ PROBLÈME: Aucun stock défini');
      console.log('   → Les "produits à recharger" ne peuvent pas apparaître');
      console.log('   → Créer des stocks via l\'interface ou scripts');
    }
    
    if (formatCount > 0 && stockCount > 0) {
      console.log('✅ Base de données semble correcte pour les produits à recharger');
    }
    
  } catch (error) {
    console.error('❌ Erreur durante diagnostic:', error);
  }
}

diagnoseDatabaseIssue().then(() => process.exit(0)).catch(() => process.exit(1));