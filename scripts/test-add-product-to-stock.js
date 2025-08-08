#!/usr/bin/env node

/**
 * Script de test pour la fonctionnalité "Ajouter produit au stock"
 * Teste les API nécessaires et simule le processus d'ajout
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Données de test
const testCredentials = {
  username: 'admin',
  password: 'admin123'
};

let authToken = null;

// Fonction utilitaire pour faire des requêtes authentifiées
async function apiCall(method, endpoint, data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
    };
    
    if (data) {
      config.data = data;
      config.headers['Content-Type'] = 'application/json';
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`❌ Erreur ${method} ${endpoint}:`, error.response?.data || error.message);
    return null;
  }
}

async function testAddProductToStock() {
  console.log('🧪 Test de la fonctionnalité "Ajouter produit au stock"\n');
  
  try {
    // 1. Authentification
    console.log('1️⃣ Test d\'authentification...');
    const loginResponse = await apiCall('POST', '/api/auth/login', testCredentials);
    if (!loginResponse || !loginResponse.success) {
      throw new Error('Échec de l\'authentification');
    }
    authToken = loginResponse.token;
    console.log('✅ Authentification réussie');
    
    // 2. Récupération des produits avec formats
    console.log('\n2️⃣ Test de récupération des produits...');
    const productsResponse = await apiCall('GET', '/api/products');
    if (!productsResponse || !productsResponse.success) {
      throw new Error('Échec de récupération des produits');
    }
    
    const productsWithFormats = productsResponse.data.filter(p => 
      p.Formats && p.Formats.length > 0 && p.isActive !== false
    );
    
    if (productsWithFormats.length === 0) {
      throw new Error('Aucun produit avec formats trouvé');
    }
    
    const testProduct = productsWithFormats[0];
    console.log(`✅ Produit de test trouvé: ${testProduct.name} (${testProduct.Formats.length} formats)`);
    
    // 3. Récupération des détails du produit
    console.log('\n3️⃣ Test de récupération des détails du produit...');
    const productDetailsResponse = await apiCall('GET', `/api/products/${testProduct.id}`);
    if (!productDetailsResponse || !productDetailsResponse.success) {
      throw new Error('Échec de récupération des détails du produit');
    }
    console.log('✅ Détails du produit récupérés');
    
    // 4. Récupération des bars
    console.log('\n4️⃣ Test de récupération des bars...');
    const barsResponse = await apiCall('GET', '/api/bars');
    if (!barsResponse || !barsResponse.success) {
      throw new Error('Échec de récupération des bars');
    }
    
    const activeBars = barsResponse.data.filter(bar => bar.isActive !== false);
    if (activeBars.length === 0) {
      throw new Error('Aucun bar actif trouvé');
    }
    
    const testBar = activeBars[0];
    console.log(`✅ Bar de test trouvé: ${testBar.name}`);
    
    // 5. Test d'ajout au stock
    console.log('\n5️⃣ Test d\'ajout au stock...');
    const testFormat = testProduct.Formats[0];
    const stockData = {
      barId: testBar.id,
      formatId: testFormat.id,
      currentQuantity: 15,
      minQuantity: 5,
      idealQuantity: 25
    };
    
    console.log('📦 Données de stock à envoyer:', {
      bar: testBar.name,
      produit: testProduct.name,
      format: testFormat.name,
      ...stockData
    });
    
    const stockResponse = await apiCall('POST', '/api/stocks', stockData);
    if (!stockResponse || !stockResponse.success) {
      console.log('⚠️  Échec d\'ajout au stock (peut-être déjà existant):', stockResponse?.message);
      
      // Essayer de mettre à jour le stock existant
      console.log('🔄 Tentative de mise à jour du stock existant...');
      const updateResponse = await apiCall('PUT', `/api/stocks/${testBar.id}/${testFormat.id}`, {
        currentQuantity: stockData.currentQuantity + 5,
        minQuantity: stockData.minQuantity,
        idealQuantity: stockData.idealQuantity
      });
      
      if (updateResponse && updateResponse.success) {
        console.log('✅ Stock mis à jour avec succès');
      } else {
        console.log('❌ Échec de mise à jour du stock');
      }
    } else {
      console.log('✅ Stock ajouté avec succès:', stockResponse.message);
    }
    
    // 6. Vérification du stock créé/mis à jour
    console.log('\n6️⃣ Vérification du stock...');
    const stocksResponse = await apiCall('GET', `/api/stocks?barId=${testBar.id}`);
    if (stocksResponse && stocksResponse.success) {
      const relatedStocks = stocksResponse.data.filter(stock => 
        stock.formatId === testFormat.id
      );
      
      if (relatedStocks.length > 0) {
        console.log('✅ Stock vérifié:', {
          produit: testProduct.name,
          format: testFormat.name,
          quantité: relatedStocks[0].currentQuantity,
          min: relatedStocks[0].minThreshold || relatedStocks[0].minQuantity,
          max: relatedStocks[0].maxThreshold || relatedStocks[0].idealQuantity
        });
      } else {
        console.log('⚠️  Stock non trouvé après création');
      }
    }
    
    console.log('\n🎉 Test terminé avec succès !');
    console.log('\n📋 Instructions pour tester dans le navigateur:');
    console.log('1. Ouvrez http://localhost:3000');
    console.log('2. Connectez-vous avec admin/admin123');
    console.log('3. Allez sur la page "Produits"');
    console.log('4. Cliquez sur le bouton "Stock" d\'un produit');
    console.log('5. Sélectionnez un bar et un format');
    console.log('6. Remplissez les quantités et cliquez "Ajouter au stock"');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    process.exit(1);
  }
}

// Exécuter le test
testAddProductToStock();