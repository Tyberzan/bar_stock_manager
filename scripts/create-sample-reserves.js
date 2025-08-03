const fetch = require('node-fetch');

async function createSampleReserves() {
  const baseUrl = 'http://localhost:3000/api';
  
  console.log('🔄 Création de réserves de test via l\'API...\n');
  
  try {
    // D'abord, récupérer les formats disponibles
    console.log('📦 Récupération des formats...');
    const formatsResponse = await fetch(`${baseUrl}/formats`);
    
    if (!formatsResponse.ok) {
      console.log('❌ Impossible d\'accéder aux formats (authentification requise)');
      console.log('💡 Utilisez l\'interface web pour créer des réserves manuellement');
      return;
    }
    
    const formatsData = await formatsResponse.json();
    const formats = formatsData.data || formatsData;
    
    if (formats.length === 0) {
      console.log('❌ Aucun format trouvé');
      return;
    }
    
    console.log(`✅ ${formats.length} formats trouvés\n`);
    
    // Créer quelques réserves de test
    const sampleReserves = [
      {
        formatId: formats[0]?.id,
        quantity: 150,
        minQuantity: 20,
        maxQuantity: 200,
        location: 'Étagère A1',
        notes: 'Stock principal'
      },
      {
        formatId: formats[1]?.id,
        quantity: 80,
        minQuantity: 15,
        maxQuantity: 120,
        location: 'Étagère B2',
        notes: 'Réserve secondaire'
      },
      {
        formatId: formats[2]?.id,
        quantity: 5, // Stock faible
        minQuantity: 10,
        maxQuantity: 50,
        location: 'Étagère C1',
        notes: 'Stock faible - à recharger'
      }
    ];
    
    console.log('🏗️  Création des réserves...\n');
    
    for (const reserve of sampleReserves) {
      if (!reserve.formatId) continue;
      
      try {
        const response = await fetch(`${baseUrl}/reserves`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(reserve)
        });
        
        if (response.ok) {
          const result = await response.json();
          const productName = result.data?.Format?.Product?.name || 'Produit inconnu';
          const formatInfo = result.data?.Format?.size || 'Format inconnu';
          console.log(`✅ Réserve créée: ${productName} ${formatInfo} - ${reserve.quantity} unités`);
        } else {
          console.log(`⚠️  Erreur ${response.status} pour le format ${reserve.formatId}`);
        }
      } catch (error) {
        console.log(`❌ Erreur pour le format ${reserve.formatId}:`, error.message);
      }
    }
    
    console.log('\n🎉 Création des réserves de test terminée !');
    console.log('💡 Accédez à l\'onglet "Réserve" dans l\'interface pour les voir.');
    
  } catch (error) {
    console.error('💥 Erreur générale:', error.message);
    console.log('\n💡 Assurez-vous que:');
    console.log('  - Le serveur est démarré (npm run dev)');
    console.log('  - Vous êtes connecté dans l\'interface web');
    console.log('  - Des formats existent dans la base de données');
  }
}

createSampleReserves(); 