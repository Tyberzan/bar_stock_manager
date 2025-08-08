const fs = require('fs');
const path = require('path');

// Script pour corriger les noms de colonnes Stock dans tout le codebase
const corrections = [
  // Corrections pour le JavaScript client (app.js)
  {
    file: 'public/js/app.js',
    replacements: [
      { from: 'stock.minQuantity', to: 'stock.minThreshold' },
      { from: 'stock.idealQuantity', to: 'stock.maxThreshold' },
      { from: 'item.idealQuantity', to: 'item.maxThreshold' },
      { from: 'reserve.minQuantity', to: 'reserve.minQuantity' }, // ReserveStock garde ses noms
      { from: 'stock.idealQuantity', to: 'stock.maxThreshold' }
    ]
  },
  
  // Corrections pour le contrôleur de stocks
  {
    file: 'src/controllers/stockController.js',
    replacements: [
      { from: 'minQuantity', to: 'minThreshold' },
      { from: 'idealQuantity', to: 'maxThreshold' },
      { from: 'stock.minQuantity', to: 'stock.minThreshold' },
      { from: 'stock.idealQuantity', to: 'stock.maxThreshold' }
    ]
  }
];

async function fixColumnNames() {
  try {
    console.log('🔧 Correction des noms de colonnes Stock...\n');
    
    for (const correction of corrections) {
      const filePath = path.join(__dirname, '..', correction.file);
      
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Fichier non trouvé: ${correction.file}`);
        continue;
      }
      
      console.log(`📝 Correction de: ${correction.file}`);
      
      let content = fs.readFileSync(filePath, 'utf8');
      let changes = 0;
      
      for (const replacement of correction.replacements) {
        const regex = new RegExp(replacement.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const matches = content.match(regex);
        
        if (matches) {
          content = content.replace(regex, replacement.to);
          changes += matches.length;
          console.log(`   ✅ ${replacement.from} → ${replacement.to} (${matches.length} occurences)`);
        }
      }
      
      if (changes > 0) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`   📄 ${changes} changements sauvegardés\n`);
      } else {
        console.log(`   📄 Aucun changement nécessaire\n`);
      }
    }
    
    // Créer un correctif spécifique pour app.js
    console.log('🎯 Corrections spécifiques pour app.js...');
    
    const appJsPath = path.join(__dirname, '..', 'public/js/app.js');
    let appContent = fs.readFileSync(appJsPath, 'utf8');
    
    // Corrections spécifiques pour les lignes problématiques
    const specificFixes = [
      {
        from: 'const minQty = stock.minQuantity || 0;',
        to: 'const minQty = stock.minThreshold || 0;'
      },
      {
        from: 'const idealQty = stock.idealQuantity || 0;',
        to: 'const idealQty = stock.maxThreshold || 0;'
      },
      {
        from: 'const idealQuantity = stock.idealQuantity || 30;',
        to: 'const idealQuantity = stock.maxThreshold || 30;'
      },
      {
        from: 'toRestock = idealQuantity;',
        to: 'toRestock = idealQuantity;' // Cette ligne est OK
      },
      {
        from: 'toRestock = Math.max(0, idealQuantity - currentQuantity);',
        to: 'toRestock = Math.max(0, idealQuantity - currentQuantity);' // Cette ligne est OK
      },
      {
        from: '<td>${item.idealQuantity}</td>',
        to: '<td>${item.maxThreshold}</td>'
      },
      {
        from: 'Stock actuel: ${currentQty} (Min: ${stock.minQuantity}, Max: ${stock.idealQuantity})',
        to: 'Stock actuel: ${currentQty} (Min: ${stock.minThreshold}, Max: ${stock.maxThreshold})'
      }
    ];
    
    let specificChanges = 0;
    for (const fix of specificFixes) {
      if (appContent.includes(fix.from)) {
        appContent = appContent.replace(new RegExp(fix.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.to);
        specificChanges++;
        console.log(`   ✅ Correction spécifique appliquée`);
      }
    }
    
    if (specificChanges > 0) {
      fs.writeFileSync(appJsPath, appContent, 'utf8');
      console.log(`   📄 ${specificChanges} corrections spécifiques sauvegardées`);
    }
    
    console.log('\n🎉 Corrections terminées !');
    console.log('💡 Redémarrez le serveur et actualisez la page pour voir les changements');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

fixColumnNames();