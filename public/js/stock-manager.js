// Gestionnaire de stock pour les bars
// Réutiliser la variable API_URL déjà  définie dans auth.js
// const API_URL = '/api';

// Variables globales pour éviter les initialisations multiples
let stockManagerInitialized = false;
let socket = null; // Variable globale pour stocker la connexion Socket.IO

// Fonction pour charger les stocks d'un bar spécifique
async function loadBarStock(barId) {
  try {
    const response = await fetchWithAuth(`/stocks?barId=${barId}`);
    console.log('Réponse de chargement des stocks:', response);
    
    // Extraction des stocks selon le format de réponse
    let stocks = [];
    if (response) {
      if (Array.isArray(response)) {
        stocks = response;
      } else if (response.success && Array.isArray(response.data)) {
        stocks = response.data;
      } else if (response.stocks && Array.isArray(response.stocks)) {
        stocks = response.stocks;
      }
    }
    
    console.log(`Stocks chargés pour le bar #${barId}:`, stocks.length);
    return stocks;
  } catch (error) {
    console.error('Erreur lors du chargement des stocks:', error);
    try {
      showAlert('Erreur lors du chargement des stocks', 'danger');
    } catch (alertError) {
      console.error('Erreur d\'affichage de l\'alerte:', alertError);
    }
    return [];
  }
}

// Fonction pour charger les formats disponibles pour le formulaire d'ajout de produit
async function loadProductFormats() {
  // Vérifier l'authentification avant de faire l'appel API
  if (!checkAuth()) {
    console.log('Utilisateur non authentifié, chargement des formats différé');
    return;
  }
  
  // Vérifier si l'élément DOM existe avant de faire l'appel API
  const formatSelect = document.getElementById('new-product-format');
  if (!formatSelect) {
    console.log('Élément new-product-format non trouvé, pas besoin de charger les formats');
    return;
  }
  
  try {
    console.log('Chargement des formats...');
    const response = await fetchWithAuth('/formats');
    console.log('Réponse brute de l\'API formats:', response);
    
    // Extraction des formats en fonction du format de réponse
    let formats = [];
    if (response) {
      if (Array.isArray(response)) {
        formats = response;
      } else if (response.success && Array.isArray(response.data)) {
        formats = response.data;
      } else if (response.formats && Array.isArray(response.formats)) {
        formats = response.formats;
      } else {
        console.warn('Format de réponse inattendu pour les formats:', response);
      }
    }
    
    console.log('Formats extraits:', formats);
    
    if (!formats || formats.length === 0) {
      console.log('Aucun format trouvé, tentative de création de formats par défaut');
      // Tenter de créer des formats par défaut si nécessaire
      await createDefaultFormats();
      return;
    }
    
    const formatSelect = document.getElementById('new-product-format');
    if (formatSelect) {
      formatSelect.innerHTML = '';
      
      // Si aucun format n'est disponible, ajouter un message et tenter d'en créer
      if (formats.length === 0) {
        console.log('Aucun format disponible, création de formats par défaut');
        await createDefaultFormats();
        
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Aucun format disponible - Créez un format d\'abord';
        option.disabled = true;
        option.selected = true;
        formatSelect.appendChild(option);
        
        // Désactiver le formulaire d'ajout
        const submitBtn = document.querySelector('#add-product-to-bar-form button[type="submit"]');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.title = 'Veuillez créer un format avant d\'ajouter un produit';
        }
        
        showAlert('Aucun format disponible. Veuillez créer un format pour les produits d\'abord.', 'warning');
      } else {
        // Ajouter les formats disponibles
        formats.forEach(format => {
          try {
            const option = document.createElement('option');
            option.value = format.id;
            
            // Gestion de différentes structures de données possibles
            if (format.name) {
              option.textContent = `${format.name} (${format.volume} ${format.unit}) - ${format.packaging || 'bouteille'}`;
            } else if (format.size) {
              option.textContent = `${format.size} (${format.volume} ${format.unit}) - ${format.packaging || 'bouteille'}`;
            } else {
              option.textContent = `Format #${format.id} (${format.volume || '?'} ${format.unit || '?'}) - ${format.packaging || 'bouteille'}`;
            }
            
            formatSelect.appendChild(option);
            console.log(`Format ajouté au sélecteur: ${option.textContent}`);
          } catch (err) {
            console.error('Erreur lors de l\'ajout d\'un format au sélecteur:', err, format);
          }
        });
        
        // Activer le bouton de soumission
        const submitBtn = document.querySelector('#add-product-to-bar-form button[type="submit"]');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.title = '';
        }
      }
    } else {
      console.error('Sélecteur de format non trouvé dans le DOM');
    }
  } catch (error) {
    console.error('Erreur lors du chargement des formats:', error);
    showAlert('Erreur lors du chargement des formats de produits', 'danger');
    
    // Tenter de créer des formats par défaut
    await createDefaultFormats();
  }
}

// Fonction pour créer des formats par défaut
async function createDefaultFormats() {
  // Vérifier l'authentification avant de faire l'appel API
  if (!checkAuth()) {
    console.log('Utilisateur non authentifié, création de formats par défaut différée');
    return;
  }
  
  const defaultFormats = [
    { size: '33cl', unit: 'cl', volume: 33, packaging: 'canette' },
    { size: '50cl', unit: 'cl', volume: 50, packaging: 'bouteille' },
    { size: '75cl', unit: 'cl', volume: 75, packaging: 'bouteille' },
    { size: '1L', unit: 'L', volume: 100, packaging: 'bouteille' },
    { size: 'Canette', unit: 'unité', volume: 33, packaging: 'canette' },
    { size: 'Bouteille', unit: 'unité', volume: 75, packaging: 'bouteille' }
  ];
  
  try {
    console.log('Tentative de création de formats par défaut...');
    let createdFormats = [];
    
    for (const format of defaultFormats) {
      try {
        const result = await fetchWithAuth('/formats', {
          method: 'POST',
          body: JSON.stringify({
            size: format.size,
            unit: format.unit,
            volume: format.volume,
            packaging: format.packaging,
            isActive: true
          })
        });
        
        if (result && result.success) {
          console.log(`Format créé: ${format.size} (${format.packaging})`);
          createdFormats.push(result.data);
        }
      } catch (err) {
        console.error(`Erreur lors de la création du format ${format.size}:`, err);
      }
    }
    
    if (createdFormats.length > 0) {
      showAlert(`${createdFormats.length} formats par défaut ont été créés`, 'success');
      
      // Ne recharger les formats que si l'élément DOM existe
      const formatSelect = document.getElementById('new-product-format');
      if (formatSelect) {
        // Recharger les formats
        const formats = await fetchWithAuth('/formats');
        
        if (formats && formats.length > 0) {
          formatSelect.innerHTML = '';
          formats.forEach(format => {
            const option = document.createElement('option');
            option.value = format.id;
            option.textContent = `${format.size || format.name} (${format.volume} ${format.unit})${format.packaging ? ' - ' + format.packaging : ''}`;
            formatSelect.appendChild(option);
          });
          
          // Activer le bouton de soumission
          const submitBtn = document.querySelector('#add-product-to-bar-form button[type="submit"]');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.title = '';
          }
        }
      }
    }
  } catch (error) {
    console.error('Erreur lors de la création des formats par défaut:', error);
  }
}

// Fonction pour ouvrir le modal de création de format
function openNewFormatModal() {
  // Vérifier si la fonction openFormatModal existe (définie dans app.js)
  if (typeof openFormatModal === 'function') {
    // Créer un nouveau format sans produit spécifique
    // OpenFormatModal sera mis À  jour pour gérer ce cas
    openFormatModal(null, null, true);
  } else {
    console.error('La fonction openFormatModal n\'existe pas');
    createFormatDirectly();
  }
}

// Fonction pour créer un format directement si openFormatModal n'est pas disponible
async function createFormatDirectly() {
  // Vérifier l'authentification avant de faire l'appel API
  if (!checkAuth()) {
    console.log('Utilisateur non authentifié, création de format différée');
    showAlert('Veuillez vous connecter pour créer un format', 'warning');
    return;
  }
  
  const size = prompt('Taille du format (ex: 33cl, 75cl, 1L):');
  if (!size) return;
  
  const units = ['cl', 'ml', 'L', 'bouteille', 'canette', 'unité'];
  let unit = prompt(`Unité (${units.join(', ')}):`, 'cl');
  if (!units.includes(unit)) unit = 'cl';
  
  const packagingOptions = ['bouteille', 'canette', 'verre', 'fut', 'bag-in-box', 'plastique'];
  let packaging = prompt(`Conditionnement (${packagingOptions.join(', ')}):`, 'bouteille');
  if (!packagingOptions.includes(packaging)) packaging = 'bouteille';
  
  const volumeStr = prompt('Volume (en cl):', '33');
  const volume = parseFloat(volumeStr) || 33;
  
  try {
    const result = await fetchWithAuth('/formats', {
      method: 'POST',
      body: JSON.stringify({
        size,
        unit,
        volume,
        packaging,
        isActive: true
      })
    });
    
    if (result && result.success) {
      showAlert(`Format ${size} (${packaging}) créé avec succès`, 'success');
      // Ne recharger les formats que si l'élément DOM existe
      const formatSelect = document.getElementById('new-product-format');
      if (formatSelect) {
        loadProductFormats();
      }
    } else {
      showAlert('Erreur lors de la création du format', 'danger');
    }
  } catch (error) {
    console.error('Erreur lors de la création du format:', error);
    showAlert('Erreur lors de la création du format', 'danger');
  }
}

// Fonction pour ajouter un nouveau produit au stock d'un bar
async function addProductToBar(barId, productData) {
  console.log('Ajout de produit au bar:', { barId, productData });
  
  try {
    // Rechercher si le produit existe déjà 
    const productResponse = await fetchWithAuth(`/products?name=${encodeURIComponent(productData.name)}`);
    console.log('Réponse de recherche de produit:', productResponse);
    
    let productId;
    let productCreated = false;
    
    // Vérifier si le produit existe déjà 
    if (productResponse && productResponse.success && productResponse.data.length > 0) {
      // Trouver une correspondance exacte
      const exactMatch = productResponse.data.find(p => 
        p.name.toLowerCase() === productData.name.toLowerCase() && 
        (p.brand || '').toLowerCase() === (productData.brand || '').toLowerCase()
      );
      
      if (exactMatch) {
        console.log('Utilisation du produit existant, ID:', exactMatch.id);
        productId = exactMatch.id;
      } else {
        // Créer un nouveau produit
        const newProductResponse = await fetchWithAuth('/products', {
          method: 'POST',
          body: JSON.stringify({
            name: productData.name,
            brand: productData.brand,
            category: productData.category,
            isActive: true
          })
        });
        
        if (newProductResponse && newProductResponse.success) {
          console.log('Nouveau produit créé:', newProductResponse);
          productId = newProductResponse.data.id;
          productCreated = true;
        } else {
          console.error('Erreur lors de la création du produit:', newProductResponse);
          try {
            showAlert('Erreur lors de la création du produit', 'danger');
          } catch (alertError) {
            console.error('Erreur lors de l\'affichage de l\'alerte:', alertError);
          }
          return false;
        }
      }
    } else {
      // Créer un nouveau produit
      const newProductResponse = await fetchWithAuth('/products', {
        method: 'POST',
        body: JSON.stringify({
          name: productData.name,
          brand: productData.brand,
          category: productData.category,
          isActive: true
        })
      });
      
      if (newProductResponse && newProductResponse.success) {
        console.log('Nouveau produit créé:', newProductResponse);
        productId = newProductResponse.data.id;
        productCreated = true;
      } else {
        console.error('Erreur lors de la création du produit:', newProductResponse);
        try {
          showAlert('Erreur lors de la création du produit', 'danger');
        } catch (alertError) {
          console.error('Erreur lors de l\'affichage de l\'alerte:', alertError);
        }
        return false;
      }
    }
    
    // Si aucun format n'est spécifié ou si un nouveau produit a été créé, tenter de créer ou trouver un format approprié
    let formatId = productData.formatId;
    if (!formatId || productCreated) {
      console.log('Recherche ou création d\'un format pour le produit');
      
      // Si un nouveau produit a été créé, vérifier d'abord s'il existe déjà  des formats pour ce produit
      if (productCreated) {
        const productFormatsResponse = await fetchWithAuth(`/formats?productId=${productId}`);
        
        if (productFormatsResponse && productFormatsResponse.success && 
            productFormatsResponse.data && productFormatsResponse.data.length > 0) {
          // Utiliser le premier format existant
          formatId = productFormatsResponse.data[0].id;
          console.log('Format existant trouvé pour le nouveau produit:', formatId);
        }
      }
      
      // Si aucun format n'est encore trouvé, créer un nouveau format
      if (!formatId) {
        console.log('Création d\'un nouveau format pour le produit');
        
        // Déterminer la taille et l'unité selon la catégorie du produit
        let formatSize = '33cl';
        let formatVolume = 33;
        let formatUnit = 'cl';
        
        const category = productData.category ? productData.category.toLowerCase() : '';
        
        if (category === 'spirit' || category === 'spiritueux') {
          formatSize = '70cl';
          formatVolume = 70;
        } else if (category === 'wine' || category === 'vin') {
          formatSize = '75cl';
          formatVolume = 75;
        } else if (category === 'soft' || category === 'soda') {
          if (productData.name.toLowerCase().includes('coca') || 
              productData.name.toLowerCase().includes('pepsi') || 
              productData.name.toLowerCase().includes('fanta')) {
            formatSize = '33cl';
            formatVolume = 33;
          } else if (productData.name.toLowerCase().includes('jus') || 
                     productData.name.toLowerCase().includes('juice')) {
            formatSize = '1L';
            formatVolume = 100;
            formatUnit = 'cl';
          }
        }
        
        // Créer le format avec un lien direct vers le produit
        const formatData = {
          productId: parseInt(productId),
          size: formatSize,
          volume: formatVolume,
          unit: formatUnit,
          isActive: true
        };
        
        console.log('Création du format avec les données:', formatData);
        
        try {
          // Première tentative: créer le format avec productId
          const newFormatResponse = await fetchWithAuth('/formats', {
            method: 'POST',
            body: JSON.stringify(formatData)
          });
          
          if (newFormatResponse && newFormatResponse.success) {
            console.log('Nouveau format créé avec succès:', newFormatResponse);
            formatId = newFormatResponse.data.id;
          } else {
            // Si la première tentative échoue, essayer sans productId puis associer
            console.log('À‰chec de la création directe du format, tentative alternative');
            
            const formatDataWithoutProduct = { ...formatData };
            delete formatDataWithoutProduct.productId;
            
            const altFormatResponse = await fetchWithAuth('/formats', {
              method: 'POST',
              body: JSON.stringify(formatDataWithoutProduct)
            });
            
            if (altFormatResponse && altFormatResponse.success) {
              const altFormatId = altFormatResponse.data.id;
              
              // Associer le format au produit
              const updateResponse = await fetchWithAuth(`/formats/${altFormatId}`, {
                method: 'PUT',
                body: JSON.stringify({
                  productId: parseInt(productId)
                })
              });
              
              if (updateResponse && updateResponse.success) {
                formatId = altFormatId;
                console.log('Format créé et associé avec succès (méthode alternative)');
              } else {
                console.error('À‰chec de l\'association du format au produit');
                // Continuer quand même, car le format existe, mais n'est pas associé
                formatId = altFormatId;
              }
            } else {
              console.error('À‰chec de la création du format (méthode alternative)');
            }
          }
        } catch (formatError) {
          console.error('Erreur lors de la création du format:', formatError);
        }
      }
    }
    
    // Vérifier que l'ID du format est valide
    if (!formatId) {
      showAlert('Erreur: Format invalide', 'danger');
      return false;
    }
    
    // Ajouter le stock - Utiliser les bons noms de champs
    const stockData = {
      barId: parseInt(barId),
      formatId: parseInt(formatId),
      currentQuantity: parseInt(productData.quantity || '0'),
      minQuantity: parseInt(productData.minQuantity || '10'),
      idealQuantity: parseInt(productData.idealQuantity || '30')
    };
    
    console.log('Ajout du stock avec les données:', stockData);
    
    let stockResponse;
    try {
      stockResponse = await fetchWithAuth('/stocks', {
        method: 'POST',
        body: JSON.stringify(stockData)
      });
    } catch (error) {
      console.error('Erreur lors de la requête d\'ajout de stock:', error);
      
      // En cas d'erreur, tenter d'ajouter le productId manuellement
      if (!stockResponse) {
        try {
          console.log('Tentative alternative d\'ajout de stock avec productId explicite');
          // Récupérer les informations du format pour obtenir le productId
          const formatResponse = await fetchWithAuth(`/formats/${formatId}`);
          if (formatResponse && formatResponse.success && formatResponse.data) {
            const productId = formatResponse.data.productId;
            
            if (productId) {
              // Ajouter explicitement le productId dans les données de stock
              stockData.productId = parseInt(productId);
              stockResponse = await fetchWithAuth('/stocks', {
                method: 'POST',
                body: JSON.stringify(stockData)
              });
            }
          }
        } catch (retryError) {
          console.error('Erreur lors de la seconde tentative d\'ajout de stock:', retryError);
        }
      }
    }
    
    console.log('Réponse d\'ajout de stock:', stockResponse);
    
    if (stockResponse && stockResponse.success) {
      // Mise À  jour de l'UI en temps réel traitée par les événements socket.io
      try {
        showAlert(`Produit ${productData.name} ajouté avec succès`, 'success');
      } catch (alertError) {
        console.error('Erreur lors de l\'affichage de l\'alerte de succès:', alertError);
        // Ne pas interrompre l'exécution, le stock a été ajouté avec succès
      }
      
      // Recharger le tableau des stocks pour refléter l'ajout
      if (typeof loadStocksTable === 'function') {
        setTimeout(() => {
          loadStocksTable(barId);
        }, 300);
      }
      
      // Recharger la liste des produits dans la page produits
      if (productCreated && typeof loadProducts === 'function') {
        setTimeout(() => {
          loadProducts();
        }, 500);
      }
      
      // Recharger le tableau des produits À  recharger si disponible
      if (typeof loadRestockItems === 'function') {
        setTimeout(() => {
          // Tenter de recharger la page pour le bar actuel
          const savedBarId = localStorage.getItem('selectedBarId');
          if (savedBarId && (savedBarId === barId || !barId)) {
            console.log('Actualisation forcée des produits À  recharger pour le bar:', savedBarId);
            loadRestockItems(savedBarId);
          }
        }, 700);
      }
      
      // Force une actualisation complète des stocks dans la page des stocks
      if (typeof loadStocks === 'function') {
        setTimeout(() => {
          loadStocks();
        }, 800);
      }
      
      return true;
    } else {
      const errorMessage = stockResponse?.message || 'Erreur lors de l\'ajout du produit au stock';
      console.error(errorMessage, stockResponse);
      showAlert(errorMessage, 'danger');
      return false;
    }
  } catch (error) {
    console.error('Erreur lors de l\'ajout du produit au stock:', error);
    showAlert('Erreur technique lors de l\'ajout du produit au stock', 'danger');
    return false;
  }
}

// Mettre À  jour la quantité d'un produit
async function updateProductQuantity(stockId, newQuantity, reason = 'Mise À  jour manuelle') {
  console.log(`*** DEBUG: Fonction updateProductQuantity appelée pour le stock #${stockId} avec nouvelle quantité ${newQuantity}`);
  try {
    // Vérifier que les valeurs sont valides
    if (!stockId || isNaN(parseInt(stockId))) {
      console.error(`*** DEBUG: ID de stock invalide: ${stockId}`);
      showAlert('ID de stock invalide', 'danger');
      return false;
    }
    
    if (isNaN(parseInt(newQuantity)) || parseInt(newQuantity) < 0) {
      console.error(`*** DEBUG: Quantité invalide: ${newQuantity}`);
      showAlert('La quantité doit être un nombre positif', 'warning');
      return false;
    }
    
    // Essayer d'abord la méthode simple
    let result = await tryUpdateStock('/stocks', stockId, newQuantity, reason);
    console.log(`*** DEBUG: Résultat de la première tentative: ${result}`);
    
    // Si cela échoue, essayer l'endpoint historique
    if (!result) {
      console.log('*** DEBUG: Premier essai échoué, tentative avec stock-history');
      result = await tryUpdateStock('/stock-history', stockId, newQuantity, reason);
      console.log(`*** DEBUG: Résultat de la deuxième tentative: ${result}`);
    }
    
    return result;
  } catch (error) {
    console.error('*** DEBUG: Exception dans updateProductQuantity:', error);
    showAlert(`Erreur lors de la mise À  jour de la quantité: ${error.message}`, 'danger');
    return false;
  }
}

// Fonction d'aide pour essayer différents endpoints de mise À  jour
async function tryUpdateStock(endpoint, stockId, newQuantity, reason) {
  try {
    console.log(`*** DEBUG: Tentative de mise À  jour via l'endpoint: ${endpoint}`);
    
    const payload = {
      quantity: newQuantity,
      currentQuantity: newQuantity,
      stock: newQuantity,
      reason: reason
    };
    
    if (endpoint === '/stocks') {
      payload.id = parseInt(stockId);
    }
    
    console.log('*** DEBUG: Données de mise À  jour:', payload);
    
    let url = endpoint;
    if (endpoint === '/stocks') {
      url = `/stocks/${stockId}`;
    } else if (endpoint === '/stock-history') {
      // Pour l'historique, on a besoin de plus d'informations
      const stockInfo = await fetchWithAuth(`/stocks/${stockId}`);
      console.log('*** DEBUG: Informations actuelles du stock:', stockInfo);
      
      // Si on a pu récupérer les infos du stock
      if (stockInfo && (stockInfo.success || stockInfo.id)) {
        const stock = stockInfo.data || stockInfo;
        const previousQuantity = stock.currentQuantity || 0;
        
        // Créer un historique de stock
        const historyData = {
          stockId: parseInt(stockId),
          previousQuantity: previousQuantity,
          newQuantity: parseInt(newQuantity),
          shiftDate: new Date().toISOString().split('T')[0],
          shiftName: 'Ajustement manuel',
          notes: reason
        };
        
        console.log('*** DEBUG: Données d\'historique pour la mise À  jour:', historyData);
        
        const historyResult = await fetchWithAuth('/stock-history', {
          method: 'POST',
          body: JSON.stringify(historyData)
        });
        
        console.log('*** DEBUG: Réponse de création d\'historique:', historyResult);
        
        // En cas de succès, actualiser aussi le tableau des produits À  recharger
        if (historyResult && historyResult.success) {
          // Récupérer l'ID du bar depuis le stock
          if (stock.barId) {
            setTimeout(() => {
              console.log('*** DEBUG: Actualisation du tableau des produits À  recharger après mise À  jour');
              
              // Utiliser d'abord le barId stocké en localStorage, puis celui du stock
              const savedBarId = localStorage.getItem('selectedBarId');
              const barToUse = savedBarId || stock.barId;
              
              // Toujours appeler loadRestockItems avec le barId approprié
              console.log('*** DEBUG: Chargement des produits À  recharger pour le bar', barToUse);
              if (typeof loadRestockItems === 'function') {
                loadRestockItems(barToUse);
              }
            }, 500);
          }
          
          return true;
        }
        
        return false;
      }
      
      return false;
    }
    
    // Envoyer la requête de mise À  jour
    const result = await fetchWithAuth(url, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    
    console.log(`*** DEBUG: Réponse de mise À  jour via ${url}:`, result);
    
    // Vérifier si la requête a réussi
    const success = !!(result && (result.success || result.id));
    
    if (success) {
      showAlert('Quantité mise À  jour avec succès', 'success');
      
      // Récupérer le barId pour actualiser la liste des produits À  recharger
      try {
        const stockInfo = await fetchWithAuth(`/stocks/${stockId}`);
        if (stockInfo && (stockInfo.success || stockInfo.id)) {
          const stock = stockInfo.data || stockInfo;
          if (stock.barId) {
            setTimeout(() => {
              console.log('*** DEBUG: Actualisation du tableau des produits À  recharger après mise À  jour');
              
              // Utiliser d'abord le barId stocké en localStorage, puis celui du stock
              const savedBarId = localStorage.getItem('selectedBarId');
              const barToUse = savedBarId || stock.barId;
              
              // Toujours appeler loadRestockItems avec le barId approprié
              console.log('*** DEBUG: Chargement des produits À  recharger pour le bar', barToUse);
              if (typeof loadRestockItems === 'function') {
                loadRestockItems(barToUse);
              }
            }, 500);
          }
        }
      } catch (error) {
        console.error('*** DEBUG: Erreur lors de la récupération du barId:', error);
      }
      
      return true;
    } else {
      console.error('*** DEBUG: À‰chec de la mise À  jour:', result);
      return false;
    }
  } catch (error) {
    console.error(`*** DEBUG: Exception dans tryUpdateStock pour ${endpoint}:`, error);
    return false;
  }
}

// Fonction d'urgence pour résoudre le problème de formats
async function emergencyFormatFix() {
  // Vérifier l'authentification avant de faire l'appel API
  if (!checkAuth()) {
    console.log('Utilisateur non authentifié, correction d\'urgence des formats différée');
    return false;
  }
  
  console.log('Démarrage de la correction d\'urgence pour les formats');
  try {
    // 1. Vérifier s'il y a des formats existants
    const formatResponse = await fetchWithAuth('/formats');
    console.log('Vérification des formats existants:', formatResponse);
    
    let hasValidFormats = false;
    let formats = [];
    
    // Extraire les formats selon la structure de réponse
    if (formatResponse) {
      if (Array.isArray(formatResponse)) {
        formats = formatResponse;
      } else if (formatResponse.success && Array.isArray(formatResponse.data)) {
        formats = formatResponse.data;
      } else if (formatResponse.formats && Array.isArray(formatResponse.formats)) {
        formats = formatResponse.formats;
      }
    }
    
    if (formats && formats.length > 0) {
      console.log(`${formats.length} formats trouvés, validation...`);
      // Vérifier si les formats sont valides
      hasValidFormats = formats.some(format => format && format.id);
      
      if (hasValidFormats) {
        console.log('Formats valides trouvés, pas besoin de correction d\'urgence');
        return true;
      }
    }
    
    // 2. Si aucun format valide n'est trouvé, créer des formats de base
    console.log('Aucun format valide trouvé, création de formats d\'urgence');
    
    const defaultFormats = [
      { size: '33cl', unit: 'cl', volume: 33 },
      { size: '50cl', unit: 'cl', volume: 50 },
      { size: '75cl', unit: 'cl', volume: 75 },
      { size: 'Bouteille', unit: 'unité', volume: 75 }
    ];
    
    for (const format of defaultFormats) {
      try {
        console.log(`Création du format d'urgence: ${format.size}`);
        const result = await fetchWithAuth('/formats', {
          method: 'POST',
          body: JSON.stringify({
            size: format.size,
            unit: format.unit,
            volume: format.volume,
            isActive: true
          })
        });
        
        console.log(`Résultat de la création de format d'urgence ${format.size}:`, result);
      } catch (err) {
        console.error(`Erreur lors de la création du format d'urgence ${format.size}:`, err);
      }
    }
    
    // 3. Vérifier à nouveau les formats après la création
    const checkResponse = await fetchWithAuth('/formats');
    console.log('Vérification après la création d\'urgence:', checkResponse);
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la correction d\'urgence des formats:', error);
    return false;
  }
}

// Initialiser les gestionnaires d'événements
document.addEventListener('DOMContentLoaded', function() {
  // Protection contre les initialisations multiples
  if (stockManagerInitialized) {
    console.log('Stock manager déjà  initialisé, sortie...');
    return;
  }
  
  console.log('Initialisation du stock manager...');
  stockManagerInitialized = true;
  
  // À‰couteur d'événement pour le sélecteur de bar
  const stockBarSelect = document.getElementById('stock-bar-select');
  
  if (stockBarSelect) {
    stockBarSelect.addEventListener('change', function() {
      const selectedBarId = this.value;
      
      // Charger les stocks du bar sélectionné
      loadStocksTable(selectedBarId);
      
      // Charger le récapitulatif des produits À  recharger
      if (selectedBarId) {
        loadRestockSummary(selectedBarId);
      } else {
        const summaryContainer = document.getElementById('restock-summary-content');
        if (summaryContainer) {
          summaryContainer.innerHTML = '<p class="text-muted">Sélectionnez un bar pour voir les produits À  recharger.</p>';
        }
      }
      
      // Rejoindre la salle du bar pour les mises À  jour en temps réel
      if (selectedBarId) {
        joinBarRoom(selectedBarId);
      }
    });
  }
  
  // Appliquer les améliorations À  l'interface des stocks
  const stocksPage = document.getElementById('stocks-page');
  
  if (stocksPage) {
    // Observer les changements dans la page des stocks
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          // Vérifier si la page est visible
          if (!stocksPage.classList.contains('d-none')) {
            enhanceStockUI();
          }
        }
      });
    });
    
    observer.observe(stocksPage, { attributes: true });
    
    // Vérifier également lors du chargement initial
    if (!stocksPage.classList.contains('d-none')) {
      enhanceStockUI();
    }
  }
});

// Fonction pour ouvrir le modal de mise À  jour de stock alternative
async function openAlternativeStockModal(stockId) {
  try {
    console.log(`Ouverture du modal alternatif pour le stock #${stockId}`);
    
    // Récupérer les informations du stock
    const stockInfo = await fetchWithAuth(`/stocks/${stockId}`);
    console.log('Informations du stock pour mise À  jour alternative:', stockInfo);
    
    // Extraire les informations nécessaires
    let stockData = null;
    let productName = 'Produit inconnu';
    let currentQuantity = 0;
    
    if (stockInfo) {
      if (stockInfo.data && stockInfo.data.length > 0) {
        stockData = stockInfo.data[0];
      } else if (!Array.isArray(stockInfo)) {
        stockData = stockInfo;
      }
    }
    
    if (stockData) {
      // Extraire le nom du produit
      if (stockData.Product) {
        productName = stockData.Product.name;
        if (stockData.Product.brand) {
          productName += ` (${stockData.Product.brand})`;
        }
      }
      
      // Extraire le format
      let formatInfo = '';
      if (stockData.Format) {
        if (stockData.Format.name) {
          formatInfo = ` - ${stockData.Format.name}`;
        } else if (stockData.Format.size) {
          formatInfo = ` - ${stockData.Format.size}`;
        }
        
        if (stockData.Format.volume && stockData.Format.unit) {
          formatInfo += ` (${stockData.Format.volume} ${stockData.Format.unit})`;
        }
      }
      
      // Extraire la quantité
      if (stockData.quantity !== undefined) {
        currentQuantity = stockData.quantity;
      } else if (stockData.currentQuantity !== undefined) {
        currentQuantity = stockData.currentQuantity;
      }
      
      productName += formatInfo;
    }
    
    // Remplir le formulaire
    document.getElementById('alternative-stock-id').value = stockId;
    document.getElementById('alternative-product-info').value = productName;
    document.getElementById('alternative-previous-quantity').value = currentQuantity;
    document.getElementById('alternative-new-quantity').value = currentQuantity;
    
    // Afficher le modal
    const modalElement = document.getElementById('alternative-stock-modal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
      
      // Ajouter le gestionnaire d'événement pour le bouton de sauvegarde
      const saveBtn = document.getElementById('save-alternative-stock-btn');
      if (saveBtn) {
        // Supprimer les gestionnaires d'événements existants
        const newSaveBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
        
        // Ajouter le nouveau gestionnaire
        newSaveBtn.addEventListener('click', async function() {
          // Désactiver le bouton pendant le traitement
          this.disabled = true;
          this.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Mise À  jour...';
          
          const newQuantity = parseInt(document.getElementById('alternative-new-quantity').value);
          const reason = document.getElementById('alternative-reason').value;
          
          if (isNaN(newQuantity) || newQuantity < 0) {
            showAlert('Veuillez entrer une quantité valide', 'warning');
            this.disabled = false;
            this.textContent = 'Mettre À  jour';
            return;
          }
          
          // Utiliser la fonction de mise À  jour via l'historique
          const success = await updateProductQuantityViaHistory(stockId, newQuantity, reason);
          
          // Restaurer le bouton
          this.disabled = false;
          this.textContent = 'Mettre À  jour';
          
          if (success) {
            // Fermer le modal
            modal.hide();
            
            // Recharger les stocks
            if (typeof loadStocksTable === 'function') {
              loadStocksTable();
            }
          }
        });
      }
    } else {
      console.error('Modal de mise À  jour alternative non trouvé dans le DOM');
      showAlert('Erreur: Interface de mise À  jour alternative non disponible', 'danger');
    }
  } catch (error) {
    console.error('Erreur lors de l\'ouverture du modal alternatif:', error);
    showAlert('Erreur lors de la préparation de la mise À  jour alternative', 'danger');
  }
}

// Fonction pour initialiser la connexion Socket.IO
function initializeSocketConnection() {
  if (socket) {
    // DéjÀ  connecté
    return;
  }
  
  // Connexion au serveur Socket.IO
  socket = io();
  
  // À‰vénement de connexion
  socket.on('connect', () => {
    console.log('Connexion Socket.IO établie');
  });
  
  // À‰vénement de déconnexion
  socket.on('disconnect', () => {
    console.log('Connexion Socket.IO perdue');
  });
  
  // À‰vénement de mise À  jour de stock
  socket.on('stock-updated', (updatedStock) => {
    console.log('Mise À  jour de stock reçue:', updatedStock);
    updateStockInUI(updatedStock);
  });
  
  // À‰vénement d'initialisation de stocks
  socket.on('stocks-initialized', (stocks) => {
    console.log('Stocks initialisés reçus:', stocks);
    updateMultipleStocksInUI(stocks);
  });
}

// Fonction pour rejoindre la salle d'un bar spécifique
function joinBarRoom(barId) {
  if (!socket) {
    initializeSocketConnection();
  }
  
  // Quitter toute salle actuelle et rejoindre la nouvelle
  socket.emit('join-bar', barId);
  console.log(`Rejoint la salle du bar ${barId}`);
}

// Fonction pour mettre À  jour un stock dans l'interface utilisateur sans rechargement
function updateStockInUI(updatedStock) {
  console.log('Mise À  jour du stock dans l\'UI:', updatedStock);
  
  const stockRow = document.querySelector(`tr[data-stock-id="${updatedStock.id}"]`);
  
  if (stockRow) {
    // Mettre À  jour les données dans la ligne existante
    const quantityCell = stockRow.querySelector('.stock-quantity-cell');
    const minQuantityCell = stockRow.querySelector('.min-quantity-cell');
    const idealQuantityCell = stockRow.querySelector('.ideal-quantity-cell');
    const statusCell = stockRow.querySelector('.stock-status');
    
    if (quantityCell) {
      quantityCell.innerHTML = `
        <input type="number" class="form-control stock-quantity" 
               data-stock-id="${updatedStock.id}" 
               value="${updatedStock.currentQuantity}" min="0">
      `;
    }
    
    if (minQuantityCell) {
      minQuantityCell.textContent = updatedStock.minQuantity;
    }
    
    if (idealQuantityCell) {
      idealQuantityCell.textContent = updatedStock.idealQuantity;
    }
    
    if (statusCell) {
      // Mettre À  jour le statut du stock
      const status = updatedStock.currentQuantity < updatedStock.minQuantity ? 
                     'En dessous du minimum' : 
                     (updatedStock.currentQuantity < updatedStock.idealQuantity ? 
                      'Niveau correct' : 'Niveau optimal');
      
      const statusClass = updatedStock.currentQuantity < updatedStock.minQuantity ? 
                         'danger' : 
                         (updatedStock.currentQuantity < updatedStock.idealQuantity ? 
                          'warning' : 'success');
      
      statusCell.innerHTML = `<span class="badge bg-${statusClass}">${status}</span>`;
    }

    // Animer la ligne pour indiquer une mise À  jour
    stockRow.classList.add('highlight-update');
    setTimeout(() => {
      stockRow.classList.remove('highlight-update');
    }, 2000);
  } else {
    // Si la ligne n'existe pas, recharger le tableau complet
    console.log('Ligne de stock non trouvée dans le DOM, rechargement du tableau');
    try {
      const barSelect = document.getElementById('stock-bar-select');
      if (barSelect) {
        const selectedBarId = barSelect.value;
        
        // Vérifier si nous avons la fonction loadStocksTable
        if (typeof loadStocksTable === 'function') {
          if (selectedBarId === updatedStock.barId.toString() || selectedBarId === '') {
            // Recharger uniquement si le stock appartient au bar sélectionné ou si "Tous les bars" est sélectionné
            loadStocksTable(selectedBarId);
          }
        } else {
          console.warn('Fonction loadStocksTable non disponible');
        }
      } else {
        console.warn('Sélecteur de bar non trouvé dans le DOM');
      }
    } catch (error) {
      console.error('Erreur lors du rechargement du tableau des stocks:', error);
    }
  }
}

// Fonction pour mettre À  jour plusieurs stocks dans l'interface utilisateur
function updateMultipleStocksInUI(stocks) {
  if (!Array.isArray(stocks) || stocks.length === 0) return;
  
  // Mettre À  jour chaque stock individuellement
  stocks.forEach(stock => updateStockInUI(stock));
}

// Fonction pour ouvrir le modal d'initialisation de stock pour un bar
function openInitializeStockModal(barId) {
  console.log(`Début de l'initialisation des stocks pour le bar ${barId}`);
  
  // Récupérer les données du bar sélectionné
  fetchWithAuth(`/bars/${barId}`)
    .then(barData => {
      if (!barData) {
        console.error("Aucune donnée de bar reçue");
        showAlert("Impossible de récupérer les informations du bar", "danger");
        return;
      }
      
      const bar = barData.data || barData;
      console.log(`Bar récupéré:`, bar);
      
      // D'abord récupérer tous les produits
      fetchWithAuth('/products')
        .then(productsData => {
          const products = productsData?.data || productsData || [];
          console.log(`Produits récupérés (${products.length}):`, products);
          
          // Récupérer tous les formats de produits disponibles
          fetchWithAuth('/formats?include=product')
            .then(async (formatsData) => {
              console.log(`Réponse brute de l'API formats:`, formatsData);
              
              let formats = [];
              
              if (formatsData && formatsData.data) {
                formats = formatsData.data;
              } else if (Array.isArray(formatsData)) {
                formats = formatsData;
              }
              
              console.log(`Formats extraits (${formats.length}):`, formats);
              
              if (!formats || formats.length === 0) {
                showAlert("Aucun format de produit disponible. Créez d'abord des formats pour vos produits.", "warning");
                return;
              }
              
              // Récupérer les stocks actuels pour ce bar
              const existingStocks = await loadBarStock(barId);
              console.log(`Stocks existants pour le bar (${existingStocks.length}):`, existingStocks);
              
              // Vérifier s'il y a des produits sans format
              const productsWithFormat = new Set();
              formats.forEach(format => {
                if (format.Product) {
                  productsWithFormat.add(format.Product.id);
                  console.log(`Format avec Product: ID=${format.id}, produit=${format.Product.name} (ID=${format.Product.id})`);
                } else if (format.product) {
                  productsWithFormat.add(format.product.id);
                  console.log(`Format avec product: ID=${format.id}, produit=${format.product.name} (ID=${format.product.id})`);
                } else if (format.productId) {
                  productsWithFormat.add(format.productId);
                  console.log(`Format avec productId: ID=${format.id}, productId=${format.productId}`);
                } else {
                  console.log(`Format sans produit associé: ID=${format.id}, taille=${format.size || format.name}`);
                }
              });
              
              console.log(`Produits avec format (${productsWithFormat.size}):`, Array.from(productsWithFormat));
              const productsWithoutFormat = products.filter(p => !productsWithFormat.has(p.id));
              console.log(`Produits sans format (${productsWithoutFormat.length}):`, productsWithoutFormat);
              
              if (productsWithoutFormat.length > 0) {
                const productNames = productsWithoutFormat.map(p => p.name).join(", ");
                showAlert(`Les produits suivants n'ont pas de format et ne sont pas disponibles pour l'initialisation: ${productNames}. Ajoutez un format À  ces produits pour les inclure.`, "warning");
              }
              
              // Créer et afficher le modal
              createStockInitializationModal(bar, formats, existingStocks);
            })
            .catch(error => {
              console.error('Erreur lors du chargement des formats:', error);
              showAlert("Erreur lors du chargement des formats", "danger");
            });
        })
        .catch(error => {
          console.error('Erreur lors du chargement des produits:', error);
          showAlert("Erreur lors du chargement des produits", "danger");
        });
    })
    .catch(error => {
      console.error('Erreur lors du chargement des informations du bar:', error);
      showAlert("Erreur lors du chargement des informations du bar", "danger");
    });
}

// Fonction pour obtenir le nom du produit À  partir du format
function getProductInfoFromFormat(format) {
  let productName = 'Produit inconnu';
  let productId = null;
  
  if (format.Product) {
    productName = `${format.Product.name} ${format.Product.brand ? `(${format.Product.brand})` : ''}`;
    productId = format.Product.id;
  } else if (format.product) {
    productName = `${format.product.name} ${format.product.brand ? `(${format.product.brand})` : ''}`;
    productId = format.product.id;
  } else if (format.productId) {
    productName = `Produit #${format.productId}`;
    productId = format.productId;
  }
  
  return { productName, productId };
}

// Fonction pour créer et afficher le modal d'initialisation de stock
function createStockInitializationModal(bar, formats, existingStocks) {
  console.log("Création du modal d'initialisation des stocks");
  
  // Vérifier si le modal existe déjà , sinon le créer
  let modalElement = document.getElementById('initialize-stock-modal');
  
  if (!modalElement) {
    console.log("Création du DOM pour le modal d'initialisation");
    // Créer le modal
    const modalHTML = `
      <div class="modal fade" id="initialize-stock-modal" tabindex="-1" aria-labelledby="initialize-stock-modal-label" aria-hidden="true">
        <div class="modal-dialog modal-xl">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="initialize-stock-modal-label">Initialiser les stocks pour ${bar.name}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <p class="text-muted">Définissez les quantités actuelles et minimales pour les produits dans ce bar.</p>
              
              <div class="mb-3 row">
                <div class="col-md-6">
                  <div class="input-group">
                    <span class="input-group-text">Recherche</span>
                    <input type="text" class="form-control" id="stock-init-search" placeholder="Filtrer par nom de produit...">
                  </div>
                </div>
                <div class="col-md-6 text-end">
                  <button type="button" class="btn btn-sm btn-outline-primary" id="select-all-products-btn">Sélectionner tous</button>
                  <button type="button" class="btn btn-sm btn-outline-secondary" id="unselect-all-products-btn">Désélectionner tous</button>
                </div>
              </div>
              
              <form id="initialize-stock-form">
                <input type="hidden" id="init-bar-id" value="${bar.id}">
                
                <div class="table-responsive">
                  <table class="table table-hover">
                    <thead>
                      <tr>
                        <th style="width: 50px;"><input type="checkbox" id="toggle-all-products" checked></th>
                        <th>Produit</th>
                        <th>Format</th>
                        <th>Quantité actuelle</th>
                        <th>Quantité minimale</th>
                        <th>Quantité idéale</th>
                      </tr>
                    </thead>
                    <tbody id="initialize-stock-tbody">
                      <!-- Les lignes seront ajoutées dynamiquement -->
                    </tbody>
                  </table>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
              <button type="button" class="btn btn-primary" id="save-all-stocks-btn">Enregistrer les stocks sélectionnés</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Ajouter le modal au body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    modalElement = document.getElementById('initialize-stock-modal');
  }
  
  // Remplir le tableau avec les formats disponibles
  const tbody = document.getElementById('initialize-stock-tbody');
  tbody.innerHTML = '';
  console.log(`Remplissage du tableau avec ${formats.length} formats`);
  
  // Filtrer les formats sans produit
  const validFormats = formats.filter(format => {
    // Si le format a déjà  un produit chargé (via include=product), l'utiliser
    if (format.Product || format.product) {
      return true;
    }
    
    // Si le format a un productId mais pas d'objet Product associé dans la réponse API
    if (format.productId) {
      console.log(`Format avec productId mais sans Product chargé: ID=${format.id}, productId=${format.productId}`);
      // Essayer de rechercher le produit correspondant À  cet ID
      const matchingProduct = products.find(p => p.id == format.productId);
      if (matchingProduct) {
        console.log(`Produit correspondant trouvé pour format ${format.id}: ${matchingProduct.name}`);
        // Ajouter manuellement le produit au format
        format.Product = matchingProduct;
        return true;
      } else {
        console.log(`Aucun produit trouvé avec ID ${format.productId} pour le format ${format.id}`);
      }
      return true; // Inclure ce format même si le produit n'est pas trouvé
    }
    
    // Filtrer les formats sans productId
    return false;
  });
  
  console.log(`Formats valides avec produits associés: ${validFormats.length}/${formats.length}`);
  
  if (validFormats.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center">
          <div class="alert alert-warning">
            Aucun format avec produit associé n'a été trouvé. Veuillez d'abord créer des produits et leur associer des formats.
          </div>
        </td>
      </tr>
    `;
    // Afficher quand même le modal
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
    return;
  }
  
  // Compter combien de produits uniques sont représentés dans les formats
  const uniqueProducts = new Set();
  validFormats.forEach(format => {
    if (format.Product) uniqueProducts.add(format.Product.id);
    else if (format.product) uniqueProducts.add(format.product.id);
    else if (format.productId) uniqueProducts.add(format.productId);
  });
  
  console.log(`Produits uniques dans les formats: ${uniqueProducts.size}`);
  
  validFormats.forEach(format => {
    // Obtenir les informations du produit
    const { productName, productId } = getProductInfoFromFormat(format);
    
    // Vérifier si ce format a déjà  un stock pour ce bar
    let existingStock = null;
    try {
      // Vérifier que existingStocks est bien un tableau
      if (Array.isArray(existingStocks)) {
        existingStock = existingStocks.find(stock => 
          stock.formatId === format.id || 
          (stock.Format && stock.Format.id === format.id)
        );
      }
    } catch (err) {
      console.error('Erreur lors de la recherche d\'un stock existant:', err);
    }
    
    console.log(`Ajout de la ligne pour: ${productName}, format: ${format.name || format.size}, stock existant: ${existingStock ? 'oui' : 'non'}, productId: ${productId}`);
    
    // Valeurs par défaut ou existantes
    const currentQuantity = existingStock ? (existingStock.currentQuantity || 0) : 0;
    const minQuantity = existingStock ? (existingStock.minQuantity || 10) : 10;
    const idealQuantity = existingStock ? (existingStock.idealQuantity || 30) : 30;
    
    const row = document.createElement('tr');
    row.setAttribute('data-format-id', format.id);
    row.setAttribute('data-product-id', productId);
    row.setAttribute('data-product-name', productName);
    
    // Pour les éléments existants, sélectionner par défaut
    const isChecked = existingStock ? 'checked' : 'checked';
    
    row.innerHTML = `
      <td>
        <input type="checkbox" class="product-select-checkbox" data-format-id="${format.id}" ${isChecked}>
      </td>
      <td>${productName}</td>
      <td>${format.name || format.size || 'Format sans taille'} (${format.volume} ${format.unit})</td>
      <td>
        <input type="number" class="form-control init-current-quantity" 
               data-format-id="${format.id}" value="${currentQuantity}" min="0">
      </td>
      <td>
        <input type="number" class="form-control init-min-quantity" 
               data-format-id="${format.id}" value="${minQuantity}" min="0">
      </td>
      <td>
        <input type="number" class="form-control init-ideal-quantity" 
               data-format-id="${format.id}" value="${idealQuantity}" min="0">
      </td>
    `;
    
    tbody.appendChild(row);
  });
  
  if (tbody.children.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center">Aucun produit avec format n'a été trouvé</td>
      </tr>
    `;
  }
  
  // Ajouter le filtre de recherche
  const searchInput = document.getElementById('stock-init-search');
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      const searchTerm = this.value.toLowerCase();
      const rows = document.querySelectorAll('#initialize-stock-tbody tr');
      
      rows.forEach(row => {
        const productName = row.getAttribute('data-product-name')?.toLowerCase() || '';
        if (productName.includes(searchTerm)) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    });
  }
  
  // Gestionnaire pour le checkbox "sélectionner tout"
  const toggleAllCheckbox = document.getElementById('toggle-all-products');
  if (toggleAllCheckbox) {
    toggleAllCheckbox.addEventListener('change', function() {
      const checkboxes = document.querySelectorAll('.product-select-checkbox');
      checkboxes.forEach(checkbox => {
        checkbox.checked = this.checked;
      });
    });
  }
  
  // Boutons de sélection/désélection
  const selectAllBtn = document.getElementById('select-all-products-btn');
  if (selectAllBtn) {
    selectAllBtn.addEventListener('click', function() {
      const checkboxes = document.querySelectorAll('.product-select-checkbox');
      checkboxes.forEach(checkbox => {
        checkbox.checked = true;
      });
      if (toggleAllCheckbox) toggleAllCheckbox.checked = true;
    });
  }
  
  const unselectAllBtn = document.getElementById('unselect-all-products-btn');
  if (unselectAllBtn) {
    unselectAllBtn.addEventListener('click', function() {
      const checkboxes = document.querySelectorAll('.product-select-checkbox');
      checkboxes.forEach(checkbox => {
        checkbox.checked = false;
      });
      if (toggleAllCheckbox) toggleAllCheckbox.checked = false;
    });
  }
  
  // Ajouter l'événement pour sauvegarder tous les stocks
  const saveButton = document.getElementById('save-all-stocks-btn');
  if (saveButton) {
    saveButton.addEventListener('click', async function() {
      this.disabled = true;
      this.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Enregistrement...';
      
      try {
        await saveAllStocks(bar.id);
        // Fermer le modal après la sauvegarde
        const modal = bootstrap.Modal.getInstance(modalElement);
        modal.hide();
      } catch (error) {
        console.error('Erreur lors de la sauvegarde des stocks:', error);
      } finally {
        this.disabled = false;
        this.textContent = 'Enregistrer les stocks sélectionnés';
      }
    });
  }
  
  // Afficher le modal
  const modal = new bootstrap.Modal(modalElement);
  modal.show();
  
  // Rejoindre la salle du bar pour les mises À  jour en temps réel
  joinBarRoom(bar.id);
}

// Fonction pour sauvegarder tous les stocks
async function saveAllStocks(barId) {
  try {
    // Récupérer toutes les lignes de stock
    const rows = document.querySelectorAll('#initialize-stock-tbody tr');
    const stocks = [];
    let selectedCount = 0;
    
    console.log(`Préparation de l'initialisation des stocks pour ${rows.length} lignes`);
    
    rows.forEach(row => {
      const formatId = row.getAttribute('data-format-id');
      const productId = row.getAttribute('data-product-id');
      
      // Vérifier si la ligne est sélectionnée
      const checkbox = row.querySelector(`.product-select-checkbox[data-format-id="${formatId}"]`);
      if (!checkbox || !checkbox.checked) {
        console.log(`Ligne pour format ${formatId} non sélectionnée, ignorée`);
        return; // Ignorer les lignes non sélectionnées
      }
      
      // Récupérer les quantités pour les lignes sélectionnées
      const currentQuantityInput = row.querySelector(`.init-current-quantity[data-format-id="${formatId}"]`);
      const minQuantityInput = row.querySelector(`.init-min-quantity[data-format-id="${formatId}"]`);
      const idealQuantityInput = row.querySelector(`.init-ideal-quantity[data-format-id="${formatId}"]`);
      
      if (currentQuantityInput && minQuantityInput && idealQuantityInput) {
        const currentQuantity = parseInt(currentQuantityInput.value) || 0;
        const minQuantity = parseInt(minQuantityInput.value) || 0;
        const idealQuantity = parseInt(idealQuantityInput.value) || 0;
        
        const stockItem = {
          formatId: parseInt(formatId),
          currentQuantity,
          minQuantity,
          idealQuantity
        };
        
        // Ajouter productId si disponible
        if (productId) {
          stockItem.productId = parseInt(productId);
        }
        
        stocks.push(stockItem);
        
        console.log(`Préparé stock pour format ${formatId}, produit ${productId}, quantité ${currentQuantity}`);
        selectedCount++;
      } else {
        console.error(`Inputs manquants pour le format ${formatId}`);
      }
    });
    
    if (stocks.length === 0) {
      showAlert('Aucun produit sélectionné À  enregistrer', 'warning');
      return;
    }
    
    console.log(`Tentative d'initialisation de ${stocks.length} stocks pour le bar #${barId}`);
    console.log('Données À  envoyer:', { stocks });
    
    // Appeler l'API pour initialiser tous les stocks
    const result = await fetchWithAuth(`/stocks/initialize/${barId}`, {
      method: 'POST',
      body: JSON.stringify({ stocks })
    });
    
    console.log('Résultat de l\'initialisation des stocks:', result);
    
    if (!result) {
      showAlert('Erreur lors de l\'initialisation des stocks', 'danger');
      return;
    }
    
    // Plan de secours en cas d'échec de l'initialisation groupée
    if (!result.success) {
      console.log("À‰chec de l'initialisation groupée, tentative d'initialisation individuelle");
      
      let successCount = 0;
      let errorCount = 0;
      
      // Essayer d'initialiser chaque stock individuellement
      for (const stock of stocks) {
        try {
          console.log(`Tentative d'ajout individuel pour le format ${stock.formatId}`);
          const stockData = {
            barId: parseInt(barId),
            formatId: stock.formatId,
            productId: stock.productId, // inclus si disponible
            currentQuantity: stock.currentQuantity,
            minQuantity: stock.minQuantity,
            idealQuantity: stock.idealQuantity
          };
          
          const stockResult = await fetchWithAuth('/stocks', {
            method: 'POST',
            body: JSON.stringify(stockData)
          });
          
          if (stockResult && stockResult.success) {
            console.log(`Stock ajouté avec succès pour format ${stock.formatId}`);
            successCount++;
          } else {
            console.error(`À‰chec de l'ajout du stock pour format ${stock.formatId}:`, stockResult);
            errorCount++;
          }
        } catch (e) {
          console.error(`Erreur lors de l'ajout du stock pour format ${stock.formatId}:`, e);
          errorCount++;
        }
      }
      
      if (successCount > 0) {
        showAlert(`${successCount} produits ont été initialisés individuellement, ${errorCount} échecs`, errorCount > 0 ? 'warning' : 'success');
        
        // Recharger les stocks
        const stockBarSelect = document.getElementById('stock-bar-select');
        if (stockBarSelect && stockBarSelect.value === barId.toString()) {
          await loadStocksTable(barId);
        }
        
        return true;
      } else {
        showAlert(`À‰chec de l'initialisation de tous les stocks`, 'danger');
        return false;
      }
    }
    
    const successCount = result.data.length;
    const errorCount = result.errors ? result.errors.length : 0;
    
    let message = `${successCount} produits ont été initialisés avec succès`;
    if (errorCount > 0) {
      message += `, mais ${errorCount} erreurs sont survenues`;
    }
    
    showAlert(message, errorCount > 0 ? 'warning' : 'success');
    
    // Recharger les stocks pour le bar sélectionné
    const stockBarSelect = document.getElementById('stock-bar-select');
    if (stockBarSelect && stockBarSelect.value === barId.toString()) {
      await loadStocksTable(barId);
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des stocks:', error);
    showAlert('Erreur lors de la sauvegarde des stocks', 'danger');
    return false;
  }
}

// Mettre À  jour l'interface pour les stocks
function enhanceStockUI() {
  // Ajouter un bouton pour initialiser tous les stocks
  const stockBarSelect = document.getElementById('stock-bar-select');
  
  if (stockBarSelect) {
    // Vérifier si le bouton existe déjà 
    if (!document.getElementById('initialize-all-stocks-btn')) {
      const barSelectContainer = stockBarSelect.parentElement;
      
      if (barSelectContainer) {
        // Créer un groupe de formulaire horizontal
        barSelectContainer.className = 'col-md-6 d-flex align-items-end';
        
        // Ajouter le bouton d'initialisation
        const btnHTML = `
          <button type="button" class="btn btn-primary ms-2" id="initialize-all-stocks-btn">
            <i class="bi bi-boxes"></i> Initialiser tous les produits
          </button>
        `;
        
        barSelectContainer.insertAdjacentHTML('beforeend', btnHTML);
        
        // Ajouter l'événement au bouton
        document.getElementById('initialize-all-stocks-btn').addEventListener('click', function() {
          const selectedBarId = stockBarSelect.value;
          
          if (!selectedBarId) {
            showAlert('Veuillez sélectionner un bar pour initialiser les stocks', 'warning');
            return;
          }
          
          openInitializeStockModal(selectedBarId);
        });
      }
    }
    
    // Ajouter une section pour le récapitulatif des produits À  recharger et le bouton de fin de service
    if (!document.getElementById('restock-summary-section') && !document.getElementById('end-shift-global-btn')) {
      const stocksPage = document.getElementById('stocks-page');
      const stocksTable = document.querySelector('#stocks-page .table-responsive');
      
      if (stocksPage && stocksTable) {
        // Ajouter un bouton de fin de service global après le tableau des stocks
        const endShiftBtnContainer = document.createElement('div');
        endShiftBtnContainer.className = 'text-end mt-4';
        endShiftBtnContainer.innerHTML = `
          <button type="button" class="btn btn-warning" id="end-shift-global-btn">
            <i class="bi bi-clock-history"></i> Enregistrer une fin de service
          </button>
        `;
        
        // Ajouter le bouton après le tableau
        stocksTable.parentNode.insertBefore(endShiftBtnContainer, stocksTable.nextSibling);
        
        // Ajouter l'événement au bouton
        document.getElementById('end-shift-global-btn').addEventListener('click', function() {
          const selectedBarId = stockBarSelect.value;
          
          if (!selectedBarId) {
            showAlert('Veuillez sélectionner un bar pour enregistrer une fin de service', 'warning');
            return;
          }
          
          openGlobalShiftModal(selectedBarId);
        });
        
        // Ajouter une section pour le récapitulatif des produits À  recharger
        const restockSummarySection = document.createElement('div');
        restockSummarySection.className = 'card mt-4';
        restockSummarySection.id = 'restock-summary-section';
        restockSummarySection.innerHTML = `
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Produits À  recharger</h5>
            <button type="button" class="btn btn-sm btn-outline-primary" id="refresh-restock-summary-btn">
              <i class="bi bi-arrow-clockwise"></i> Actualiser
            </button>
          </div>
          <div class="card-body">
            <div id="restock-summary-content">
              <p class="text-muted">Sélectionnez un bar pour voir les produits À  recharger.</p>
            </div>
          </div>
        `;
        
        // Ajouter la section après le bouton de fin de service
        endShiftBtnContainer.parentNode.insertBefore(restockSummarySection, endShiftBtnContainer.nextSibling);
        
        // Ajouter l'événement au bouton d'actualisation
        document.getElementById('refresh-restock-summary-btn').addEventListener('click', function() {
          const selectedBarId = stockBarSelect.value;
          
          if (selectedBarId) {
            loadRestockSummary(selectedBarId);
          } else {
            showAlert('Veuillez sélectionner un bar pour voir les produits À  recharger', 'warning');
          }
        });
        
        // Si un bar est déjà  sélectionné, charger le récapitulatif
        if (stockBarSelect.value) {
          loadRestockSummary(stockBarSelect.value);
        }
      }
    }
  }
  
  // Ajouter la classe pour les lignes de stock avec ID de stock
  const stockRows = document.querySelectorAll('#stocks-table-body tr');
  
  stockRows.forEach(row => {
    const updateBtn = row.querySelector('.update-stock-btn');
    
    if (updateBtn) {
      const stockId = updateBtn.getAttribute('data-stock-id');
      if (stockId) {
        row.setAttribute('data-stock-id', stockId);
      }
    }
  });
  
  // Ajouter des classes aux cellules pour faciliter les mises À  jour
  stockRows.forEach(row => {
    const cells = row.querySelectorAll('td');
    
    // Ajouter des classes aux cellules appropriées (en supposant l'ordre des colonnes)
    if (cells.length >= 5) { // Produit, Format, Quantité actuelle, Quantité minimale, Quantité idéale, Statut, Actions
      const quantityCell = cells[3]; // Index 3 pour la quantité actuelle
      const minQuantityCell = cells[4]; // Index 4 pour la quantité minimale
      const idealQuantityCell = cells[5]; // Index 5 pour la quantité idéale
      
      if (quantityCell) quantityCell.classList.add('stock-quantity-cell');
      if (minQuantityCell) minQuantityCell.classList.add('min-quantity-cell');
      if (idealQuantityCell) idealQuantityCell.classList.add('ideal-quantity-cell');
      
      // Ajouter une cellule de statut si elle existe
      if (cells.length > 6) {
        cells[6].classList.add('stock-status');
      }
    }
  });
  
  // Initialiser la connexion Socket.IO
  initializeSocketConnection();
  
  // Rejoindre la salle du bar sélectionné
  const selectedBarId = stockBarSelect ? stockBarSelect.value : null;
  if (selectedBarId) {
    joinBarRoom(selectedBarId);
  }
}

// Charger le récapitulatif des produits À  recharger
async function loadRestockSummary(barId) {
  console.log('Fonction loadRestockSummary appelée pour le bar', barId);
  
  // Récupérer le conteneur du résumé au lieu du tableau principal
  const restockSummaryContent = document.getElementById('restock-summary-content');
  
  if (!restockSummaryContent) {
    console.error('À‰lément restock-summary-content non trouvé');
    return;
  }
  
  // Afficher un indicateur de chargement
  restockSummaryContent.innerHTML = '<div class="text-center"><div class="spinner-border spinner-border-sm" role="status"></div> Chargement des produits À  recharger...</div>';
  
  try {
    // Récupérer les informations du bar
    const barResponse = await fetchWithAuth(`/bars/${barId}`);
    
    if (!barResponse || !barResponse.success) {
      console.error('À‰chec de récupération des informations du bar');
      restockSummaryContent.innerHTML = '<div class="alert alert-danger">Erreur lors du chargement des informations du bar</div>';
      return;
    }
    
    const bar = barResponse.data;
    
    // Récupérer tous les stocks du bar
    const stocksResponse = await fetchWithAuth(`/stocks?barId=${barId}`);
    
    if (!stocksResponse || !stocksResponse.success) {
      console.error('À‰chec de récupération des stocks');
      restockSummaryContent.innerHTML = '<div class="alert alert-danger">Erreur lors du chargement des stocks</div>';
      return;
    }
    
    const allStocks = stocksResponse.data || [];
    
    // S'il n'y a pas de stocks
    if (allStocks.length === 0) {
      restockSummaryContent.innerHTML = '<div class="alert alert-info">Aucun produit n\'est enregistré dans ce bar</div>';
      return;
    }
    
    let html = '<table class="table table-sm"><thead><tr>' +
               '<th>Produit</th><th>Format</th><th>Quantité</th><th>Quantité plein</th><th>A recharger</th>' +
               '</tr></thead><tbody>';
    
    let totalToOrder = 0;
    let productsToRestock = 0;
    
    allStocks.forEach(stock => {
      if (!stock.Format || !stock.Format.Product) {
        console.error('Format ou produit manquant dans le stock:', stock);
        return;
      }
      
      const product = stock.Format.Product;
      const format = stock.Format;
      
      // S'assurer que les valeurs sont des nombres ou 0 par défaut
      const currentQuantity = (stock.currentQuantity !== undefined && stock.currentQuantity !== null) 
                              ? stock.currentQuantity : 0;
      const idealQuantity = (stock.idealQuantity !== undefined && stock.idealQuantity !== null) 
                          ? stock.idealQuantity : 30;
      
      // Nouvelle logique pour calculer la quantité À  recharger
      let toOrder = 0;
      if (currentQuantity === 0) {
        // Si quantité actuelle est 0, recharger la quantité plein
        toOrder = idealQuantity;
      } else {
        // Sinon, recharger la différence entre plein et actuelle
        toOrder = Math.max(0, idealQuantity - currentQuantity);
      }
      
      // Déterminer la classe CSS selon le niveau de stock
      let rowClass = '';
      if (toOrder > 0) {
        totalToOrder += toOrder;
        productsToRestock++;
        rowClass = 'table-warning'; // Produit sous le seuil idéal
      } else if (currentQuantity >= idealQuantity) {
        rowClass = 'table-success'; // Produit bien approvisionné
      }
      
      html += `
        <tr class="${rowClass}">
          <td>${product.name} ${product.brand ? `(${product.brand})` : ''}</td>
          <td>${format.size || format.name} ${format.volume ? `${format.volume} ${format.unit}` : ''}</td>
          <td>${currentQuantity}</td>
          <td>${idealQuantity}</td>
          <td><strong>${toOrder}</strong></td>
        </tr>
      `;
    });
    
    // Ajouter une ligne de total si des produits sont À  recharger
    if (totalToOrder > 0) {
      html += `
        <tr class="table-primary">
          <td colspan="4" class="text-end"><strong>Total À  recharger:</strong></td>
          <td><strong>${totalToOrder}</strong></td>
        </tr>
      `;
    }
    
    html += '</tbody></table>';
    
    // Ajouter une information sur le nombre de produits
    const statusHTML = `
      <div class="alert ${productsToRestock > 0 ? 'alert-warning' : 'alert-success'} mt-2">
        ${productsToRestock > 0 ? 
          `<i class="bi bi-exclamation-triangle me-2"></i>${productsToRestock} produit(s) À  recharger sur ${allStocks.length} produits au total` : 
          `<i class="bi bi-check-circle me-2"></i>Tous les ${allStocks.length} produits sont À  niveau`}
      </div>
    `;
    
    // Mettre À  jour le contenu
    restockSummaryContent.innerHTML = html + statusHTML;
    
  } catch (error) {
    console.error('Erreur dans loadRestockSummary:', error);
    restockSummaryContent.innerHTML = `<div class="alert alert-danger">Erreur: ${error.message}</div>`;
  }
}

// Ouvrir le modal pour enregistrer une fin de service globale
async function openGlobalShiftModal(barId) {
  try {
    // Récupérer les informations du bar
    const barResponse = await fetchWithAuth(`/bars/${barId}`);
    
    if (!barResponse || !barResponse.success) {
      showAlert('Erreur lors du chargement des informations du bar', 'danger');
      return;
    }
    
    const bar = barResponse.data;
    
    // Créer le modal de fin de service globale s'il n'existe pas
    let modalElement = document.getElementById('global-shift-modal');
    
    if (!modalElement) {
      // Créer le modal
      const modalHTML = `
        <div class="modal fade" id="global-shift-modal" tabindex="-1">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title" id="global-shift-modal-title">Enregistrer une fin de service</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <form id="global-shift-form">
                  <input type="hidden" id="global-shift-bar-id">
                  
                  <div class="row mb-3">
                    <div class="col-md-6">
                      <label for="global-shift-date" class="form-label">Date</label>
                      <input type="date" class="form-control" id="global-shift-date" required>
                    </div>
                    <div class="col-md-6">
                      <label for="global-shift-name" class="form-label">Nom du service</label>
                      <input type="text" class="form-control" id="global-shift-name" placeholder="ex: Service du soir" required>
                    </div>
                  </div>
                  
                  <div class="mb-3">
                    <label for="global-shift-notes" class="form-label">Notes (facultatif)</label>
                    <textarea class="form-control" id="global-shift-notes" rows="2"></textarea>
                  </div>
                  
                  <div class="table-responsive">
                    <table class="table table-sm">
                      <thead>
                        <tr>
                          <th>
                            <div class="form-check">
                              <input class="form-check-input" type="checkbox" id="select-all-products-shift" checked>
                              <label class="form-check-label" for="select-all-products-shift">Produit</label>
                            </div>
                          </th>
                          <th>Format</th>
                          <th>Quantité actuelle</th>
                          <th>Nouvelle quantité</th>
                        </tr>
                      </thead>
                      <tbody id="global-shift-tbody">
                        <!-- Les lignes seront ajoutées dynamiquement -->
                      </tbody>
                    </table>
                  </div>
                </form>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                <button type="button" class="btn btn-primary" id="save-global-shift-btn">Enregistrer le service</button>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Ajouter le modal au body
      document.body.insertAdjacentHTML('beforeend', modalHTML);
      modalElement = document.getElementById('global-shift-modal');
    }
    
    const globalShiftBarIdInput = document.getElementById('global-shift-bar-id');
    const globalShiftDateInput = document.getElementById('global-shift-date');
    const globalShiftTbody = document.getElementById('global-shift-tbody');
    
    // Réinitialiser le formulaire
    const form = document.getElementById('global-shift-form');
    if (form) form.reset();
    
    // Définir l'ID du bar
    if (globalShiftBarIdInput) {
      globalShiftBarIdInput.value = barId;
    }
    
    // Définir la date du jour
    if (globalShiftDateInput) {
      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0];
      globalShiftDateInput.value = formattedDate;
    }
    
    // Titre du modal
    const modalTitle = document.getElementById('global-shift-modal-title');
    if (modalTitle) {
      modalTitle.textContent = `Enregistrer une fin de service pour ${bar.name}`;
    }
    
    // Charger les stocks du bar
    const stocksResponse = await fetchWithAuth(`/stocks?barId=${barId}`);
    
    if (!stocksResponse || !stocksResponse.success) {
      showAlert('Erreur lors du chargement des stocks du bar', 'danger');
      return;
    }
    
    const stocks = stocksResponse.data || [];
    
    if (stocks.length === 0) {
      showAlert('Aucun stock trouvé pour ce bar', 'warning');
      return;
    }
    
    // Remplir le tableau des stocks
    if (globalShiftTbody) {
      globalShiftTbody.innerHTML = '';
      
      stocks.forEach(stock => {
        const product = stock.Format.Product;
        const format = stock.Format;
        const currentQuantity = stock.currentQuantity || 0;
        
        const row = document.createElement('tr');
        row.setAttribute('data-stock-id', stock.id);
        
        row.innerHTML = `
          <td>
            <div class="form-check">
              <input class="form-check-input stock-select-checkbox" type="checkbox" data-stock-id="${stock.id}" checked>
              <label class="form-check-label" for="stock-${stock.id}">
                ${product.name} ${product.brand ? `(${product.brand})` : ''}
              </label>
            </div>
          </td>
          <td>${format.size || format.name} ${format.unit}</td>
          <td>${currentQuantity}</td>
          <td>
            <input type="number" class="form-control form-control-sm new-quantity" 
                  data-stock-id="${stock.id}" 
                  data-current-quantity="${currentQuantity}"
                  value="${currentQuantity}" min="0">
          </td>
        `;
        
        globalShiftTbody.appendChild(row);
      });
      
      // Ajouter l'événement pour la case À  cocher "Sélectionner tout"
      const selectAllCheckbox = document.getElementById('select-all-products-shift');
      if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
          const checkboxes = document.querySelectorAll('.stock-select-checkbox');
          checkboxes.forEach(checkbox => {
            checkbox.checked = this.checked;
          });
        });
      }
    }
    
    // Ajouter l'événement pour le bouton de sauvegarde
    const saveButton = document.getElementById('save-global-shift-btn');
    console.log('*** DEBUG: Bouton save-global-shift-btn dans openGlobalShiftModal:', !!saveButton);
    
    if (saveButton) {
      // Supprimer l'ancien gestionnaire d'événement s'il existe
      const newSaveButton = saveButton.cloneNode(true);
      saveButton.parentNode.replaceChild(newSaveButton, saveButton);
      console.log('*** DEBUG: Ancien gestionnaire supprimé, nouveau bouton créé');
      
      // Ajouter le nouveau gestionnaire d'événement
      newSaveButton.addEventListener('click', function(e) {
        console.log('*** DEBUG: Bouton Save cliqué!', e);
        saveGlobalShift();
      });
      console.log('*** DEBUG: Nouveau gestionnaire d\'événement ajouté');
    }
    
    // Afficher le modal
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
  } catch (error) {
    console.error('Erreur lors de l\'ouverture du modal de fin de service globale:', error);
    showAlert('Erreur lors de l\'ouverture du modal de fin de service', 'danger');
  }
}

// Sauvegarder une fin de service globale
async function saveGlobalShift() {
  console.log('Sauvegarde de la fin de service global');
  try {
    // Désactiver le bouton de sauvegarde
    const saveButton = document.getElementById('save-global-shift-btn');
    
    if (saveButton) {
      saveButton.disabled = true;
      saveButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Enregistrement...';
    }
    
    // Récupérer les valeurs du formulaire
    const barId = document.getElementById('global-shift-bar-id').value;
    const shiftDate = document.getElementById('global-shift-date').value;
    const shiftName = document.getElementById('global-shift-name').value;
    const notes = document.getElementById('global-shift-notes').value;
    
    // Valider les valeurs
    if (!barId || !shiftDate) {
      showAlert('Veuillez remplir les champs obligatoires', 'warning');
      if (saveButton) {
        saveButton.disabled = false;
        saveButton.textContent = 'Enregistrer le service';
      }
      return;
    }
    
    // Récupérer tous les stocks modifiés
    const stockRows = document.querySelectorAll('#global-shift-table tbody tr');
    const selectedStocks = [];
    
    stockRows.forEach(row => {
      const checkbox = row.querySelector('input[type="checkbox"]');
      
      if (checkbox && checkbox.checked) {
        const stockId = checkbox.getAttribute('data-stock-id');
        const oldQuantity = parseInt(row.querySelector('.old-quantity').textContent);
        const newQuantityInput = row.querySelector('.new-quantity');
        const newQuantity = newQuantityInput ? parseInt(newQuantityInput.value) : 0;
        
        // Vérifier si la nouvelle quantité est différente de l'ancienne
        if (newQuantity !== undefined && !isNaN(newQuantity)) {
          selectedStocks.push({
            stockId,
            oldQuantity,
            newQuantity
          });
        }
      }
    });
    
    // Vérifier qu'au moins un stock est sélectionné
    if (selectedStocks.length === 0) {
      showAlert('Veuillez sélectionner au moins un produit', 'warning');
      if (saveButton) {
        saveButton.disabled = false;
        saveButton.textContent = 'Enregistrer le service';
      }
      return;
    }
    
    // Utiliser la méthode de sauvegarde individuelle
    const result = await saveGlobalShiftIndividually(
      barId,
      shiftDate,
      shiftName,
      notes,
      selectedStocks
    );
    
    if (result && result.success) {
      // Fermer le modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('global-shift-modal'));
      if (modal) {
        modal.hide();
      }
      
      // Recharger les données
      setTimeout(() => {
        console.log('Actualisation des données après sauvegarde');
        loadStocksTable(barId);
        
        // Actualiser aussi le tableau des produits À  recharger sur le dashboard
        const savedBarId = localStorage.getItem('selectedBarId');
        if (savedBarId) {
          console.log('Actualisation des produits À  recharger pour bar:', savedBarId);
          loadRestockItems(savedBarId);
        }
        
        // Actualiser le résumé des produits À  recharger dans la page des stocks
        console.log('Actualisation du résumé des produits À  recharger pour bar:', barId);
        loadRestockSummary(barId);
      }, 1000); // Attendre un peu plus longtemps pour s'assurer que les mises À  jour sont terminées
    }
    
    // Réactiver le bouton
    if (saveButton) {
      saveButton.disabled = false;
      saveButton.textContent = 'Enregistrer le service';
    }
  } catch (error) {
    console.error('Exception dans saveGlobalShift:', error);
    showAlert('Erreur lors de l\'enregistrement de la fin de service: ' + error.message, 'danger');
    
    // Réactiver le bouton en cas d'erreur
    const saveButton = document.getElementById('save-global-shift-btn');
    if (saveButton) {
      saveButton.disabled = false;
      saveButton.textContent = 'Enregistrer le service';
    }
  }
}

// Méthode de secours pour enregistrer les stocks individuellement
async function saveGlobalShiftIndividually(barId, shiftDate, shiftName, notes, selectedStocks) {
  console.log('*** DEBUG: Fonction saveGlobalShiftIndividually appelée avec', selectedStocks.length, 'stocks');
  
  try {
    let successCount = 0;
    let failureCount = 0;
    
    for (const stock of selectedStocks) {
      // Procéder avec la mise À  jour, même si la quantité n'a pas changé
      console.log(`*** DEBUG: Traitement du stock #${stock.stockId}: ${stock.previousQuantity} -> ${stock.newQuantity}`);
      
      // Construire les données pour ce stock
      const stockHistoryData = {
        stockId: stock.stockId,
        barId: parseInt(barId),
        previousQuantity: stock.previousQuantity,
        newQuantity: stock.newQuantity,
        shiftDate,
        shiftName,
        notes
      };
      
      console.log('*** DEBUG: Données À  envoyer pour ce stock:', stockHistoryData);
      
      // Envoyer la requête
      try {
        const response = await fetchWithAuth('/stock-history', {
          method: 'POST',
          body: JSON.stringify(stockHistoryData)
        });
        
        console.log(`*** DEBUG: Réponse pour le stock #${stock.stockId}:`, response);
        
        if (response && response.success) {
          successCount++;
          
          // Mise À  jour supplémentaire du stock lui-même pour s'assurer que la quantité est correcte
          try {
            const stockUpdateResponse = await fetchWithAuth(`/stocks/${stock.stockId}`, {
              method: 'PUT',
              body: JSON.stringify({
                currentQuantity: stock.newQuantity
              })
            });
            
            console.log(`*** DEBUG: Mise À  jour directe du stock #${stock.stockId}:`, stockUpdateResponse);
          } catch (updateError) {
            console.error(`*** DEBUG: Erreur lors de la mise À  jour directe du stock #${stock.stockId}:`, updateError);
          }
        } else {
          failureCount++;
          console.error(`*** DEBUG: Erreur lors de l'enregistrement de l'historique pour le stock #${stock.stockId}:`, 
                        response?.message || 'Réponse non valide');
        }
      } catch (stockError) {
        failureCount++;
        console.error(`*** DEBUG: Exception lors de l'enregistrement du stock #${stock.stockId}:`, stockError);
      }
    }
    
    console.log(`*** DEBUG: Résultat final: ${successCount} succès, ${failureCount} échecs`);
    
    // Afficher le résultat
    if (failureCount === 0 && successCount > 0) {
      showAlert(`Fin de service enregistrée avec succès pour ${successCount} produits`, 'success');
      return { success: true, message: `${successCount} produits mis À  jour` };
    } else if (successCount > 0) {
      showAlert(`Fin de service partiellement enregistrée: ${successCount} produits mis À  jour, ${failureCount} échecs`, 'warning');
      return { success: true, partial: true, message: `${successCount} produits mis À  jour, ${failureCount} échecs` };
    } else {
      showAlert('Aucun produit n\'a pu être mis À  jour', 'danger');
      return { success: false, message: 'Aucun produit mis À  jour' };
    }
  } catch (error) {
    console.error('*** DEBUG: Exception globale dans saveGlobalShiftIndividually:', error);
    showAlert('Erreur lors de l\'enregistrement de la fin de service: ' + error.message, 'danger');
    return { success: false, error: error.message };
  }
}

// Ajouter une règle CSS pour la mise en évidence des mises à jour
const style = document.createElement('style');
style.textContent = `
  .highlight-update {
    animation: highlight-row 2s ease-in-out;
  }
  
  @keyframes highlight-row {
    0% { background-color: rgba(0, 123, 255, 0.1); }
    50% { background-color: rgba(0, 123, 255, 0.2); }
    100% { background-color: transparent; }
  }
`;
document.head.appendChild(style);

// Event listeners pour le bouton "Ajouter un produit au stock"
document.addEventListener('DOMContentLoaded', function() {
  console.log('🔧 Initialisation des event listeners pour ajouter produit au stock');
  
  // Event listener pour le bouton d'ouverture de la modal
  const addProductBtn = document.getElementById('add-product-to-bar-btn');
  if (addProductBtn) {
    addProductBtn.addEventListener('click', function() {
      console.log('🔘 Clic sur bouton ajouter produit au stock');
      
      // Charger la liste des bars dans le dropdown
      loadBarsForProductAddition();
      
      // Ouvrir la modal
      const modal = new bootstrap.Modal(document.getElementById('add-product-to-bar-modal'));
      modal.show();
    });
    console.log('✅ Event listener ajouté sur bouton add-product-to-bar-btn');
  } else {
    console.error('❌ Bouton add-product-to-bar-btn introuvable !');
  }
  
  // Event listener pour la soumission du formulaire
  const addProductForm = document.getElementById('add-product-to-bar-form');
  if (addProductForm) {
    addProductForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      console.log('📝 Soumission formulaire ajouter produit au stock');
      
      try {
        // Récupérer les données du formulaire
        const formData = new FormData(addProductForm);
        const barId = document.getElementById('new-product-bar').value;
        const productName = document.getElementById('new-product-name').value.trim();
        const productBrand = document.getElementById('new-product-brand').value.trim();
        const productCategory = document.getElementById('new-product-category').value;
        const initialQuantity = parseInt(document.getElementById('new-product-quantity').value) || 0;
        const minQuantity = parseInt(document.getElementById('new-product-min-quantity').value) || 10;
        const idealQuantity = parseInt(document.getElementById('new-product-ideal-quantity').value) || 30;
        
        // Validation
        if (!barId) {
          showAlert('Veuillez sélectionner un bar', 'warning');
          return;
        }
        
        if (!productName) {
          showAlert('Veuillez saisir le nom du produit', 'warning');
          return;
        }
        
        console.log('📊 Données du formulaire:', {
          barId,
          productName,
          productBrand,
          productCategory,
          initialQuantity,
          minQuantity,
          idealQuantity
        });
        
        // Préparer les données du produit
        const productData = {
          name: productName,
          brand: productBrand,
          category: productCategory,
          currentQuantity: initialQuantity,
          minThreshold: minQuantity,  // Utiliser minThreshold au lieu de minQuantity
          maxThreshold: idealQuantity  // Utiliser maxThreshold au lieu de idealQuantity
        };
        
        // Appeler la fonction addProductToBar
        await addProductToBar(barId, productData);
        
        // Fermer la modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('add-product-to-bar-modal'));
        if (modal) {
          modal.hide();
        }
        
        // Réinitialiser le formulaire
        addProductForm.reset();
        
        // Recharger les stocks si on est sur la page stocks
        if (window.location.hash === '#stocks') {
          const selectedBarId = document.getElementById('stock-bar-filter')?.value;
          if (selectedBarId) {
            loadStocksTable(selectedBarId);
          }
        }
        
        // Recharger le dashboard si on est sur la page principale
        if (window.location.hash === '#dashboard' || window.location.hash === '') {
          loadDashboard();
        }
        
        console.log('✅ Produit ajouté avec succès !');
        
      } catch (error) {
        console.error('❌ Erreur lors de l\'ajout du produit:', error);
        showAlert('Erreur lors de l\'ajout du produit: ' + error.message, 'danger');
      }
    });
    console.log('✅ Event listener ajouté sur formulaire add-product-to-bar-form');
  } else {
    console.error('❌ Formulaire add-product-to-bar-form introuvable !');
  }
});

// Fonction pour charger la liste des bars dans le dropdown de la modal
async function loadBarsForProductAddition() {
  try {
    console.log('📋 Chargement des bars pour ajout de produit');
    
    const response = await fetchWithAuth('/bars');
    if (response && response.success) {
      const barsSelect = document.getElementById('new-product-bar');
      if (barsSelect) {
        // Vider les options existantes (sauf la première)
        barsSelect.innerHTML = '<option value="">Sélectionnez un bar</option>';
        
        // Ajouter les bars
        response.data.forEach(bar => {
          const option = document.createElement('option');
          option.value = bar.id;
          option.textContent = bar.name;
          barsSelect.appendChild(option);
        });
        
        console.log(`✅ ${response.data.length} bars chargés dans le dropdown`);
      }
    } else {
      console.error('❌ Erreur lors du chargement des bars:', response);
      showAlert('Erreur lors du chargement des bars', 'danger');
    }
  } catch (error) {
    console.error('❌ Erreur lors du chargement des bars:', error);
    showAlert('Erreur lors du chargement des bars', 'danger');
  }
}
