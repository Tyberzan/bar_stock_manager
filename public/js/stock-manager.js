// Gestionnaire de stock pour les bars
// RÃ©utiliser la variable API_URL dÃ©jÃ  dÃ©finie dans auth.js
// const API_URL = '/api';

// Variables globales pour Ã©viter les initialisations multiples
let stockManagerInitialized = false;
let socket = null; // Variable globale pour stocker la connexion Socket.IO

// Fonction pour charger les stocks d'un bar spÃ©cifique
async function loadBarStock(barId) {
  try {
    const response = await fetchWithAuth(`/stocks?barId=${barId}`);
    console.log('RÃ©ponse de chargement des stocks:', response);
    
    // Extraction des stocks selon le format de rÃ©ponse
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
    
    console.log(`Stocks chargÃ©s pour le bar #${barId}:`, stocks.length);
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
  // VÃ©rifier l'authentification avant de faire l'appel API
  if (!checkAuth()) {
    console.log('Utilisateur non authentifiÃ©, chargement des formats diffÃ©rÃ©');
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
    console.log('RÃ©ponse brute de l\'API formats:', response);
    
    // Extraction des formats en fonction du format de rÃ©ponse
    let formats = [];
    if (response) {
      if (Array.isArray(response)) {
        formats = response;
      } else if (response.success && Array.isArray(response.data)) {
        formats = response.data;
      } else if (response.formats && Array.isArray(response.formats)) {
        formats = response.formats;
      } else {
        console.warn('Format de rÃ©ponse inattendu pour les formats:', response);
      }
    }
    
    console.log('Formats extraits:', formats);
    
    if (!formats || formats.length === 0) {
      console.log('Aucun format trouvÃ©, tentative de crÃ©ation de formats par dÃ©faut');
      // Tenter de crÃ©er des formats par dÃ©faut si nÃ©cessaire
      await createDefaultFormats();
      return;
    }
    
    const formatSelect = document.getElementById('new-product-format');
    if (formatSelect) {
      formatSelect.innerHTML = '';
      
      // Si aucun format n'est disponible, ajouter un message et tenter d'en crÃ©er
      if (formats.length === 0) {
        console.log('Aucun format disponible, crÃ©ation de formats par dÃ©faut');
        await createDefaultFormats();
        
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Aucun format disponible - CrÃ©ez un format d\'abord';
        option.disabled = true;
        option.selected = true;
        formatSelect.appendChild(option);
        
        // DÃ©sactiver le formulaire d'ajout
        const submitBtn = document.querySelector('#add-product-to-bar-form button[type="submit"]');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.title = 'Veuillez crÃ©er un format avant d\'ajouter un produit';
        }
        
        showAlert('Aucun format disponible. Veuillez crÃ©er un format pour les produits d\'abord.', 'warning');
      } else {
        // Ajouter les formats disponibles
        formats.forEach(format => {
          try {
            const option = document.createElement('option');
            option.value = format.id;
            
            // Gestion de diffÃ©rentes structures de donnÃ©es possibles
            if (format.name) {
              option.textContent = `${format.name} (${format.volume} ${format.unit}) - ${format.packaging || 'bouteille'}`;
            } else if (format.size) {
              option.textContent = `${format.size} (${format.volume} ${format.unit}) - ${format.packaging || 'bouteille'}`;
            } else {
              option.textContent = `Format #${format.id} (${format.volume || '?'} ${format.unit || '?'}) - ${format.packaging || 'bouteille'}`;
            }
            
            formatSelect.appendChild(option);
            console.log(`Format ajoutÃ© au sÃ©lecteur: ${option.textContent}`);
          } catch (err) {
            console.error('Erreur lors de l\'ajout d\'un format au sÃ©lecteur:', err, format);
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
      console.error('SÃ©lecteur de format non trouvÃ© dans le DOM');
    }
  } catch (error) {
    console.error('Erreur lors du chargement des formats:', error);
    showAlert('Erreur lors du chargement des formats de produits', 'danger');
    
    // Tenter de crÃ©er des formats par dÃ©faut
    await createDefaultFormats();
  }
}

// Fonction pour crÃ©er des formats par dÃ©faut
async function createDefaultFormats() {
  // VÃ©rifier l'authentification avant de faire l'appel API
  if (!checkAuth()) {
    console.log('Utilisateur non authentifiÃ©, crÃ©ation de formats par dÃ©faut diffÃ©rÃ©e');
    return;
  }
  
  const defaultFormats = [
    { size: '33cl', unit: 'cl', volume: 33, packaging: 'canette' },
    { size: '50cl', unit: 'cl', volume: 50, packaging: 'bouteille' },
    { size: '75cl', unit: 'cl', volume: 75, packaging: 'bouteille' },
    { size: '1L', unit: 'L', volume: 100, packaging: 'bouteille' },
    { size: 'Canette', unit: 'unitÃ©', volume: 33, packaging: 'canette' },
    { size: 'Bouteille', unit: 'unitÃ©', volume: 75, packaging: 'bouteille' }
  ];
  
  try {
    console.log('Tentative de crÃ©ation de formats par dÃ©faut...');
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
          console.log(`Format crÃ©Ã©: ${format.size} (${format.packaging})`);
          createdFormats.push(result.data);
        }
      } catch (err) {
        console.error(`Erreur lors de la crÃ©ation du format ${format.size}:`, err);
      }
    }
    
    if (createdFormats.length > 0) {
      showAlert(`${createdFormats.length} formats par dÃ©faut ont Ã©tÃ© crÃ©Ã©s`, 'success');
      
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
    console.error('Erreur lors de la crÃ©ation des formats par dÃ©faut:', error);
  }
}

// Fonction pour ouvrir le modal de crÃ©ation de format
function openNewFormatModal() {
  // VÃ©rifier si la fonction openFormatModal existe (dÃ©finie dans app.js)
  if (typeof openFormatModal === 'function') {
    // CrÃ©er un nouveau format sans produit spÃ©cifique
    // OpenFormatModal sera mis Ã  jour pour gÃ©rer ce cas
    openFormatModal(null, null, true);
  } else {
    console.error('La fonction openFormatModal n\'existe pas');
    createFormatDirectly();
  }
}

// Fonction pour crÃ©er un format directement si openFormatModal n'est pas disponible
async function createFormatDirectly() {
  // VÃ©rifier l'authentification avant de faire l'appel API
  if (!checkAuth()) {
    console.log('Utilisateur non authentifiÃ©, crÃ©ation de format diffÃ©rÃ©e');
    showAlert('Veuillez vous connecter pour crÃ©er un format', 'warning');
    return;
  }
  
  const size = prompt('Taille du format (ex: 33cl, 75cl, 1L):');
  if (!size) return;
  
  const units = ['cl', 'ml', 'L', 'bouteille', 'canette', 'unitÃ©'];
  let unit = prompt(`UnitÃ© (${units.join(', ')}):`, 'cl');
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
      showAlert(`Format ${size} (${packaging}) crÃ©Ã© avec succÃ¨s`, 'success');
      // Ne recharger les formats que si l'élément DOM existe
      const formatSelect = document.getElementById('new-product-format');
      if (formatSelect) {
        loadProductFormats();
      }
    } else {
      showAlert('Erreur lors de la crÃ©ation du format', 'danger');
    }
  } catch (error) {
    console.error('Erreur lors de la crÃ©ation du format:', error);
    showAlert('Erreur lors de la crÃ©ation du format', 'danger');
  }
}

// Fonction pour ajouter un nouveau produit au stock d'un bar
async function addProductToBar(barId, productData) {
  console.log('Ajout de produit au bar:', { barId, productData });
  
  try {
    // Rechercher si le produit existe dÃ©jÃ 
    const productResponse = await fetchWithAuth(`/products?name=${encodeURIComponent(productData.name)}`);
    console.log('RÃ©ponse de recherche de produit:', productResponse);
    
    let productId;
    let productCreated = false;
    
    // VÃ©rifier si le produit existe dÃ©jÃ 
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
        // CrÃ©er un nouveau produit
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
          console.log('Nouveau produit crÃ©Ã©:', newProductResponse);
          productId = newProductResponse.data.id;
          productCreated = true;
        } else {
          console.error('Erreur lors de la crÃ©ation du produit:', newProductResponse);
          try {
            showAlert('Erreur lors de la crÃ©ation du produit', 'danger');
          } catch (alertError) {
            console.error('Erreur lors de l\'affichage de l\'alerte:', alertError);
          }
          return false;
        }
      }
    } else {
      // CrÃ©er un nouveau produit
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
        console.log('Nouveau produit crÃ©Ã©:', newProductResponse);
        productId = newProductResponse.data.id;
        productCreated = true;
      } else {
        console.error('Erreur lors de la crÃ©ation du produit:', newProductResponse);
        try {
          showAlert('Erreur lors de la crÃ©ation du produit', 'danger');
        } catch (alertError) {
          console.error('Erreur lors de l\'affichage de l\'alerte:', alertError);
        }
        return false;
      }
    }
    
    // Si aucun format n'est spÃ©cifiÃ© ou si un nouveau produit a Ã©tÃ© crÃ©Ã©, tenter de crÃ©er ou trouver un format appropriÃ©
    let formatId = productData.formatId;
    if (!formatId || productCreated) {
      console.log('Recherche ou crÃ©ation d\'un format pour le produit');
      
      // Si un nouveau produit a Ã©tÃ© crÃ©Ã©, vÃ©rifier d'abord s'il existe dÃ©jÃ  des formats pour ce produit
      if (productCreated) {
        const productFormatsResponse = await fetchWithAuth(`/formats?productId=${productId}`);
        
        if (productFormatsResponse && productFormatsResponse.success && 
            productFormatsResponse.data && productFormatsResponse.data.length > 0) {
          // Utiliser le premier format existant
          formatId = productFormatsResponse.data[0].id;
          console.log('Format existant trouvÃ© pour le nouveau produit:', formatId);
        }
      }
      
      // Si aucun format n'est encore trouvÃ©, crÃ©er un nouveau format
      if (!formatId) {
        console.log('CrÃ©ation d\'un nouveau format pour le produit');
        
        // DÃ©terminer la taille et l'unitÃ© selon la catÃ©gorie du produit
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
        
        // CrÃ©er le format avec un lien direct vers le produit
        const formatData = {
          productId: parseInt(productId),
          size: formatSize,
          volume: formatVolume,
          unit: formatUnit,
          isActive: true
        };
        
        console.log('CrÃ©ation du format avec les donnÃ©es:', formatData);
        
        try {
          // PremiÃ¨re tentative: crÃ©er le format avec productId
          const newFormatResponse = await fetchWithAuth('/formats', {
            method: 'POST',
            body: JSON.stringify(formatData)
          });
          
          if (newFormatResponse && newFormatResponse.success) {
            console.log('Nouveau format crÃ©Ã© avec succÃ¨s:', newFormatResponse);
            formatId = newFormatResponse.data.id;
          } else {
            // Si la premiÃ¨re tentative Ã©choue, essayer sans productId puis associer
            console.log('Ã‰chec de la crÃ©ation directe du format, tentative alternative');
            
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
                console.log('Format crÃ©Ã© et associÃ© avec succÃ¨s (mÃ©thode alternative)');
              } else {
                console.error('Ã‰chec de l\'association du format au produit');
                // Continuer quand mÃªme, car le format existe, mais n'est pas associÃ©
                formatId = altFormatId;
              }
            } else {
              console.error('Ã‰chec de la crÃ©ation du format (mÃ©thode alternative)');
            }
          }
        } catch (formatError) {
          console.error('Erreur lors de la crÃ©ation du format:', formatError);
        }
      }
    }
    
    // VÃ©rifier que l'ID du format est valide
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
    
    console.log('Ajout du stock avec les donnÃ©es:', stockData);
    
    let stockResponse;
    try {
      stockResponse = await fetchWithAuth('/stocks', {
        method: 'POST',
        body: JSON.stringify(stockData)
      });
    } catch (error) {
      console.error('Erreur lors de la requÃªte d\'ajout de stock:', error);
      
      // En cas d'erreur, tenter d'ajouter le productId manuellement
      if (!stockResponse) {
        try {
          console.log('Tentative alternative d\'ajout de stock avec productId explicite');
          // RÃ©cupÃ©rer les informations du format pour obtenir le productId
          const formatResponse = await fetchWithAuth(`/formats/${formatId}`);
          if (formatResponse && formatResponse.success && formatResponse.data) {
            const productId = formatResponse.data.productId;
            
            if (productId) {
              // Ajouter explicitement le productId dans les donnÃ©es de stock
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
    
    console.log('RÃ©ponse d\'ajout de stock:', stockResponse);
    
    if (stockResponse && stockResponse.success) {
      // Mise Ã  jour de l'UI en temps rÃ©el traitÃ©e par les Ã©vÃ©nements socket.io
      try {
        showAlert(`Produit ${productData.name} ajoutÃ© avec succÃ¨s`, 'success');
      } catch (alertError) {
        console.error('Erreur lors de l\'affichage de l\'alerte de succÃ¨s:', alertError);
        // Ne pas interrompre l'exÃ©cution, le stock a Ã©tÃ© ajoutÃ© avec succÃ¨s
      }
      
      // Recharger le tableau des stocks pour reflÃ©ter l'ajout
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
      
      // Recharger le tableau des produits Ã  recharger si disponible
      if (typeof loadRestockItems === 'function') {
        setTimeout(() => {
          // Tenter de recharger la page pour le bar actuel
          const savedBarId = localStorage.getItem('selectedBarId');
          if (savedBarId && (savedBarId === barId || !barId)) {
            console.log('Actualisation forcÃ©e des produits Ã  recharger pour le bar:', savedBarId);
            loadRestockItems(savedBarId);
          }
        }, 700);
      }
      
      // Force une actualisation complÃ¨te des stocks dans la page des stocks
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

// Mettre Ã  jour la quantitÃ© d'un produit
async function updateProductQuantity(stockId, newQuantity, reason = 'Mise Ã  jour manuelle') {
  console.log(`*** DEBUG: Fonction updateProductQuantity appelÃ©e pour le stock #${stockId} avec nouvelle quantitÃ© ${newQuantity}`);
  try {
    // VÃ©rifier que les valeurs sont valides
    if (!stockId || isNaN(parseInt(stockId))) {
      console.error(`*** DEBUG: ID de stock invalide: ${stockId}`);
      showAlert('ID de stock invalide', 'danger');
      return false;
    }
    
    if (isNaN(parseInt(newQuantity)) || parseInt(newQuantity) < 0) {
      console.error(`*** DEBUG: QuantitÃ© invalide: ${newQuantity}`);
      showAlert('La quantitÃ© doit Ãªtre un nombre positif', 'warning');
      return false;
    }
    
    // Essayer d'abord la mÃ©thode simple
    let result = await tryUpdateStock('/stocks', stockId, newQuantity, reason);
    console.log(`*** DEBUG: RÃ©sultat de la premiÃ¨re tentative: ${result}`);
    
    // Si cela Ã©choue, essayer l'endpoint historique
    if (!result) {
      console.log('*** DEBUG: Premier essai Ã©chouÃ©, tentative avec stock-history');
      result = await tryUpdateStock('/stock-history', stockId, newQuantity, reason);
      console.log(`*** DEBUG: RÃ©sultat de la deuxiÃ¨me tentative: ${result}`);
    }
    
    return result;
  } catch (error) {
    console.error('*** DEBUG: Exception dans updateProductQuantity:', error);
    showAlert(`Erreur lors de la mise Ã  jour de la quantitÃ©: ${error.message}`, 'danger');
    return false;
  }
}

// Fonction d'aide pour essayer diffÃ©rents endpoints de mise Ã  jour
async function tryUpdateStock(endpoint, stockId, newQuantity, reason) {
  try {
    console.log(`*** DEBUG: Tentative de mise Ã  jour via l'endpoint: ${endpoint}`);
    
    const payload = {
      quantity: newQuantity,
      currentQuantity: newQuantity,
      stock: newQuantity,
      reason: reason
    };
    
    if (endpoint === '/stocks') {
      payload.id = parseInt(stockId);
    }
    
    console.log('*** DEBUG: DonnÃ©es de mise Ã  jour:', payload);
    
    let url = endpoint;
    if (endpoint === '/stocks') {
      url = `/stocks/${stockId}`;
    } else if (endpoint === '/stock-history') {
      // Pour l'historique, on a besoin de plus d'informations
      const stockInfo = await fetchWithAuth(`/stocks/${stockId}`);
      console.log('*** DEBUG: Informations actuelles du stock:', stockInfo);
      
      // Si on a pu rÃ©cupÃ©rer les infos du stock
      if (stockInfo && (stockInfo.success || stockInfo.id)) {
        const stock = stockInfo.data || stockInfo;
        const previousQuantity = stock.currentQuantity || 0;
        
        // CrÃ©er un historique de stock
        const historyData = {
          stockId: parseInt(stockId),
          previousQuantity: previousQuantity,
          newQuantity: parseInt(newQuantity),
          shiftDate: new Date().toISOString().split('T')[0],
          shiftName: 'Ajustement manuel',
          notes: reason
        };
        
        console.log('*** DEBUG: DonnÃ©es d\'historique pour la mise Ã  jour:', historyData);
        
        const historyResult = await fetchWithAuth('/stock-history', {
          method: 'POST',
          body: JSON.stringify(historyData)
        });
        
        console.log('*** DEBUG: RÃ©ponse de crÃ©ation d\'historique:', historyResult);
        
        // En cas de succÃ¨s, actualiser aussi le tableau des produits Ã  recharger
        if (historyResult && historyResult.success) {
          // RÃ©cupÃ©rer l'ID du bar depuis le stock
          if (stock.barId) {
            setTimeout(() => {
              console.log('*** DEBUG: Actualisation du tableau des produits Ã  recharger aprÃ¨s mise Ã  jour');
              
              // Utiliser d'abord le barId stockÃ© en localStorage, puis celui du stock
              const savedBarId = localStorage.getItem('selectedBarId');
              const barToUse = savedBarId || stock.barId;
              
              // Toujours appeler loadRestockItems avec le barId appropriÃ©
              console.log('*** DEBUG: Chargement des produits Ã  recharger pour le bar', barToUse);
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
    
    // Envoyer la requÃªte de mise Ã  jour
    const result = await fetchWithAuth(url, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    
    console.log(`*** DEBUG: RÃ©ponse de mise Ã  jour via ${url}:`, result);
    
    // VÃ©rifier si la requÃªte a rÃ©ussi
    const success = !!(result && (result.success || result.id));
    
    if (success) {
      showAlert('QuantitÃ© mise Ã  jour avec succÃ¨s', 'success');
      
      // RÃ©cupÃ©rer le barId pour actualiser la liste des produits Ã  recharger
      try {
        const stockInfo = await fetchWithAuth(`/stocks/${stockId}`);
        if (stockInfo && (stockInfo.success || stockInfo.id)) {
          const stock = stockInfo.data || stockInfo;
          if (stock.barId) {
            setTimeout(() => {
              console.log('*** DEBUG: Actualisation du tableau des produits Ã  recharger aprÃ¨s mise Ã  jour');
              
              // Utiliser d'abord le barId stockÃ© en localStorage, puis celui du stock
              const savedBarId = localStorage.getItem('selectedBarId');
              const barToUse = savedBarId || stock.barId;
              
              // Toujours appeler loadRestockItems avec le barId appropriÃ©
              console.log('*** DEBUG: Chargement des produits Ã  recharger pour le bar', barToUse);
              if (typeof loadRestockItems === 'function') {
                loadRestockItems(barToUse);
              }
            }, 500);
          }
        }
      } catch (error) {
        console.error('*** DEBUG: Erreur lors de la rÃ©cupÃ©ration du barId:', error);
      }
      
      return true;
    } else {
      console.error('*** DEBUG: Ã‰chec de la mise Ã  jour:', result);
      return false;
    }
  } catch (error) {
    console.error(`*** DEBUG: Exception dans tryUpdateStock pour ${endpoint}:`, error);
    return false;
  }
}

// Fonction d'urgence pour rÃ©soudre le problÃ¨me de formats
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

// Initialiser les gestionnaires d'Ã©vÃ©nements
document.addEventListener('DOMContentLoaded', function() {
  // Protection contre les initialisations multiples
  if (stockManagerInitialized) {
    console.log('Stock manager dÃ©jÃ  initialisÃ©, sortie...');
    return;
  }
  
  console.log('Initialisation du stock manager...');
  stockManagerInitialized = true;
  
  // Ã‰couteur d'Ã©vÃ©nement pour le sÃ©lecteur de bar
  const stockBarSelect = document.getElementById('stock-bar-select');
  
  if (stockBarSelect) {
    stockBarSelect.addEventListener('change', function() {
      const selectedBarId = this.value;
      
      // Charger les stocks du bar sÃ©lectionnÃ©
      loadStocksTable(selectedBarId);
      
      // Charger le rÃ©capitulatif des produits Ã  recharger
      if (selectedBarId) {
        loadRestockSummary(selectedBarId);
      } else {
        const summaryContainer = document.getElementById('restock-summary-content');
        if (summaryContainer) {
          summaryContainer.innerHTML = '<p class="text-muted">SÃ©lectionnez un bar pour voir les produits Ã  recharger.</p>';
        }
      }
      
      // Rejoindre la salle du bar pour les mises Ã  jour en temps rÃ©el
      if (selectedBarId) {
        joinBarRoom(selectedBarId);
      }
    });
  }
  
  // Appliquer les amÃ©liorations Ã  l'interface des stocks
  const stocksPage = document.getElementById('stocks-page');
  
  if (stocksPage) {
    // Observer les changements dans la page des stocks
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          // VÃ©rifier si la page est visible
          if (!stocksPage.classList.contains('d-none')) {
            enhanceStockUI();
          }
        }
      });
    });
    
    observer.observe(stocksPage, { attributes: true });
    
    // VÃ©rifier Ã©galement lors du chargement initial
    if (!stocksPage.classList.contains('d-none')) {
      enhanceStockUI();
    }
  }
});

// Fonction pour ouvrir le modal de mise Ã  jour de stock alternative
async function openAlternativeStockModal(stockId) {
  try {
    console.log(`Ouverture du modal alternatif pour le stock #${stockId}`);
    
    // RÃ©cupÃ©rer les informations du stock
    const stockInfo = await fetchWithAuth(`/stocks/${stockId}`);
    console.log('Informations du stock pour mise Ã  jour alternative:', stockInfo);
    
    // Extraire les informations nÃ©cessaires
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
      
      // Extraire la quantitÃ©
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
      
      // Ajouter le gestionnaire d'Ã©vÃ©nement pour le bouton de sauvegarde
      const saveBtn = document.getElementById('save-alternative-stock-btn');
      if (saveBtn) {
        // Supprimer les gestionnaires d'Ã©vÃ©nements existants
        const newSaveBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
        
        // Ajouter le nouveau gestionnaire
        newSaveBtn.addEventListener('click', async function() {
          // DÃ©sactiver le bouton pendant le traitement
          this.disabled = true;
          this.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Mise Ã  jour...';
          
          const newQuantity = parseInt(document.getElementById('alternative-new-quantity').value);
          const reason = document.getElementById('alternative-reason').value;
          
          if (isNaN(newQuantity) || newQuantity < 0) {
            showAlert('Veuillez entrer une quantitÃ© valide', 'warning');
            this.disabled = false;
            this.textContent = 'Mettre Ã  jour';
            return;
          }
          
          // Utiliser la fonction de mise Ã  jour via l'historique
          const success = await updateProductQuantityViaHistory(stockId, newQuantity, reason);
          
          // Restaurer le bouton
          this.disabled = false;
          this.textContent = 'Mettre Ã  jour';
          
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
      console.error('Modal de mise Ã  jour alternative non trouvÃ© dans le DOM');
      showAlert('Erreur: Interface de mise Ã  jour alternative non disponible', 'danger');
    }
  } catch (error) {
    console.error('Erreur lors de l\'ouverture du modal alternatif:', error);
    showAlert('Erreur lors de la prÃ©paration de la mise Ã  jour alternative', 'danger');
  }
}

// Fonction pour initialiser la connexion Socket.IO
function initializeSocketConnection() {
  if (socket) {
    // DÃ©jÃ  connectÃ©
    return;
  }
  
  // Connexion au serveur Socket.IO
  socket = io();
  
  // Ã‰vÃ©nement de connexion
  socket.on('connect', () => {
    console.log('Connexion Socket.IO Ã©tablie');
  });
  
  // Ã‰vÃ©nement de dÃ©connexion
  socket.on('disconnect', () => {
    console.log('Connexion Socket.IO perdue');
  });
  
  // Ã‰vÃ©nement de mise Ã  jour de stock
  socket.on('stock-updated', (updatedStock) => {
    console.log('Mise Ã  jour de stock reÃ§ue:', updatedStock);
    updateStockInUI(updatedStock);
  });
  
  // Ã‰vÃ©nement d'initialisation de stocks
  socket.on('stocks-initialized', (stocks) => {
    console.log('Stocks initialisÃ©s reÃ§us:', stocks);
    updateMultipleStocksInUI(stocks);
  });
}

// Fonction pour rejoindre la salle d'un bar spÃ©cifique
function joinBarRoom(barId) {
  if (!socket) {
    initializeSocketConnection();
  }
  
  // Quitter toute salle actuelle et rejoindre la nouvelle
  socket.emit('join-bar', barId);
  console.log(`Rejoint la salle du bar ${barId}`);
}

// Fonction pour mettre Ã  jour un stock dans l'interface utilisateur sans rechargement
function updateStockInUI(updatedStock) {
  console.log('Mise Ã  jour du stock dans l\'UI:', updatedStock);
  
  const stockRow = document.querySelector(`tr[data-stock-id="${updatedStock.id}"]`);
  
  if (stockRow) {
    // Mettre Ã  jour les donnÃ©es dans la ligne existante
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
      // Mettre Ã  jour le statut du stock
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

    // Animer la ligne pour indiquer une mise Ã  jour
    stockRow.classList.add('highlight-update');
    setTimeout(() => {
      stockRow.classList.remove('highlight-update');
    }, 2000);
  } else {
    // Si la ligne n'existe pas, recharger le tableau complet
    console.log('Ligne de stock non trouvÃ©e dans le DOM, rechargement du tableau');
    try {
      const barSelect = document.getElementById('stock-bar-select');
      if (barSelect) {
        const selectedBarId = barSelect.value;
        
        // VÃ©rifier si nous avons la fonction loadStocksTable
        if (typeof loadStocksTable === 'function') {
          if (selectedBarId === updatedStock.barId.toString() || selectedBarId === '') {
            // Recharger uniquement si le stock appartient au bar sÃ©lectionnÃ© ou si "Tous les bars" est sÃ©lectionnÃ©
            loadStocksTable(selectedBarId);
          }
        } else {
          console.warn('Fonction loadStocksTable non disponible');
        }
      } else {
        console.warn('SÃ©lecteur de bar non trouvÃ© dans le DOM');
      }
    } catch (error) {
      console.error('Erreur lors du rechargement du tableau des stocks:', error);
    }
  }
}

// Fonction pour mettre Ã  jour plusieurs stocks dans l'interface utilisateur
function updateMultipleStocksInUI(stocks) {
  if (!Array.isArray(stocks) || stocks.length === 0) return;
  
  // Mettre Ã  jour chaque stock individuellement
  stocks.forEach(stock => updateStockInUI(stock));
}

// Fonction pour ouvrir le modal d'initialisation de stock pour un bar
function openInitializeStockModal(barId) {
  console.log(`DÃ©but de l'initialisation des stocks pour le bar ${barId}`);
  
  // RÃ©cupÃ©rer les donnÃ©es du bar sÃ©lectionnÃ©
  fetchWithAuth(`/bars/${barId}`)
    .then(barData => {
      if (!barData) {
        console.error("Aucune donnÃ©e de bar reÃ§ue");
        showAlert("Impossible de rÃ©cupÃ©rer les informations du bar", "danger");
        return;
      }
      
      const bar = barData.data || barData;
      console.log(`Bar rÃ©cupÃ©rÃ©:`, bar);
      
      // D'abord rÃ©cupÃ©rer tous les produits
      fetchWithAuth('/products')
        .then(productsData => {
          const products = productsData?.data || productsData || [];
          console.log(`Produits rÃ©cupÃ©rÃ©s (${products.length}):`, products);
          
          // RÃ©cupÃ©rer tous les formats de produits disponibles
          fetchWithAuth('/formats?include=product')
            .then(async (formatsData) => {
              console.log(`RÃ©ponse brute de l'API formats:`, formatsData);
              
              let formats = [];
              
              if (formatsData && formatsData.data) {
                formats = formatsData.data;
              } else if (Array.isArray(formatsData)) {
                formats = formatsData;
              }
              
              console.log(`Formats extraits (${formats.length}):`, formats);
              
              if (!formats || formats.length === 0) {
                showAlert("Aucun format de produit disponible. CrÃ©ez d'abord des formats pour vos produits.", "warning");
                return;
              }
              
              // RÃ©cupÃ©rer les stocks actuels pour ce bar
              const existingStocks = await loadBarStock(barId);
              console.log(`Stocks existants pour le bar (${existingStocks.length}):`, existingStocks);
              
              // VÃ©rifier s'il y a des produits sans format
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
                  console.log(`Format sans produit associÃ©: ID=${format.id}, taille=${format.size || format.name}`);
                }
              });
              
              console.log(`Produits avec format (${productsWithFormat.size}):`, Array.from(productsWithFormat));
              const productsWithoutFormat = products.filter(p => !productsWithFormat.has(p.id));
              console.log(`Produits sans format (${productsWithoutFormat.length}):`, productsWithoutFormat);
              
              if (productsWithoutFormat.length > 0) {
                const productNames = productsWithoutFormat.map(p => p.name).join(", ");
                showAlert(`Les produits suivants n'ont pas de format et ne sont pas disponibles pour l'initialisation: ${productNames}. Ajoutez un format Ã  ces produits pour les inclure.`, "warning");
              }
              
              // CrÃ©er et afficher le modal
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

// Fonction pour obtenir le nom du produit Ã  partir du format
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

// Fonction pour crÃ©er et afficher le modal d'initialisation de stock
function createStockInitializationModal(bar, formats, existingStocks) {
  console.log("CrÃ©ation du modal d'initialisation des stocks");
  
  // VÃ©rifier si le modal existe dÃ©jÃ , sinon le crÃ©er
  let modalElement = document.getElementById('initialize-stock-modal');
  
  if (!modalElement) {
    console.log("CrÃ©ation du DOM pour le modal d'initialisation");
    // CrÃ©er le modal
    const modalHTML = `
      <div class="modal fade" id="initialize-stock-modal" tabindex="-1" aria-labelledby="initialize-stock-modal-label" aria-hidden="true">
        <div class="modal-dialog modal-xl">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="initialize-stock-modal-label">Initialiser les stocks pour ${bar.name}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <p class="text-muted">DÃ©finissez les quantitÃ©s actuelles et minimales pour les produits dans ce bar.</p>
              
              <div class="mb-3 row">
                <div class="col-md-6">
                  <div class="input-group">
                    <span class="input-group-text">Recherche</span>
                    <input type="text" class="form-control" id="stock-init-search" placeholder="Filtrer par nom de produit...">
                  </div>
                </div>
                <div class="col-md-6 text-end">
                  <button type="button" class="btn btn-sm btn-outline-primary" id="select-all-products-btn">SÃ©lectionner tous</button>
                  <button type="button" class="btn btn-sm btn-outline-secondary" id="unselect-all-products-btn">DÃ©sÃ©lectionner tous</button>
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
                        <th>QuantitÃ© actuelle</th>
                        <th>QuantitÃ© minimale</th>
                        <th>QuantitÃ© idÃ©ale</th>
                      </tr>
                    </thead>
                    <tbody id="initialize-stock-tbody">
                      <!-- Les lignes seront ajoutÃ©es dynamiquement -->
                    </tbody>
                  </table>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
              <button type="button" class="btn btn-primary" id="save-all-stocks-btn">Enregistrer les stocks sÃ©lectionnÃ©s</button>
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
    // Si le format a dÃ©jÃ  un produit chargÃ© (via include=product), l'utiliser
    if (format.Product || format.product) {
      return true;
    }
    
    // Si le format a un productId mais pas d'objet Product associÃ© dans la rÃ©ponse API
    if (format.productId) {
      console.log(`Format avec productId mais sans Product chargÃ©: ID=${format.id}, productId=${format.productId}`);
      // Essayer de rechercher le produit correspondant Ã  cet ID
      const matchingProduct = products.find(p => p.id == format.productId);
      if (matchingProduct) {
        console.log(`Produit correspondant trouvÃ© pour format ${format.id}: ${matchingProduct.name}`);
        // Ajouter manuellement le produit au format
        format.Product = matchingProduct;
        return true;
      } else {
        console.log(`Aucun produit trouvÃ© avec ID ${format.productId} pour le format ${format.id}`);
      }
      return true; // Inclure ce format mÃªme si le produit n'est pas trouvÃ©
    }
    
    // Filtrer les formats sans productId
    return false;
  });
  
  console.log(`Formats valides avec produits associÃ©s: ${validFormats.length}/${formats.length}`);
  
  if (validFormats.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center">
          <div class="alert alert-warning">
            Aucun format avec produit associÃ© n'a Ã©tÃ© trouvÃ©. Veuillez d'abord crÃ©er des produits et leur associer des formats.
          </div>
        </td>
      </tr>
    `;
    // Afficher quand mÃªme le modal
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
    return;
  }
  
  // Compter combien de produits uniques sont reprÃ©sentÃ©s dans les formats
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
    
    // VÃ©rifier si ce format a dÃ©jÃ  un stock pour ce bar
    let existingStock = null;
    try {
      // VÃ©rifier que existingStocks est bien un tableau
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
    
    // Valeurs par dÃ©faut ou existantes
    const currentQuantity = existingStock ? (existingStock.currentQuantity || 0) : 0;
    const minQuantity = existingStock ? (existingStock.minQuantity || 10) : 10;
    const idealQuantity = existingStock ? (existingStock.idealQuantity || 30) : 30;
    
    const row = document.createElement('tr');
    row.setAttribute('data-format-id', format.id);
    row.setAttribute('data-product-id', productId);
    row.setAttribute('data-product-name', productName);
    
    // Pour les Ã©lÃ©ments existants, sÃ©lectionner par dÃ©faut
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
        <td colspan="6" class="text-center">Aucun produit avec format n'a Ã©tÃ© trouvÃ©</td>
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
  
  // Gestionnaire pour le checkbox "sÃ©lectionner tout"
  const toggleAllCheckbox = document.getElementById('toggle-all-products');
  if (toggleAllCheckbox) {
    toggleAllCheckbox.addEventListener('change', function() {
      const checkboxes = document.querySelectorAll('.product-select-checkbox');
      checkboxes.forEach(checkbox => {
        checkbox.checked = this.checked;
      });
    });
  }
  
  // Boutons de sÃ©lection/dÃ©sÃ©lection
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
  
  // Ajouter l'Ã©vÃ©nement pour sauvegarder tous les stocks
  const saveButton = document.getElementById('save-all-stocks-btn');
  if (saveButton) {
    saveButton.addEventListener('click', async function() {
      this.disabled = true;
      this.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Enregistrement...';
      
      try {
        await saveAllStocks(bar.id);
        // Fermer le modal aprÃ¨s la sauvegarde
        const modal = bootstrap.Modal.getInstance(modalElement);
        modal.hide();
      } catch (error) {
        console.error('Erreur lors de la sauvegarde des stocks:', error);
      } finally {
        this.disabled = false;
        this.textContent = 'Enregistrer les stocks sÃ©lectionnÃ©s';
      }
    });
  }
  
  // Afficher le modal
  const modal = new bootstrap.Modal(modalElement);
  modal.show();
  
  // Rejoindre la salle du bar pour les mises Ã  jour en temps rÃ©el
  joinBarRoom(bar.id);
}

// Fonction pour sauvegarder tous les stocks
async function saveAllStocks(barId) {
  try {
    // RÃ©cupÃ©rer toutes les lignes de stock
    const rows = document.querySelectorAll('#initialize-stock-tbody tr');
    const stocks = [];
    let selectedCount = 0;
    
    console.log(`PrÃ©paration de l'initialisation des stocks pour ${rows.length} lignes`);
    
    rows.forEach(row => {
      const formatId = row.getAttribute('data-format-id');
      const productId = row.getAttribute('data-product-id');
      
      // VÃ©rifier si la ligne est sÃ©lectionnÃ©e
      const checkbox = row.querySelector(`.product-select-checkbox[data-format-id="${formatId}"]`);
      if (!checkbox || !checkbox.checked) {
        console.log(`Ligne pour format ${formatId} non sÃ©lectionnÃ©e, ignorÃ©e`);
        return; // Ignorer les lignes non sÃ©lectionnÃ©es
      }
      
      // RÃ©cupÃ©rer les quantitÃ©s pour les lignes sÃ©lectionnÃ©es
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
        
        console.log(`PrÃ©parÃ© stock pour format ${formatId}, produit ${productId}, quantitÃ© ${currentQuantity}`);
        selectedCount++;
      } else {
        console.error(`Inputs manquants pour le format ${formatId}`);
      }
    });
    
    if (stocks.length === 0) {
      showAlert('Aucun produit sÃ©lectionnÃ© Ã  enregistrer', 'warning');
      return;
    }
    
    console.log(`Tentative d'initialisation de ${stocks.length} stocks pour le bar #${barId}`);
    console.log('DonnÃ©es Ã  envoyer:', { stocks });
    
    // Appeler l'API pour initialiser tous les stocks
    const result = await fetchWithAuth(`/stocks/initialize/${barId}`, {
      method: 'POST',
      body: JSON.stringify({ stocks })
    });
    
    console.log('RÃ©sultat de l\'initialisation des stocks:', result);
    
    if (!result) {
      showAlert('Erreur lors de l\'initialisation des stocks', 'danger');
      return;
    }
    
    // Plan de secours en cas d'Ã©chec de l'initialisation groupÃ©e
    if (!result.success) {
      console.log("Ã‰chec de l'initialisation groupÃ©e, tentative d'initialisation individuelle");
      
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
            console.log(`Stock ajoutÃ© avec succÃ¨s pour format ${stock.formatId}`);
            successCount++;
          } else {
            console.error(`Ã‰chec de l'ajout du stock pour format ${stock.formatId}:`, stockResult);
            errorCount++;
          }
        } catch (e) {
          console.error(`Erreur lors de l'ajout du stock pour format ${stock.formatId}:`, e);
          errorCount++;
        }
      }
      
      if (successCount > 0) {
        showAlert(`${successCount} produits ont Ã©tÃ© initialisÃ©s individuellement, ${errorCount} Ã©checs`, errorCount > 0 ? 'warning' : 'success');
        
        // Recharger les stocks
        const stockBarSelect = document.getElementById('stock-bar-select');
        if (stockBarSelect && stockBarSelect.value === barId.toString()) {
          await loadStocksTable(barId);
        }
        
        return true;
      } else {
        showAlert(`Ã‰chec de l'initialisation de tous les stocks`, 'danger');
        return false;
      }
    }
    
    const successCount = result.data.length;
    const errorCount = result.errors ? result.errors.length : 0;
    
    let message = `${successCount} produits ont Ã©tÃ© initialisÃ©s avec succÃ¨s`;
    if (errorCount > 0) {
      message += `, mais ${errorCount} erreurs sont survenues`;
    }
    
    showAlert(message, errorCount > 0 ? 'warning' : 'success');
    
    // Recharger les stocks pour le bar sÃ©lectionnÃ©
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

// Mettre Ã  jour l'interface pour les stocks
function enhanceStockUI() {
  // Ajouter un bouton pour initialiser tous les stocks
  const stockBarSelect = document.getElementById('stock-bar-select');
  
  if (stockBarSelect) {
    // VÃ©rifier si le bouton existe dÃ©jÃ 
    if (!document.getElementById('initialize-all-stocks-btn')) {
      const barSelectContainer = stockBarSelect.parentElement;
      
      if (barSelectContainer) {
        // CrÃ©er un groupe de formulaire horizontal
        barSelectContainer.className = 'col-md-6 d-flex align-items-end';
        
        // Ajouter le bouton d'initialisation
        const btnHTML = `
          <button type="button" class="btn btn-primary ms-2" id="initialize-all-stocks-btn">
            <i class="bi bi-boxes"></i> Initialiser tous les produits
          </button>
        `;
        
        barSelectContainer.insertAdjacentHTML('beforeend', btnHTML);
        
        // Ajouter l'Ã©vÃ©nement au bouton
        document.getElementById('initialize-all-stocks-btn').addEventListener('click', function() {
          const selectedBarId = stockBarSelect.value;
          
          if (!selectedBarId) {
            showAlert('Veuillez sÃ©lectionner un bar pour initialiser les stocks', 'warning');
            return;
          }
          
          openInitializeStockModal(selectedBarId);
        });
      }
    }
    
    // Ajouter une section pour le rÃ©capitulatif des produits Ã  recharger et le bouton de fin de service
    if (!document.getElementById('restock-summary-section') && !document.getElementById('end-shift-global-btn')) {
      const stocksPage = document.getElementById('stocks-page');
      const stocksTable = document.querySelector('#stocks-page .table-responsive');
      
      if (stocksPage && stocksTable) {
        // Ajouter un bouton de fin de service global aprÃ¨s le tableau des stocks
        const endShiftBtnContainer = document.createElement('div');
        endShiftBtnContainer.className = 'text-end mt-4';
        endShiftBtnContainer.innerHTML = `
          <button type="button" class="btn btn-warning" id="end-shift-global-btn">
            <i class="bi bi-clock-history"></i> Enregistrer une fin de service
          </button>
        `;
        
        // Ajouter le bouton aprÃ¨s le tableau
        stocksTable.parentNode.insertBefore(endShiftBtnContainer, stocksTable.nextSibling);
        
        // Ajouter l'Ã©vÃ©nement au bouton
        document.getElementById('end-shift-global-btn').addEventListener('click', function() {
          const selectedBarId = stockBarSelect.value;
          
          if (!selectedBarId) {
            showAlert('Veuillez sÃ©lectionner un bar pour enregistrer une fin de service', 'warning');
            return;
          }
          
          openGlobalShiftModal(selectedBarId);
        });
        
        // Ajouter une section pour le rÃ©capitulatif des produits Ã  recharger
        const restockSummarySection = document.createElement('div');
        restockSummarySection.className = 'card mt-4';
        restockSummarySection.id = 'restock-summary-section';
        restockSummarySection.innerHTML = `
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Produits Ã  recharger</h5>
            <button type="button" class="btn btn-sm btn-outline-primary" id="refresh-restock-summary-btn">
              <i class="bi bi-arrow-clockwise"></i> Actualiser
            </button>
          </div>
          <div class="card-body">
            <div id="restock-summary-content">
              <p class="text-muted">SÃ©lectionnez un bar pour voir les produits Ã  recharger.</p>
            </div>
          </div>
        `;
        
        // Ajouter la section aprÃ¨s le bouton de fin de service
        endShiftBtnContainer.parentNode.insertBefore(restockSummarySection, endShiftBtnContainer.nextSibling);
        
        // Ajouter l'Ã©vÃ©nement au bouton d'actualisation
        document.getElementById('refresh-restock-summary-btn').addEventListener('click', function() {
          const selectedBarId = stockBarSelect.value;
          
          if (selectedBarId) {
            loadRestockSummary(selectedBarId);
          } else {
            showAlert('Veuillez sÃ©lectionner un bar pour voir les produits Ã  recharger', 'warning');
          }
        });
        
        // Si un bar est dÃ©jÃ  sÃ©lectionnÃ©, charger le rÃ©capitulatif
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
  
  // Ajouter des classes aux cellules pour faciliter les mises Ã  jour
  stockRows.forEach(row => {
    const cells = row.querySelectorAll('td');
    
    // Ajouter des classes aux cellules appropriÃ©es (en supposant l'ordre des colonnes)
    if (cells.length >= 5) { // Produit, Format, QuantitÃ© actuelle, QuantitÃ© minimale, QuantitÃ© idÃ©ale, Statut, Actions
      const quantityCell = cells[3]; // Index 3 pour la quantitÃ© actuelle
      const minQuantityCell = cells[4]; // Index 4 pour la quantitÃ© minimale
      const idealQuantityCell = cells[5]; // Index 5 pour la quantitÃ© idÃ©ale
      
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
  
  // Rejoindre la salle du bar sÃ©lectionnÃ©
  const selectedBarId = stockBarSelect ? stockBarSelect.value : null;
  if (selectedBarId) {
    joinBarRoom(selectedBarId);
  }
}

// Charger le rÃ©capitulatif des produits Ã  recharger
async function loadRestockSummary(barId) {
  console.log('Fonction loadRestockSummary appelÃ©e pour le bar', barId);
  
  // RÃ©cupÃ©rer le conteneur du rÃ©sumÃ© au lieu du tableau principal
  const restockSummaryContent = document.getElementById('restock-summary-content');
  
  if (!restockSummaryContent) {
    console.error('Ã‰lÃ©ment restock-summary-content non trouvÃ©');
    return;
  }
  
  // Afficher un indicateur de chargement
  restockSummaryContent.innerHTML = '<div class="text-center"><div class="spinner-border spinner-border-sm" role="status"></div> Chargement des produits Ã  recharger...</div>';
  
  try {
    // RÃ©cupÃ©rer les informations du bar
    const barResponse = await fetchWithAuth(`/bars/${barId}`);
    
    if (!barResponse || !barResponse.success) {
      console.error('Ã‰chec de rÃ©cupÃ©ration des informations du bar');
      restockSummaryContent.innerHTML = '<div class="alert alert-danger">Erreur lors du chargement des informations du bar</div>';
      return;
    }
    
    const bar = barResponse.data;
    
    // RÃ©cupÃ©rer tous les stocks du bar
    const stocksResponse = await fetchWithAuth(`/stocks?barId=${barId}`);
    
    if (!stocksResponse || !stocksResponse.success) {
      console.error('Ã‰chec de rÃ©cupÃ©ration des stocks');
      restockSummaryContent.innerHTML = '<div class="alert alert-danger">Erreur lors du chargement des stocks</div>';
      return;
    }
    
    const allStocks = stocksResponse.data || [];
    
    // S'il n'y a pas de stocks
    if (allStocks.length === 0) {
      restockSummaryContent.innerHTML = '<div class="alert alert-info">Aucun produit n\'est enregistrÃ© dans ce bar</div>';
      return;
    }
    
    let html = '<table class="table table-sm"><thead><tr>' +
               '<th>Produit</th><th>Format</th><th>QuantitÃ©</th><th>QuantitÃ© plein</th><th>A recharger</th>' +
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
      
      // S'assurer que les valeurs sont des nombres ou 0 par dÃ©faut
      const currentQuantity = (stock.currentQuantity !== undefined && stock.currentQuantity !== null) 
                              ? stock.currentQuantity : 0;
      const idealQuantity = (stock.idealQuantity !== undefined && stock.idealQuantity !== null) 
                          ? stock.idealQuantity : 30;
      
      // Nouvelle logique pour calculer la quantitÃ© Ã  recharger
      let toOrder = 0;
      if (currentQuantity === 0) {
        // Si quantitÃ© actuelle est 0, recharger la quantitÃ© plein
        toOrder = idealQuantity;
      } else {
        // Sinon, recharger la diffÃ©rence entre plein et actuelle
        toOrder = Math.max(0, idealQuantity - currentQuantity);
      }
      
      // DÃ©terminer la classe CSS selon le niveau de stock
      let rowClass = '';
      if (toOrder > 0) {
        totalToOrder += toOrder;
        productsToRestock++;
        rowClass = 'table-warning'; // Produit sous le seuil idÃ©al
      } else if (currentQuantity >= idealQuantity) {
        rowClass = 'table-success'; // Produit bien approvisionnÃ©
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
    
    // Ajouter une ligne de total si des produits sont Ã  recharger
    if (totalToOrder > 0) {
      html += `
        <tr class="table-primary">
          <td colspan="4" class="text-end"><strong>Total Ã  recharger:</strong></td>
          <td><strong>${totalToOrder}</strong></td>
        </tr>
      `;
    }
    
    html += '</tbody></table>';
    
    // Ajouter une information sur le nombre de produits
    const statusHTML = `
      <div class="alert ${productsToRestock > 0 ? 'alert-warning' : 'alert-success'} mt-2">
        ${productsToRestock > 0 ? 
          `<i class="bi bi-exclamation-triangle me-2"></i>${productsToRestock} produit(s) Ã  recharger sur ${allStocks.length} produits au total` : 
          `<i class="bi bi-check-circle me-2"></i>Tous les ${allStocks.length} produits sont Ã  niveau`}
      </div>
    `;
    
    // Mettre Ã  jour le contenu
    restockSummaryContent.innerHTML = html + statusHTML;
    
  } catch (error) {
    console.error('Erreur dans loadRestockSummary:', error);
    restockSummaryContent.innerHTML = `<div class="alert alert-danger">Erreur: ${error.message}</div>`;
  }
}

// Ouvrir le modal pour enregistrer une fin de service globale
async function openGlobalShiftModal(barId) {
  try {
    // RÃ©cupÃ©rer les informations du bar
    const barResponse = await fetchWithAuth(`/bars/${barId}`);
    
    if (!barResponse || !barResponse.success) {
      showAlert('Erreur lors du chargement des informations du bar', 'danger');
      return;
    }
    
    const bar = barResponse.data;
    
    // CrÃ©er le modal de fin de service globale s'il n'existe pas
    let modalElement = document.getElementById('global-shift-modal');
    
    if (!modalElement) {
      // CrÃ©er le modal
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
                          <th>QuantitÃ© actuelle</th>
                          <th>Nouvelle quantitÃ©</th>
                        </tr>
                      </thead>
                      <tbody id="global-shift-tbody">
                        <!-- Les lignes seront ajoutÃ©es dynamiquement -->
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
    
    // RÃ©initialiser le formulaire
    const form = document.getElementById('global-shift-form');
    if (form) form.reset();
    
    // DÃ©finir l'ID du bar
    if (globalShiftBarIdInput) {
      globalShiftBarIdInput.value = barId;
    }
    
    // DÃ©finir la date du jour
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
      showAlert('Aucun stock trouvÃ© pour ce bar', 'warning');
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
      
      // Ajouter l'Ã©vÃ©nement pour la case Ã  cocher "SÃ©lectionner tout"
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
    
    // Ajouter l'Ã©vÃ©nement pour le bouton de sauvegarde
    const saveButton = document.getElementById('save-global-shift-btn');
    console.log('*** DEBUG: Bouton save-global-shift-btn dans openGlobalShiftModal:', !!saveButton);
    
    if (saveButton) {
      // Supprimer l'ancien gestionnaire d'Ã©vÃ©nement s'il existe
      const newSaveButton = saveButton.cloneNode(true);
      saveButton.parentNode.replaceChild(newSaveButton, saveButton);
      console.log('*** DEBUG: Ancien gestionnaire supprimÃ©, nouveau bouton crÃ©Ã©');
      
      // Ajouter le nouveau gestionnaire d'Ã©vÃ©nement
      newSaveButton.addEventListener('click', function(e) {
        console.log('*** DEBUG: Bouton Save cliquÃ©!', e);
        saveGlobalShift();
      });
      console.log('*** DEBUG: Nouveau gestionnaire d\'Ã©vÃ©nement ajoutÃ©');
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
    // DÃ©sactiver le bouton de sauvegarde
    const saveButton = document.getElementById('save-global-shift-btn');
    
    if (saveButton) {
      saveButton.disabled = true;
      saveButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Enregistrement...';
    }
    
    // RÃ©cupÃ©rer les valeurs du formulaire
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
    
    // RÃ©cupÃ©rer tous les stocks modifiÃ©s
    const stockRows = document.querySelectorAll('#global-shift-table tbody tr');
    const selectedStocks = [];
    
    stockRows.forEach(row => {
      const checkbox = row.querySelector('input[type="checkbox"]');
      
      if (checkbox && checkbox.checked) {
        const stockId = checkbox.getAttribute('data-stock-id');
        const oldQuantity = parseInt(row.querySelector('.old-quantity').textContent);
        const newQuantityInput = row.querySelector('.new-quantity');
        const newQuantity = newQuantityInput ? parseInt(newQuantityInput.value) : 0;
        
        // VÃ©rifier si la nouvelle quantitÃ© est diffÃ©rente de l'ancienne
        if (newQuantity !== undefined && !isNaN(newQuantity)) {
          selectedStocks.push({
            stockId,
            oldQuantity,
            newQuantity
          });
        }
      }
    });
    
    // VÃ©rifier qu'au moins un stock est sÃ©lectionnÃ©
    if (selectedStocks.length === 0) {
      showAlert('Veuillez sÃ©lectionner au moins un produit', 'warning');
      if (saveButton) {
        saveButton.disabled = false;
        saveButton.textContent = 'Enregistrer le service';
      }
      return;
    }
    
    // Utiliser la mÃ©thode de sauvegarde individuelle
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
      
      // Recharger les donnÃ©es
      setTimeout(() => {
        console.log('Actualisation des donnÃ©es aprÃ¨s sauvegarde');
        loadStocksTable(barId);
        
        // Actualiser aussi le tableau des produits Ã  recharger sur le dashboard
        const savedBarId = localStorage.getItem('selectedBarId');
        if (savedBarId) {
          console.log('Actualisation des produits Ã  recharger pour bar:', savedBarId);
          loadRestockItems(savedBarId);
        }
        
        // Actualiser le rÃ©sumÃ© des produits Ã  recharger dans la page des stocks
        console.log('Actualisation du rÃ©sumÃ© des produits Ã  recharger pour bar:', barId);
        loadRestockSummary(barId);
      }, 1000); // Attendre un peu plus longtemps pour s'assurer que les mises Ã  jour sont terminÃ©es
    }
    
    // RÃ©activer le bouton
    if (saveButton) {
      saveButton.disabled = false;
      saveButton.textContent = 'Enregistrer le service';
    }
  } catch (error) {
    console.error('Exception dans saveGlobalShift:', error);
    showAlert('Erreur lors de l\'enregistrement de la fin de service: ' + error.message, 'danger');
    
    // RÃ©activer le bouton en cas d'erreur
    const saveButton = document.getElementById('save-global-shift-btn');
    if (saveButton) {
      saveButton.disabled = false;
      saveButton.textContent = 'Enregistrer le service';
    }
  }
}

// MÃ©thode de secours pour enregistrer les stocks individuellement
async function saveGlobalShiftIndividually(barId, shiftDate, shiftName, notes, selectedStocks) {
  console.log('*** DEBUG: Fonction saveGlobalShiftIndividually appelÃ©e avec', selectedStocks.length, 'stocks');
  
  try {
    let successCount = 0;
    let failureCount = 0;
    
    for (const stock of selectedStocks) {
      // ProcÃ©der avec la mise Ã  jour, mÃªme si la quantitÃ© n'a pas changÃ©
      console.log(`*** DEBUG: Traitement du stock #${stock.stockId}: ${stock.previousQuantity} -> ${stock.newQuantity}`);
      
      // Construire les donnÃ©es pour ce stock
      const stockHistoryData = {
        stockId: stock.stockId,
        barId: parseInt(barId),
        previousQuantity: stock.previousQuantity,
        newQuantity: stock.newQuantity,
        shiftDate,
        shiftName,
        notes
      };
      
      console.log('*** DEBUG: DonnÃ©es Ã  envoyer pour ce stock:', stockHistoryData);
      
      // Envoyer la requÃªte
      try {
        const response = await fetchWithAuth('/stock-history', {
          method: 'POST',
          body: JSON.stringify(stockHistoryData)
        });
        
        console.log(`*** DEBUG: RÃ©ponse pour le stock #${stock.stockId}:`, response);
        
        if (response && response.success) {
          successCount++;
          
          // Mise Ã  jour supplÃ©mentaire du stock lui-mÃªme pour s'assurer que la quantitÃ© est correcte
          try {
            const stockUpdateResponse = await fetchWithAuth(`/stocks/${stock.stockId}`, {
              method: 'PUT',
              body: JSON.stringify({
                currentQuantity: stock.newQuantity
              })
            });
            
            console.log(`*** DEBUG: Mise Ã  jour directe du stock #${stock.stockId}:`, stockUpdateResponse);
          } catch (updateError) {
            console.error(`*** DEBUG: Erreur lors de la mise Ã  jour directe du stock #${stock.stockId}:`, updateError);
          }
        } else {
          failureCount++;
          console.error(`*** DEBUG: Erreur lors de l'enregistrement de l'historique pour le stock #${stock.stockId}:`, 
                        response?.message || 'RÃ©ponse non valide');
        }
      } catch (stockError) {
        failureCount++;
        console.error(`*** DEBUG: Exception lors de l'enregistrement du stock #${stock.stockId}:`, stockError);
      }
    }
    
    console.log(`*** DEBUG: RÃ©sultat final: ${successCount} succÃ¨s, ${failureCount} Ã©checs`);
    
    // Afficher le rÃ©sultat
    if (failureCount === 0 && successCount > 0) {
      showAlert(`Fin de service enregistrÃ©e avec succÃ¨s pour ${successCount} produits`, 'success');
      return { success: true, message: `${successCount} produits mis Ã  jour` };
    } else if (successCount > 0) {
      showAlert(`Fin de service partiellement enregistrÃ©e: ${successCount} produits mis Ã  jour, ${failureCount} Ã©checs`, 'warning');
      return { success: true, partial: true, message: `${successCount} produits mis Ã  jour, ${failureCount} Ã©checs` };
    } else {
      showAlert('Aucun produit n\'a pu Ãªtre mis Ã  jour', 'danger');
      return { success: false, message: 'Aucun produit mis Ã  jour' };
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
