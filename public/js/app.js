// Application principale - Bar Stock Manager
// Variables globales
let currentUser = null;
let isInitialized = false; // Protection contre les initialisations multiples
let currentRoute = null; // Pour éviter les rechargements inutiles
let selectedCompanyId = null; // Entreprise actuellement sélectionnée

// Fonctions d'authentification de base
function checkAuth() {
  const token = localStorage.getItem('token');
  if (token) {
    currentUser = localStorage.getItem('user');
    return true;
  }
  return false;
}

// Fonction pour les requêtes API avec authentification
async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('token');
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  
  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  };
  
  try {
    const response = await fetch(`/api${url}`, config);
    
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.reload();
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    return null;
  }
}

// Fonction pour gérer l'affichage des éléments selon les permissions
function updateUIForUserRole() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role;
  
  // Afficher les informations utilisateur dans la navbar
  const userInfo = document.getElementById('user-info');
  if (userInfo) {
    const roleLabels = {
      'superuser': '👑 Super Admin',
      'admin': '🔧 Administrateur', 
      'manager': '👔 Manager',
      'user': '👤 Utilisateur'
    };
    userInfo.innerHTML = `
      <small class="text-light">
        <i class="bi bi-person-circle"></i> ${user.username}
        <br><span class="badge bg-secondary">${roleLabels[userRole] || userRole}</span>
      </small>
    `;
  }
  
  // Gérer l'affichage de l'onglet Utilisateurs (visible pour admin, superuser, manager)
  const usersNavItem = document.querySelector('a[href="#users"]')?.parentElement;
  if (usersNavItem) {
    if (userRole === 'user') {
      usersNavItem.style.display = 'none';
    } else {
      usersNavItem.style.display = 'block';
    }
  }
  
  // Gérer l'affichage de l'onglet Entreprises (visible pour superuser et admin)
  const companiesNavItem = document.querySelector('a[href="#companies"]')?.parentElement;
  if (companiesNavItem) {
    if (userRole === 'user' || userRole === 'manager') {
      companiesNavItem.style.display = 'none';
    } else {
      companiesNavItem.style.display = 'block';
    }
  }
  
  // Affichage conditionnel selon les permissions
  console.log(`Interface mise à jour pour le rôle: ${userRole} (${roleLabels[userRole] || userRole})`);
}

// Fonction pour afficher les alertes (déjà définie dans auth.js, mais on la redéfinit par sécurité)
function showAlert(message, type = 'info') {
  // Chercher le conteneur d'alerte existant
  let alertContainer = document.getElementById('alert-container');
  
  if (!alertContainer) {
    // Si pas de conteneur spécifique, utiliser le conteneur principal
    const container = document.querySelector('.container-fluid') || document.querySelector('.container');
    
    if (container) {
      // Créer l'élément d'alerte
      const alertElement = document.createElement('div');
      alertElement.className = `alert alert-${type} alert-dismissible fade show mt-3`;
      alertElement.role = 'alert';
      alertElement.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      `;
      
      // Insérer au début du conteneur
      if (container.firstChild) {
        container.insertBefore(alertElement, container.firstChild);
      } else {
        container.appendChild(alertElement);
      }
      
      // Auto-dismiss après 5 secondes
      setTimeout(() => {
        if (alertElement.parentNode) {
          alertElement.classList.remove('show');
          setTimeout(() => alertElement.remove(), 300);
        }
      }, 5000);
    } else {
      console.warn('Impossible d\'afficher l\'alerte:', message);
    }
  } else {
    // Utiliser le conteneur d'alerte existant
    alertContainer.className = `alert alert-${type}`;
    alertContainer.textContent = message;
    alertContainer.classList.remove('d-none');
    
    setTimeout(() => {
      alertContainer.classList.add('d-none');
    }, 5000);
  }
}

// Navigation et gestion des pages
function navigateTo(page) {
  window.location.hash = `#${page}`;
}

function handleRoute() {
  const hash = window.location.hash.replace('#', '') || 'dashboard';
  
  // Éviter les rechargements inutiles
  if (currentRoute === hash) {
    return;
  }
  
  currentRoute = hash;
  console.log('Navigation vers:', hash);
  
  // Masquer toutes les pages
  document.querySelectorAll('[id$="-page"]').forEach(page => {
    page.classList.add('d-none');
  });
  
  // Afficher la page appropriée
  const targetPage = document.getElementById(`${hash}-page`);
  if (targetPage) {
    targetPage.classList.remove('d-none');
    
    // Charger les données spécifiques à la page (une seule fois)
    switch(hash) {
      case 'companies':
        loadCompanies();
        break;
      case 'products':
        if (typeof loadProducts === 'function') {
          loadProducts();
        }
        break;
      case 'dashboard':
        if (typeof loadDashboardData === 'function') {
          loadDashboardData();
        }
        break;
      case 'bars':
        if (typeof loadBars === 'function') {
          loadBars();
        }
        break;
      case 'stocks':
        if (typeof loadStocks === 'function') {
          loadStocks();
        }
        break;
      case 'reserve':
        if (typeof loadReserve === 'function') {
          loadReserve();
        }
        break;
      case 'multi-reserves':
        loadMultiReserves();
        break;
      case 'users':
        if (typeof loadUsersPage === 'function') {
          loadUsersPage();
        }
        break;
      case 'history':
        if (typeof loadStockHistory === 'function') {
          loadStockHistory();
        }
        break;
    }
  }
}

// Charger les produits
async function loadProducts() {
  try {
    const response = await fetchWithAuth('/products');
    if (response && response.success) {
      displayProducts(response.data);
    }
  } catch (error) {
    console.error('Erreur lors du chargement des produits:', error);
  }
}

// Afficher les produits dans le tableau
function displayProducts(products) {
  const tbody = document.getElementById('products-table-body');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  products.forEach(product => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${product.name}</td>
      <td>${product.brand || ''}</td>
      <td>${product.category}</td>
      <td>
        ${product.Formats ? product.Formats.length : 0} format(s)
      </td>
      <td>
        <span class="badge bg-${product.isActive ? 'success' : 'secondary'}">
          ${product.isActive ? 'Actif' : 'Inactif'}
        </span>
      </td>
      <td>
        <button type="button" class="btn btn-sm btn-outline-primary me-1" onclick="openProductModal(${product.id})">
          <i class="bi bi-pencil"></i>
        </button>
        <button type="button" class="btn btn-sm btn-outline-success me-1" onclick="openFormatModal(null, ${product.id})">
          Ajouter format
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Charger les données du dashboard
let dashboardCache = null;
let dashboardLastLoad = 0;
const DASHBOARD_CACHE_DURATION = 30000; // 30 secondes

async function loadDashboardData() {
  console.log('Chargement des données du dashboard...');
  
  // Vérifier l'authentification avant de charger les données
  if (!checkAuth()) {
    console.log('Utilisateur non authentifié, chargement du dashboard différé');
    // Afficher des valeurs par défaut
    document.getElementById('active-bars-count').innerHTML = '<h3>-</h3>';
    document.getElementById('active-products-count').innerHTML = '<h3>-</h3>';
    document.getElementById('low-stock-count').innerHTML = '<h3>-</h3>';
    
    const container = document.getElementById('all-bars-container');
    if (container) {
      container.innerHTML = `
        <div class="text-center text-warning py-4">
          <i class="bi bi-person-x fs-1"></i>
          <p class="mt-2">Veuillez vous connecter pour voir les données du dashboard</p>
        </div>
      `;
    }
    return;
  }
  
  // Vérifier le cache pour éviter les appels répétés
  const now = Date.now();
  if (dashboardCache && (now - dashboardLastLoad) < DASHBOARD_CACHE_DURATION) {
    console.log('Utilisation du cache du dashboard');
    return;
  }
  
  try {
    // Construire les URLs avec filtre d'entreprise si nécessaire
    let barsUrl = '/bars';
    let stocksUrl = '/stocks';
    
    // Pour les admins, ne pas filtrer par défaut (sauf si explicitement sélectionné)
    const currentUser = localStorage.getItem('user');
    const user = currentUser ? JSON.parse(currentUser) : null;
    
    if (selectedCompanyId && !(user && user.role === 'admin' && !selectedCompanyId)) {
      barsUrl += `?companyId=${selectedCompanyId}`;
      stocksUrl += `?companyId=${selectedCompanyId}`;
    }
    
    // Charger toutes les données en parallèle
    const [barsResponse, productsResponse, stocksResponse, companiesResponse] = await Promise.all([
      fetchWithAuth(barsUrl),
      fetchWithAuth('/products'),
      fetchWithAuth(stocksUrl),
      fetchWithAuth('/companies')
    ]);
    
    const bars = (barsResponse?.data || barsResponse || []).filter(bar => bar.isActive);
    const products = productsResponse?.data || productsResponse || [];
    const stocks = stocksResponse?.data || stocksResponse || [];
    const companies = (companiesResponse?.data || companiesResponse || []).filter(company => company.isActive);
    
    // Calculer les statistiques
    const activeBarsCount = bars.length;
    const activeProductsCount = products.filter(p => p.isActive !== false).length;
    const lowStockCount = stocks.filter(stock => {
      const currentQty = stock.currentQuantity || stock.quantity || 0;
      const minQty = stock.minThreshold || 0;
      return currentQty <= minQty && currentQty > 0;
    }).length;
    
    // Mettre à jour l'affichage des statistiques
    document.getElementById('active-companies-count').innerHTML = `<h3>${selectedCompanyId ? 1 : companies.length}</h3>`;
    document.getElementById('active-bars-count').innerHTML = `<h3>${activeBarsCount}</h3>`;
    document.getElementById('active-products-count').innerHTML = `<h3>${activeProductsCount}</h3>`;
    document.getElementById('low-stock-count').innerHTML = `<h3>${lowStockCount}</h3>`;
    
    // Afficher tous les bars avec leur statut de stock
    displayAllBarsStatus(bars, stocks, products);
    
    // Mettre à jour le cache
    dashboardCache = {
      bars,
      products,
      stocks
    };
    dashboardLastLoad = now;
    
    console.log('Dashboard chargé avec succès');
  } catch (error) {
    console.error('Erreur lors du chargement du dashboard:', error);
    // Afficher des valeurs par défaut en cas d'erreur
    document.getElementById('active-bars-count').innerHTML = '<h3>-</h3>';
    document.getElementById('active-products-count').innerHTML = '<h3>-</h3>';
    document.getElementById('low-stock-count').innerHTML = '<h3>-</h3>';
    
    // Afficher un message d'erreur dans le conteneur des bars
    const container = document.getElementById('all-bars-container');
    if (container) {
      container.innerHTML = `
        <div class="text-center text-danger py-4">
          <i class="bi bi-exclamation-triangle fs-1"></i>
          <p class="mt-2">Erreur lors du chargement des données</p>
          <button class="btn btn-outline-primary" onclick="loadDashboardData()">
            <i class="bi bi-arrow-clockwise"></i> Réessayer
          </button>
        </div>
      `;
    }
  }
}

// Afficher tous les bars avec leur statut de stock
function displayAllBarsStatus(bars, stocks, products) {
  const container = document.getElementById('all-bars-container');
  if (!container) return;
  
  if (!bars || bars.length === 0) {
    container.innerHTML = `
      <div class="text-center text-muted py-4">
        <i class="bi bi-shop fs-1"></i>
        <p class="mt-2">Aucun bar actif trouvé</p>
      </div>
    `;
    return;
  }
  
  // Créer les cartes pour chaque bar
  const barsHtml = bars.map(bar => {
    const barStocks = stocks.filter(stock => stock.barId === bar.id);
    
    // Calculer les statistiques du bar
    const totalProducts = barStocks.length;
    const lowStockProducts = barStocks.filter(stock => {
      const currentQty = stock.currentQuantity || stock.quantity || 0;
      const minQty = stock.minThreshold || 0;
      return currentQty <= minQty && currentQty > 0;
    }).length;
    const outOfStockProducts = barStocks.filter(stock => {
      const currentQty = stock.currentQuantity || stock.quantity || 0;
      return currentQty <= 0;
    }).length;
    const goodStockProducts = totalProducts - lowStockProducts - outOfStockProducts;
    
    // Déterminer le statut général du bar
    let statusClass = 'success';
    let statusText = 'Bon';
    let statusIcon = 'check-circle-fill';
    
    if (outOfStockProducts > 0) {
      statusClass = 'danger';
      statusText = 'Critique';
      statusIcon = 'exclamation-triangle-fill';
    } else if (lowStockProducts > 0) {
      statusClass = 'warning';
      statusText = 'Attention';
      statusIcon = 'exclamation-circle-fill';
    }
    
    // Créer la liste des produits à recharger
    const restockItems = barStocks
      .filter(stock => {
        const currentQty = stock.currentQuantity || stock.quantity || 0;
        const idealQty = stock.maxThreshold || 0;
        return currentQty < idealQty;
      })
      .sort((a, b) => {
        const qtyA = a.currentQuantity || a.quantity || 0;
        const qtyB = b.currentQuantity || b.quantity || 0;
        return qtyA - qtyB;
      })
      .slice(0, 5); // Limiter à 5 produits
    
    const restockListHtml = restockItems.length > 0 ? 
      restockItems.map(stock => {
        // Trouver le produit dans la liste des produits
        let product = null;
        if (stock.Format && stock.Format.Product) {
          product = stock.Format.Product;
        } else if (stock.Format && stock.Format.productId) {
          product = products.find(p => p.id === stock.Format.productId);
        } else if (stock.productId) {
          product = products.find(p => p.id === stock.productId);
        }
        
        const productName = product ? product.name : 'Produit inconnu';
        const format = stock.Format ? `${stock.Format.size}` : 'Format inconnu';
        const currentQty = stock.currentQuantity || stock.quantity || 0;
        const idealQty = stock.maxThreshold || 0;
        const toRestock = Math.max(0, idealQty - currentQty);
        
        return `
          <div class="d-flex justify-content-between align-items-center py-1 small">
            <span class="text-truncate me-2" title="${productName} ${format}">
              ${productName} ${format}
            </span>
            <span class="badge bg-${currentQty <= 0 ? 'danger' : 'warning'} ms-2">
              ${currentQty <= 0 ? 'Rupture' : `+${toRestock}`}
            </span>
          </div>
        `;
      }).join('') :
      '<div class="text-muted small py-2">Aucun produit à recharger</div>';
    
    return `
      <div class="col-md-6 col-lg-4 mb-4">
        <div class="card h-100">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h6 class="card-title mb-0">${bar.name}</h6>
            <span class="badge bg-${statusClass} d-flex align-items-center">
              <i class="bi bi-${statusIcon} me-1"></i>
              ${statusText}
            </span>
          </div>
          <div class="card-body">
            <div class="row text-center mb-3">
              <div class="col-4">
                <div class="text-success">
                  <i class="bi bi-check-circle fs-4"></i>
                  <div class="small">Bon stock</div>
                  <div class="fw-bold">${goodStockProducts}</div>
                </div>
              </div>
              <div class="col-4">
                <div class="text-warning">
                  <i class="bi bi-exclamation-circle fs-4"></i>
                  <div class="small">Stock faible</div>
                  <div class="fw-bold">${lowStockProducts}</div>
                </div>
              </div>
              <div class="col-4">
                <div class="text-danger">
                  <i class="bi bi-x-circle fs-4"></i>
                  <div class="small">Rupture</div>
                  <div class="fw-bold">${outOfStockProducts}</div>
                </div>
              </div>
            </div>
            
            <div class="border-top pt-3">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="mb-0">À recharger</h6>
                <small class="text-muted">${restockItems.length} produit(s)</small>
              </div>
              <div class="restock-list" style="max-height: 150px; overflow-y: auto;">
                ${restockListHtml}
              </div>
            </div>
          </div>
          <div class="card-footer">
            <div class="d-flex justify-content-between">
              <button class="btn btn-sm btn-outline-primary" onclick="navigateTo('stocks'); loadStocksTable(${bar.id})">
                <i class="bi bi-box-seam"></i> Voir stocks
              </button>
              <button class="btn btn-sm btn-outline-secondary" onclick="refreshBarStatus(${bar.id})">
                <i class="bi bi-arrow-clockwise"></i> Actualiser
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  container.innerHTML = `<div class="row">${barsHtml}</div>`;
}

// Actualiser le statut d'un bar spécifique
async function refreshBarStatus(barId) {
  console.log(`Actualisation du statut du bar ${barId}...`);
  
  try {
    const [stocksResponse] = await Promise.all([
      fetchWithAuth(`/stocks?barId=${barId}`)
    ]);
    
    const stocks = stocksResponse?.data || stocksResponse || [];
    
    // Trouver la carte du bar et mettre à jour son contenu
    // Pour l'instant, on recharge tout le dashboard
    // On pourrait optimiser pour ne recharger que cette carte
    dashboardCache = null; // Invalider le cache
    loadDashboardData();
    
  } catch (error) {
    console.error(`Erreur lors de l'actualisation du bar ${barId}:`, error);
    showAlert('Erreur lors de l\'actualisation', 'danger');
  }
}

// ====================================
// GESTION DES FORMATS DANS LE MODAL PRODUIT
// ====================================

// Ouvrir le modal produit pour ajouter ou modifier
async function openProductModal(productId = null) {
  const modal = document.getElementById('product-modal');
  const title = document.getElementById('product-modal-title');
  
  if (productId) {
    title.textContent = 'Modifier le produit';
    
    try {
      const response = await fetchWithAuth(`/products/${productId}`);
      
      if (response && response.success) {
        const product = response.data;
        
        // Remplir le formulaire avec les données existantes
        document.getElementById('product-id').value = product.id;
        document.getElementById('product-name').value = product.name || '';
        document.getElementById('product-brand').value = product.brand || '';
        document.getElementById('product-category').value = product.category || 'beer';
        document.getElementById('product-notes').value = product.notes || '';
        document.getElementById('product-active').checked = product.isActive !== false;
        
        // Charger les formats existants pour ce produit
        loadProductFormats(product.id);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des détails du produit:', error);
      showAlert('Erreur lors de la récupération des détails du produit', 'danger');
    }
  } else {
    title.textContent = 'Ajouter un produit';
    // Vider le formulaire
    const form = document.getElementById('product-form');
    if (form) form.reset();
    document.getElementById('product-id').value = '';
    document.getElementById('product-active').checked = true;
    
    // Vider la liste des formats
    clearProductFormatsList();
  }
  
  // Masquer le formulaire d'ajout de format
  const addFormatCard = document.getElementById('add-format-card');
  if (addFormatCard) {
    addFormatCard.classList.add('d-none');
  }
  
  // Afficher le modal
  if (modal) {
    new bootstrap.Modal(modal).show();
  }
}

// Charger les formats pour un produit spécifique
async function loadProductFormats(productId) {
  if (!productId) {
    clearProductFormatsList();
    return;
  }
  
  try {
    const response = await fetchWithAuth(`/formats?productId=${productId}`);
    const formats = response.data || response || [];
    
    displayProductFormats(formats);
  } catch (error) {
    console.error('Erreur lors du chargement des formats:', error);
    clearProductFormatsList();
  }
}

// Afficher les formats dans la liste
function displayProductFormats(formats) {
  const formatsList = document.getElementById('product-formats-list');
  const noFormatsMessage = document.getElementById('no-formats-message');
  
  if (!formatsList || !noFormatsMessage) return;
  
  if (!formats || formats.length === 0) {
    formatsList.innerHTML = '';
    formatsList.appendChild(noFormatsMessage);
    return;
  }
  
  formatsList.innerHTML = '';
  
  formats.forEach(format => {
    const formatDiv = document.createElement('div');
    formatDiv.className = 'card card-body py-2 mb-2';
    formatDiv.innerHTML = `
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <span class="fw-bold">${format.size}</span>
          <span class="text-muted">(${format.volume} ${format.unit})</span>
          <span class="badge bg-secondary ms-2">${format.packaging || 'bouteille'}</span>
        </div>
        <div>
          <button type="button" class="btn btn-sm btn-outline-primary me-1" onclick="editFormat(${format.id})">
            <i class="bi bi-pencil"></i>
          </button>
          <button type="button" class="btn btn-sm btn-outline-danger" onclick="deleteFormat(${format.id})">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>
    `;
    formatsList.appendChild(formatDiv);
  });
}

// Vider la liste des formats
function clearProductFormatsList() {
  const formatsList = document.getElementById('product-formats-list');
  const noFormatsMessage = document.getElementById('no-formats-message');
  
  if (!formatsList || !noFormatsMessage) return;
  
  formatsList.innerHTML = '';
  formatsList.appendChild(noFormatsMessage);
}

// Afficher le formulaire d'ajout de format
function showAddFormatForm() {
  const addFormatCard = document.getElementById('add-format-card');
  if (!addFormatCard) return;
  
  addFormatCard.classList.remove('d-none');
  
  // Vider le formulaire
  document.getElementById('new-format-size').value = '';
  document.getElementById('new-format-volume').value = '';
  document.getElementById('new-format-unit').value = 'cl';
  document.getElementById('new-format-packaging').value = 'bouteille';
  
  // Focus sur le premier champ
  document.getElementById('new-format-size').focus();
}

// Masquer le formulaire d'ajout de format
function hideAddFormatForm() {
  const addFormatCard = document.getElementById('add-format-card');
  if (addFormatCard) {
    addFormatCard.classList.add('d-none');
  }
}

// Sauvegarder un nouveau format
async function saveNewFormat() {
  const productId = document.getElementById('product-id').value;
  const size = document.getElementById('new-format-size').value.trim();
  const volume = document.getElementById('new-format-volume').value;
  const unit = document.getElementById('new-format-unit').value;
  const packaging = document.getElementById('new-format-packaging').value;
  
  // Validation
  if (!size) {
    showAlert('Veuillez saisir une taille pour le format', 'warning');
    return;
  }
  
  if (!volume || volume <= 0) {
    showAlert('Veuillez saisir un volume valide', 'warning');
    return;
  }
  
  try {
    const formatData = {
      size,
      volume: parseFloat(volume),
      unit,
      packaging,
      isActive: true
    };
    
    // Si on modifie un produit existant, ajouter le productId
    if (productId && productId !== '') {
      formatData.productId = parseInt(productId);
      
      // Pour un produit existant, créer le format directement
      const response = await fetchWithAuth('/formats', {
        method: 'POST',
        body: JSON.stringify(formatData)
      });
      
      if (response && response.success) {
        showAlert('Format ajouté avec succès', 'success');
        hideAddFormatForm();
        loadProductFormats(productId);
      } else {
        throw new Error(response?.message || 'Erreur lors de la création du format');
      }
    } else {
      // Pour un nouveau produit, ajouter le format à la liste temporaire
      const tempFormat = {
        id: 'temp-' + Date.now(),
        size,
        volume: parseFloat(volume),
        unit,
        packaging,
        isTemporary: true
      };
      
      displayNewFormatInList(tempFormat);
      hideAddFormatForm();
      showAlert('Format ajouté à la liste. Il sera sauvegardé avec le produit.', 'info');
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du format:', error);
    showAlert('Erreur lors de la sauvegarde du format: ' + error.message, 'danger');
  }
}

// Afficher un nouveau format dans la liste (pour les nouveaux produits)
function displayNewFormatInList(format) {
  const formatsList = document.getElementById('product-formats-list');
  const noFormatsMessage = document.getElementById('no-formats-message');
  
  if (!formatsList || !noFormatsMessage) return;
  
  // Supprimer le message "aucun format" s'il existe
  if (noFormatsMessage.parentNode === formatsList) {
    formatsList.removeChild(noFormatsMessage);
  }
  
  const formatDiv = document.createElement('div');
  formatDiv.className = 'card card-body py-2 mb-2';
  formatDiv.innerHTML = `
    <div class="d-flex justify-content-between align-items-center">
      <div>
        <span class="fw-bold">${format.size}</span>
        <span class="text-muted">(${format.volume} ${format.unit})</span>
        <span class="badge bg-secondary ms-2">${format.packaging || 'bouteille'}</span>
        <span class="badge bg-info ms-1">Nouveau</span>
      </div>
    </div>
  `;
  formatsList.appendChild(formatDiv);
}

// Sauvegarder un produit
async function saveProduct() {
  const productId = document.getElementById('product-id').value;
  const name = document.getElementById('product-name').value.trim();
  const brand = document.getElementById('product-brand').value.trim();
  const category = document.getElementById('product-category').value;
  const notes = document.getElementById('product-notes').value.trim();
  const isActive = document.getElementById('product-active').checked;
  
  if (!name) {
    showAlert('Le nom du produit est requis', 'warning');
    return;
  }
  
  try {
    const productData = {
      name,
      brand: brand || null,
      category,
      notes: notes || null,
      isActive
    };
    
    let response;
    
    if (productId) {
      // Mise à jour d'un produit existant
      response = await fetchWithAuth(`/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify(productData)
      });
    } else {
      // Création d'un nouveau produit
      response = await fetchWithAuth('/products', {
        method: 'POST',
        body: JSON.stringify(productData)
      });
    }
    
    if (response && response.success) {
      const savedProduct = response.data;
      
      // Si c'est un nouveau produit et qu'il y a des formats en attente, les associer
      if (!productId && savedProduct.id) {
        await linkPendingFormatsToProduct(savedProduct.id);
      }
      
      showAlert(productId ? 'Produit mis à jour avec succès' : 'Produit créé avec succès', 'success');
      
      // Fermer le modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('product-modal'));
      if (modal) {
        modal.hide();
      }
      
      // Recharger la liste des produits
      loadProducts();
    } else {
      throw new Error(response?.message || 'Erreur lors de la sauvegarde');
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du produit:', error);
    showAlert('Erreur lors de la sauvegarde: ' + error.message, 'danger');
  }
}

// Lier les formats en attente à un nouveau produit
async function linkPendingFormatsToProduct(productId) {
  const formatsList = document.getElementById('product-formats-list');
  if (!formatsList) return;
  
  const formatCards = formatsList.querySelectorAll('.card');
  
  for (const card of formatCards) {
    const badge = card.querySelector('.badge.bg-info');
    if (badge && badge.textContent === 'Nouveau') {
      // Ce format est temporaire, il faut le créer pour ce produit
      const sizeElement = card.querySelector('.fw-bold');
      const textContent = card.textContent || '';
      
      if (sizeElement) {
        const size = sizeElement.textContent;
        
        // Extraire les informations du format depuis le texte affiché
        const volumeMatch = textContent.match(/\((\d+(?:\.\d+)?)\s*(\w+)\)/);
        const packagingMatch = textContent.match(/(\w+)\s+Nouveau/);
        
        if (volumeMatch) {
          const volume = parseFloat(volumeMatch[1]);
          const unit = volumeMatch[2];
          const packaging = packagingMatch ? packagingMatch[1] : 'bouteille';
          
          try {
            // Créer le format pour ce produit
            const formatData = {
              size,
              volume,
              unit,
              packaging,
              productId: parseInt(productId),
              isActive: true
            };
            
            const response = await fetchWithAuth('/formats', {
              method: 'POST',
              body: JSON.stringify(formatData)
            });
            
            if (response && response.success) {
              console.log(`Format ${size} créé pour le produit ${productId}`);
            }
          } catch (error) {
            console.error('Erreur lors de la création du format:', error);
          }
        }
      }
    }
  }
}

// Supprimer un format
async function deleteFormat(formatId) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce format ?')) {
    return;
  }
  
  try {
    const response = await fetchWithAuth(`/formats/${formatId}`, {
      method: 'DELETE'
    });
    
    if (response && response.success) {
      showAlert('Format supprimé avec succès', 'success');
      
      // Recharger les formats
      const productId = document.getElementById('product-id').value;
      if (productId) {
        loadProductFormats(productId);
      }
    } else {
      throw new Error(response?.message || 'Erreur lors de la suppression');
    }
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    showAlert('Erreur lors de la suppression: ' + error.message, 'danger');
  }
}

// Éditer un format existant
async function editFormat(formatId) {
  try {
    // Récupérer les informations du format
    const response = await fetchWithAuth(`/formats/${formatId}`);
    const format = response.data || response;
    
    if (!format) {
      showAlert('Format non trouvé', 'danger');
      return;
    }
    
    // Ouvrir le modal de format existant avec les données
    if (typeof openFormatModal === 'function') {
      openFormatModal(format, null);
    } else {
      showAlert('Fonction d\'édition de format non disponible', 'warning');
    }
  } catch (error) {
    console.error('Erreur lors du chargement du format:', error);
    showAlert('Erreur lors du chargement du format', 'danger');
  }
}

// Fonction pour ouvrir le modal de format (utilise la logique existante du modal produit)
function openFormatModal(format = null, productId = null) {
  console.log('openFormatModal appelée avec:', { format, productId });
  
  if (productId) {
    // Pour un produit existant, ouvrir le modal produit en mode édition
    openProductModal(productId);
    showAlert('Utilisez le modal produit pour gérer les formats', 'info');
  } else if (format) {
    // Pour éditer un format existant
    showAlert('Édition de format : fonctionnalité à implémenter', 'warning');
  } else {
    showAlert('Veuillez d\'abord sélectionner un produit pour ajouter un format', 'warning');
  }
}

// Charger les bars
async function loadBars() {
  try {
    const response = await fetchWithAuth('/bars');
    if (response && response.success) {
      displayBars(response.data);
    } else {
      console.error('Erreur lors du chargement des bars:', response);
      showAlert('Erreur lors du chargement des bars', 'danger');
    }
  } catch (error) {
    console.error('Erreur lors du chargement des bars:', error);
    showAlert('Erreur lors du chargement des bars', 'danger');
  }
}

// Afficher les bars dans le tableau
function displayBars(bars) {
  const tbody = document.getElementById('bars-table-body');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  if (bars.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Aucun bar trouvé</td></tr>';
    return;
  }
  
  bars.forEach(bar => {
    const companyName = bar.Company ? bar.Company.name : 'Aucune entreprise';
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${bar.name}</td>
      <td>
        <span class="badge bg-info">${companyName}</span>
      </td>
      <td>${bar.location || 'Non défini'}</td>
      <td>
        <span class="badge bg-${bar.isActive ? 'success' : 'secondary'}">
          ${bar.isActive ? 'Actif' : 'Inactif'}
        </span>
      </td>
      <td>
        <button type="button" class="btn btn-sm btn-outline-primary me-1" onclick="openBarModal(${bar.id})" title="Modifier">
          <i class="bi bi-pencil"></i>
        </button>
        <button type="button" class="btn btn-sm btn-outline-danger" onclick="deleteBar(${bar.id})" title="Supprimer">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Fonction pour modifier un bar (à implémenter si nécessaire)
function editBar(barId) {
  console.log('Modification du bar ID:', barId);
  showAlert('Fonction de modification en cours de développement', 'info');
}

// Fonction pour supprimer un bar (à implémenter si nécessaire)
function deleteBar(barId) {
  console.log('Suppression du bar ID:', barId);
  if (confirm('Êtes-vous sûr de vouloir supprimer ce bar ?')) {
    showAlert('Fonction de suppression en cours de développement', 'info');
  }
}

// ====================================
// GESTION DES STOCKS
// ====================================

// Charger la page stocks (avec compatibilité stock-manager.js)
async function loadStocks() {
  try {
    console.log('LoadStocks appelée depuis app.js');
    
    // Si stock-manager.js a déjà des fonctions, les utiliser
    if (typeof loadBarsIntoSelector === 'function') {
      console.log('Utilisation de loadBarsIntoSelector du stock-manager.js');
      await loadBarsIntoSelector('stock-bar-select');
      await loadBarsIntoSelector('new-product-bar');
      await loadBarsIntoSelector('history-bar-select');
    } else {
      // Sinon utiliser nos fonctions
      await loadBarsIntoStockSelectors();
    }
    
    // Charger tous les stocks par défaut
    await loadStocksTable();
    
    console.log('Page stocks chargée avec succès');
  } catch (error) {
    console.error('Erreur lors du chargement de la page stocks:', error);
    showAlert('Erreur lors du chargement des stocks', 'danger');
  }
}

// Charger les bars dans les sélecteurs de la page stocks
async function loadBarsIntoStockSelectors() {
  try {
    const response = await fetchWithAuth('/bars');
    if (response && response.success) {
      const bars = response.data.filter(bar => bar.isActive);
      
      // Charger dans le sélecteur principal de stocks
      const stockBarSelect = document.getElementById('stock-bar-select');
      if (stockBarSelect) {
        populateBarSelector(stockBarSelect, bars, 'Tous les bars');
      }
      
      // Charger dans le sélecteur du modal d'ajout
      const newProductBarSelect = document.getElementById('new-product-bar');
      if (newProductBarSelect) {
        populateBarSelector(newProductBarSelect, bars, 'Sélectionnez un bar');
      }
      
      // Charger dans le sélecteur d'historique
      const historyBarSelect = document.getElementById('history-bar-select');
      if (historyBarSelect) {
        populateBarSelector(historyBarSelect, bars, 'Tous les bars');
      }
    }
  } catch (error) {
    console.error('Erreur lors du chargement des bars dans les sélecteurs:', error);
  }
}

// Fonction utilitaire pour peupler un sélecteur de bars
function populateBarSelector(selector, bars, defaultText) {
  if (!selector) return;
  
  // Sauvegarder la valeur sélectionnée
  const selectedValue = selector.value;
  
  // Vider le sélecteur
  selector.innerHTML = `<option value="">${defaultText}</option>`;
  
  // Ajouter les bars
  bars.forEach(bar => {
    const option = document.createElement('option');
    option.value = bar.id;
    option.textContent = bar.name;
    selector.appendChild(option);
  });
  
  // Restaurer la sélection si possible
  if (selectedValue) {
    selector.value = selectedValue;
  }
}

// Charger le tableau des stocks
async function loadStocksTable(barId = null) {
  try {
    let url = '/stocks';
    if (barId) {
      url += `?barId=${barId}`;
    }
    
    const response = await fetchWithAuth(url);
    
    if (response && response.success) {
      displayStocks(response.data);
    } else {
      console.error('❌ [CLIENT] Erreur chargement stocks:', response);
      displayStocks([]);
    }
  } catch (error) {
    console.error('❌ [CLIENT] Erreur loadStocksTable:', error);
    displayStocks([]);
  }
}

// Afficher les stocks dans le tableau
function displayStocks(stocks) {
  const tbody = document.getElementById('stocks-table-body');
  if (!tbody) {
    console.error('❌ [CLIENT] Element stocks-table-body introuvable !');
    return;
  }
  
  tbody.innerHTML = '';
  
  if (stocks.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Aucun stock trouvé</td></tr>';
    return;
  }
  
  stocks.forEach(stock => {
    const row = document.createElement('tr');
    
    // Déterminer le statut du stock
    let statusClass = 'success';
    let statusText = 'Bon';
    
    if (stock.currentQuantity <= stock.minThreshold) {
      statusClass = 'danger';
      statusText = 'Stock faible';
    } else if (stock.currentQuantity <= (stock.minThreshold + (stock.maxThreshold - stock.minThreshold) * 0.3)) {
      statusClass = 'warning';
      statusText = 'Stock moyen';
    }
    
    row.innerHTML = `
      <td>${stock.Bar ? stock.Bar.name : 'Bar inconnu'}</td>
      <td>${stock.Format && stock.Format.Product ? stock.Format.Product.name : 'Produit inconnu'}</td>
      <td>${stock.Format ? `${stock.Format.size} (${stock.Format.volume}${stock.Format.unit})` : 'Format inconnu'}</td>
      <td>${stock.currentQuantity}</td>
      <td>${stock.minThreshold}</td>
      <td>${stock.maxThreshold}</td>
      <td>
        <span class="badge bg-${statusClass}">${statusText}</span>
      </td>
      <td>
        <button type="button" class="btn btn-sm btn-outline-primary me-1" onclick="editStock(${stock.id})">
          <i class="bi bi-pencil"></i>
        </button>
        <button type="button" class="btn btn-sm btn-outline-danger" onclick="deleteStock(${stock.id})">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Fonctions temporaires pour les actions sur les stocks
function editStock(stockId) {
  console.log('Modification du stock ID:', stockId);
  showAlert('Fonction de modification de stock en cours de développement', 'info');
}

function deleteStock(stockId) {
  console.log('Suppression du stock ID:', stockId);
  if (confirm('Êtes-vous sûr de vouloir supprimer ce stock ?')) {
    showAlert('Fonction de suppression de stock en cours de développement', 'info');
  }
}

// ====================================
// GESTION DE L'HISTORIQUE
// ====================================

// Charger les produits à recharger pour le dashboard
async function loadRestockItems(barId) {
  console.log('Chargement des produits à recharger pour le bar:', barId);
  
  // Vérifier l'authentification avant de faire l'appel API
  if (!checkAuth()) {
    console.log('Utilisateur non authentifié, chargement des produits à recharger différé');
    return;
  }
  
  const restockTbody = document.getElementById('restock-tbody');
  const restockStatus = document.getElementById('restock-status');
  const statusText = restockStatus?.querySelector('.status-text');
  const spinner = restockStatus?.querySelector('.spinner-border');
  
  if (!restockTbody) {
    console.error('Élément restock-tbody non trouvé');
    return;
  }
  
  // Afficher le spinner de chargement
  if (statusText) statusText.textContent = 'Chargement...';
  if (spinner) spinner.classList.remove('d-none');
  
  if (!barId) {
    // Aucun bar sélectionné
    restockTbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-muted">
          Veuillez sélectionner un bar pour voir les produits à recharger.
        </td>
      </tr>
    `;
    if (statusText) statusText.textContent = 'En attente de sélection...';
    if (spinner) spinner.classList.add('d-none');
    return;
  }
  
  try {
    // Récupérer les stocks du bar
    const response = await fetchWithAuth(`/stocks?barId=${barId}`);
    
    if (!response || !response.success) {
      throw new Error('Erreur lors du chargement des stocks');
    }
    
    const stocks = response.data || [];
    
    if (stocks.length === 0) {
      restockTbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-muted">
            Aucun produit enregistré dans ce bar.
          </td>
        </tr>
      `;
      if (statusText) statusText.textContent = 'Aucun produit trouvé';
      if (spinner) spinner.classList.add('d-none');
      return;
    }
    
    // Calculer les produits à recharger
    let restockItems = [];
    let totalToRestock = 0;
    
    stocks.forEach(stock => {
      if (!stock.Format || !stock.Format.Product) return;
      
      const currentQuantity = stock.currentQuantity || 0;
      const idealQuantity = stock.maxThreshold || 30;
      
      // Calculer la quantité à recharger
      let toRestock = 0;
      if (currentQuantity === 0) {
        toRestock = idealQuantity;
      } else {
        toRestock = Math.max(0, idealQuantity - currentQuantity);
      }
      
      if (toRestock > 0) {
        restockItems.push({
          product: stock.Format.Product,
          format: stock.Format,
          currentQuantity,
          idealQuantity,
          toRestock
        });
        totalToRestock += toRestock;
      }
    });
    
    // Afficher les résultats
    if (restockItems.length === 0) {
      restockTbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-success">
            <i class="bi bi-check-circle me-2"></i>
            Tous les produits sont à niveau !
          </td>
        </tr>
      `;
      if (statusText) statusText.textContent = 'Tous les produits à niveau';
    } else {
      restockTbody.innerHTML = '';
      
      restockItems.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${item.product.name} ${item.product.brand ? `(${item.product.brand})` : ''}</td>
          <td>${item.format.size || item.format.name} ${item.format.volume ? `${item.format.volume} ${item.format.unit}` : ''}</td>
          <td>${item.currentQuantity}</td>
          <td>${item.maxThreshold}</td>
          <td><strong class="text-warning">${item.toRestock}</strong></td>
        `;
        restockTbody.appendChild(row);
      });
      
      if (statusText) statusText.textContent = `${restockItems.length} produit(s) à recharger`;
    }
    
    if (spinner) spinner.classList.add('d-none');
    
  } catch (error) {
    console.error('Erreur lors du chargement des produits à recharger:', error);
    
    restockTbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-danger">
          <i class="bi bi-exclamation-triangle me-2"></i>
          Erreur lors du chargement des données
        </td>
      </tr>
    `;
    
    if (statusText) statusText.textContent = 'Erreur de chargement';
    if (spinner) spinner.classList.add('d-none');
    
    showAlert('Erreur lors du chargement des produits à recharger', 'danger');
  }
}

// Charger l'historique des stocks
async function loadStockHistory() {
  console.log('Chargement de l\'historique des stocks...');
  
  try {
    // Charger les bars dans le sélecteur d'historique
    await loadBarsIntoStockSelectors();
    
    // Charger l'historique par défaut (vide au début)
    displayStockHistory([]);
    
  } catch (error) {
    console.error('Erreur lors du chargement de l\'historique:', error);
    showAlert('Erreur lors du chargement de l\'historique', 'danger');
  }
}

// Afficher l'historique des stocks
function displayStockHistory(history) {
  const tbody = document.getElementById('history-table-body');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  if (history.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Aucun historique trouvé</td></tr>';
    return;
  }
  
  history.forEach(entry => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${new Date(entry.createdAt).toLocaleDateString()}</td>
      <td>${entry.Bar ? entry.Bar.name : 'Bar inconnu'}</td>
      <td>${entry.Product ? entry.Product.name : 'Produit inconnu'}</td>
      <td>${entry.Format ? `${entry.Format.size} (${entry.Format.volume}${entry.Format.unit})` : 'Format inconnu'}</td>
      <td>${entry.previousQuantity || 0}</td>
      <td>${entry.newQuantity || 0}</td>
      <td>${(entry.newQuantity || 0) - (entry.previousQuantity || 0)}</td>
      <td>${entry.notes || ''}</td>
    `;
    tbody.appendChild(row);
  });
}

// ====================================
// GESTION DE LA RÉSERVE
// ====================================

// Charger la page réserve
async function loadReserve() {
  console.log('Chargement de la page réserve...');
  
  try {
    // Charger les formats pour le sélecteur
    await loadFormatsIntoReserveSelector();
    
    // Charger les bars pour le modal de transfert
    await loadBarsIntoTransferSelector();
    
    // Charger la liste des réserves
    await loadReserveTable();
    
    // Vérifier s'il faut afficher l'alerte d'initialisation
    await checkInitializationStatus();
    
    console.log('Page réserve chargée avec succès');
  } catch (error) {
    console.error('Erreur lors du chargement de la page réserve:', error);
    showAlert('Erreur lors du chargement de la réserve', 'danger');
  }
}

// Vérifier le statut d'initialisation des réserves
async function checkInitializationStatus() {
  try {
    const [reservesResponse, formatsResponse] = await Promise.all([
      fetchWithAuth('/reserves'),
      fetchWithAuth('/formats')
    ]);
    
    if (reservesResponse?.success && formatsResponse?.success) {
      const reserves = reservesResponse.data || [];
      const formats = formatsResponse.data || [];
      
      const activeFormats = formats.filter(f => f.isActive);
      const reserveFormatIds = reserves.map(r => r.formatId);
      const missingReserves = activeFormats.filter(f => !reserveFormatIds.includes(f.id));
      
      const infoAlert = document.getElementById('initialize-info-alert');
      if (infoAlert) {
        if (missingReserves.length > 0) {
          infoAlert.classList.remove('d-none');
          infoAlert.innerHTML = `
            <i class="bi bi-info-circle me-2"></i>
            <strong>Initialisation recommandée :</strong> ${missingReserves.length} format(s) n'ont pas encore de réserve. 
            Cliquez sur "Initialiser les réserves" pour les créer automatiquement.
          `;
        } else {
          infoAlert.classList.add('d-none');
        }
      }
    }
  } catch (error) {
    console.error('Erreur lors de la vérification du statut d\'initialisation:', error);
  }
}

// Ouvrir le modal d'initialisation des réserves
async function initializeReserves() {
  try {
    // Charger l'aperçu des réserves à créer
    await loadInitializationPreview();
    
    // Afficher le modal
    new bootstrap.Modal(document.getElementById('initialize-reserves-modal')).show();
    
  } catch (error) {
    console.error('Erreur lors de l\'ouverture du modal d\'initialisation:', error);
    showAlert('Erreur lors de l\'ouverture du modal d\'initialisation', 'danger');
  }
}

// Charger l'aperçu des réserves à créer
async function loadInitializationPreview() {
  try {
    const [reservesResponse, formatsResponse] = await Promise.all([
      fetchWithAuth('/reserves'),
      fetchWithAuth('/formats')
    ]);
    
    if (reservesResponse?.success && formatsResponse?.success) {
      const reserves = reservesResponse.data || [];
      const formats = formatsResponse.data || [];
      
      const activeFormats = formats.filter(f => f.isActive);
      const reserveFormatIds = reserves.map(r => r.formatId);
      const missingReserves = activeFormats.filter(f => !reserveFormatIds.includes(f.id));
      
      const previewTableBody = document.getElementById('preview-table-body');
      if (!previewTableBody) return;
      
      if (missingReserves.length === 0) {
        previewTableBody.innerHTML = `
          <tr>
            <td colspan="5" class="text-center text-muted">
              <i class="bi bi-check-circle text-success"></i>
              Toutes les réserves sont déjà initialisées
            </td>
          </tr>
        `;
        
        const confirmBtn = document.getElementById('confirm-initialize-btn');
        if (confirmBtn) {
          confirmBtn.disabled = true;
          confirmBtn.innerHTML = '<i class="bi bi-check"></i> Déjà initialisé';
        }
        return;
      }
      
      previewTableBody.innerHTML = '';
      
      missingReserves.forEach(format => {
        const product = format.Product;
        const category = product?.category || 'other';
        
        // Calculer les valeurs par défaut
        let minQuantity = 10;
        let maxQuantity = 100;
        let location = 'Zone générale';
        
        switch (category.toLowerCase()) {
          case 'beer':
          case 'bière':
            minQuantity = 20;
            maxQuantity = 150;
            location = 'Zone bières';
            break;
          case 'soft':
          case 'soda':
            minQuantity = 15;
            maxQuantity = 200;
            location = 'Zone sodas';
            break;
          case 'spirit':
          case 'spiritueux':
            minQuantity = 5;
            maxQuantity = 50;
            location = 'Armoire sécurisée';
            break;
          case 'wine':
          case 'vin':
            minQuantity = 8;
            maxQuantity = 60;
            location = 'Cave à vin';
            break;
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${product?.name || 'Produit inconnu'}</td>
          <td>${format.size} (${format.volume}${format.unit})</td>
          <td>
            <span class="badge bg-secondary">${category}</span>
          </td>
          <td>${minQuantity} / ${maxQuantity}</td>
          <td>${location}</td>
        `;
        previewTableBody.appendChild(row);
      });
      
      // Activer le bouton de confirmation
      const confirmBtn = document.getElementById('confirm-initialize-btn');
      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '<i class="bi bi-magic"></i> Confirmer l\'initialisation';
      }
    }
  } catch (error) {
    console.error('Erreur lors du chargement de l\'aperçu:', error);
    const previewTableBody = document.getElementById('preview-table-body');
    if (previewTableBody) {
      previewTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-danger">
            Erreur lors du chargement de l'aperçu
          </td>
        </tr>
      `;
    }
  }
}

// Confirmer l'initialisation des réserves
async function confirmInitializeReserves() {
  try {
    showAlert('Initialisation des réserves en cours...', 'info');
    
    const response = await fetchWithAuth('/reserves/initialize', {
      method: 'POST'
    });
    
    if (response && response.success) {
      const summary = response.summary;
      let message = `${summary.total} réserve(s) initialisée(s) avec succès !`;
      
      if (summary.byCategory) {
        const categoryDetails = Object.entries(summary.byCategory)
          .map(([category, count]) => `${count} ${category}`)
          .join(', ');
        message += `\n\nRépartition : ${categoryDetails}`;
      }
      
      showAlert(message, 'success');
      
      // Fermer le modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('initialize-reserves-modal'));
      if (modal) modal.hide();
      
      // Recharger la page réserve
      await loadReserveTable();
      await checkInitializationStatus();
      
    } else {
      throw new Error(response?.message || 'Erreur lors de l\'initialisation');
    }
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des réserves:', error);
    showAlert('Erreur lors de l\'initialisation: ' + error.message, 'danger');
  }
}

// Charger les formats dans le sélecteur de réserve
async function loadFormatsIntoReserveSelector() {
  try {
    const response = await fetchWithAuth('/formats');
    if (response && response.success) {
      const formatSelect = document.getElementById('reserve-format-select');
      if (formatSelect) {
        formatSelect.innerHTML = '<option value="">Sélectionnez un format</option>';
        
        response.data.forEach(format => {
          const option = document.createElement('option');
          option.value = format.id;
          option.textContent = `${format.Product?.name || 'Produit inconnu'} - ${format.size} (${format.volume}${format.unit}) - ${format.packaging}`;
          formatSelect.appendChild(option);
        });
      }
    }
  } catch (error) {
    console.error('Erreur lors du chargement des formats:', error);
  }
}

// Charger les bars dans le sélecteur de transfert
async function loadBarsIntoTransferSelector() {
  try {
    const response = await fetchWithAuth('/bars');
    if (response && response.success) {
      const barSelect = document.getElementById('transfer-bar-select');
      if (barSelect) {
        barSelect.innerHTML = '<option value="">Sélectionnez un bar</option>';
        
        response.data.filter(bar => bar.isActive).forEach(bar => {
          const option = document.createElement('option');
          option.value = bar.id;
          option.textContent = bar.name;
          barSelect.appendChild(option);
        });
      }
    }
  } catch (error) {
    console.error('Erreur lors du chargement des bars:', error);
  }
}

// Charger le tableau des réserves
async function loadReserveTable() {
  try {
    const response = await fetchWithAuth('/reserves');
    if (response && response.success) {
      displayReserves(response.data);
    } else {
      displayReserves([]);
    }
  } catch (error) {
    console.error('Erreur lors du chargement des réserves:', error);
    displayReserves([]);
  }
}

// Afficher les réserves dans le tableau
function displayReserves(reserves) {
  const tbody = document.getElementById('reserve-table-body');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  if (reserves.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Aucune réserve trouvée</td></tr>';
    return;
  }
  
  reserves.forEach(reserve => {
    const row = document.createElement('tr');
    
    // Déterminer le statut de la réserve
    let statusClass = 'success';
    let statusText = 'Bon stock';
    
    if (reserve.quantity <= 0) {
      statusClass = 'danger';
      statusText = 'Rupture';
    } else if (reserve.quantity <= reserve.minQuantity) {
      statusClass = 'warning';
      statusText = 'Stock faible';
    }
    
    const product = reserve.Format?.Product;
    const productName = product ? product.name : 'Produit inconnu';
    const formatInfo = reserve.Format ? `${reserve.Format.size} (${reserve.Format.volume}${reserve.Format.unit})` : 'Format inconnu';
    const packaging = reserve.Format?.packaging || 'N/A';
    
    row.innerHTML = `
      <td>
        ${productName}
        ${product?.brand ? `<br><small class="text-muted">${product.brand}</small>` : ''}
      </td>
      <td>
        ${formatInfo}
        <br><small class="text-muted">${packaging}</small>
      </td>
      <td><span class="fw-bold">${reserve.quantity}</span></td>
      <td>${reserve.minQuantity}</td>
      <td>${reserve.maxQuantity}</td>
      <td>${reserve.location || '-'}</td>
      <td>
        <span class="badge bg-${statusClass}">${statusText}</span>
      </td>
      <td>
        <button type="button" class="btn btn-sm btn-outline-primary me-1" onclick="editReserve(${reserve.id})" title="Modifier">
          <i class="bi bi-pencil"></i>
        </button>
        <button type="button" class="btn btn-sm btn-outline-success me-1" onclick="openTransferModal(${reserve.id})" title="Transférer vers un bar" ${reserve.quantity <= 0 ? 'disabled' : ''}>
          <i class="bi bi-arrow-right-circle"></i>
        </button>
        <button type="button" class="btn btn-sm btn-outline-danger" onclick="deleteReserve(${reserve.id})" title="Supprimer">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Ouvrir le modal de réserve pour ajouter/modifier
async function openReserveModal(reserveId = null) {
  const modal = document.getElementById('reserve-modal');
  const title = document.getElementById('reserve-modal-title');
  
  if (reserveId) {
    title.textContent = 'Modifier la réserve';
    
    try {
      const response = await fetchWithAuth(`/reserves/${reserveId}`);
      if (response && response.success) {
        const reserve = response.data;
        
        document.getElementById('reserve-id').value = reserve.id;
        document.getElementById('reserve-format-select').value = reserve.formatId;
        document.getElementById('reserve-quantity').value = reserve.quantity;
        document.getElementById('reserve-min-quantity').value = reserve.minQuantity;
        document.getElementById('reserve-max-quantity').value = reserve.maxQuantity;
        document.getElementById('reserve-location').value = reserve.location || '';
        document.getElementById('reserve-notes').value = reserve.notes || '';
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de la réserve:', error);
      showAlert('Erreur lors de la récupération de la réserve', 'danger');
    }
  } else {
    title.textContent = 'Ajouter à la réserve';
    document.getElementById('reserve-form').reset();
    document.getElementById('reserve-id').value = '';
  }
  
  new bootstrap.Modal(modal).show();
}

// Sauvegarder une réserve
async function saveReserve() {
  const reserveId = document.getElementById('reserve-id').value;
  const formatId = document.getElementById('reserve-format-select').value;
  const quantity = document.getElementById('reserve-quantity').value;
  const minQuantity = document.getElementById('reserve-min-quantity').value;
  const maxQuantity = document.getElementById('reserve-max-quantity').value;
  const location = document.getElementById('reserve-location').value.trim();
  const notes = document.getElementById('reserve-notes').value.trim();
  
  if (!formatId || quantity === '' || minQuantity === '' || maxQuantity === '') {
    showAlert('Veuillez remplir tous les champs obligatoires', 'warning');
    return;
  }
  
  try {
    const reserveData = {
      formatId: parseInt(formatId),
      quantity: parseInt(quantity),
      minQuantity: parseInt(minQuantity),
      maxQuantity: parseInt(maxQuantity),
      location: location || null,
      notes: notes || null
    };
    
    let response;
    if (reserveId) {
      response = await fetchWithAuth(`/reserves/${reserveId}`, {
        method: 'PUT',
        body: JSON.stringify(reserveData)
      });
    } else {
      response = await fetchWithAuth('/reserves', {
        method: 'POST',
        body: JSON.stringify(reserveData)
      });
    }
    
    if (response && response.success) {
      showAlert(reserveId ? 'Réserve mise à jour avec succès' : 'Réserve créée avec succès', 'success');
      
      const modal = bootstrap.Modal.getInstance(document.getElementById('reserve-modal'));
      if (modal) modal.hide();
      
      loadReserveTable();
    } else {
      throw new Error(response?.message || 'Erreur lors de la sauvegarde');
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    showAlert('Erreur lors de la sauvegarde: ' + error.message, 'danger');
  }
}

// Modifier une réserve
function editReserve(reserveId) {
  openReserveModal(reserveId);
}

// Supprimer une réserve
async function deleteReserve(reserveId) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette réserve ?')) {
    return;
  }
  
  try {
    const response = await fetchWithAuth(`/reserves/${reserveId}`, {
      method: 'DELETE'
    });
    
    if (response && response.success) {
      showAlert('Réserve supprimée avec succès', 'success');
      loadReserveTable();
    } else {
      throw new Error(response?.message || 'Erreur lors de la suppression');
    }
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    showAlert('Erreur lors de la suppression: ' + error.message, 'danger');
  }
}

// Ouvrir le modal de transfert
async function openTransferModal(reserveId) {
  try {
    const response = await fetchWithAuth(`/reserves/${reserveId}`);
    if (response && response.success) {
      const reserve = response.data;
      
      document.getElementById('transfer-reserve-id').value = reserve.id;
      document.getElementById('transfer-format-id').value = reserve.formatId;
      
      // Afficher les informations du produit
      const productName = reserve.Format?.Product?.name || 'Produit inconnu';
      const formatInfo = reserve.Format ? `${reserve.Format.size} (${reserve.Format.volume}${reserve.Format.unit})` : 'Format inconnu';
      
      document.getElementById('transfer-product-name').textContent = productName;
      document.getElementById('transfer-product-format').textContent = formatInfo;
      document.getElementById('transfer-available-quantity').textContent = reserve.quantity;
      document.getElementById('transfer-max-quantity').textContent = reserve.quantity;
      
      // Réinitialiser les sélecteurs
      document.getElementById('transfer-bar-select').value = '';
      document.getElementById('transfer-stock-select').innerHTML = '<option value="">Sélectionnez d\'abord un bar</option>';
      document.getElementById('transfer-quantity').value = '';
      document.getElementById('transfer-quantity').max = reserve.quantity;
      document.getElementById('transfer-notes').value = '';
      
      new bootstrap.Modal(document.getElementById('transfer-modal')).show();
    }
  } catch (error) {
    console.error('Erreur lors de l\'ouverture du modal de transfert:', error);
    showAlert('Erreur lors de l\'ouverture du modal de transfert', 'danger');
  }
}

// Charger les stocks d'un bar pour le transfert
async function loadStocksForTransfer(barId) {
  try {
    const formatId = document.getElementById('transfer-format-id').value;
    
    const response = await fetchWithAuth(`/stocks?barId=${barId}`);
    if (response && response.success) {
      const stockSelect = document.getElementById('transfer-stock-select');
      stockSelect.innerHTML = '<option value="">Sélectionnez un stock</option>';
      
      // Filtrer les stocks qui correspondent au format
      const matchingStocks = response.data.filter(stock => stock.formatId == formatId);
      
      if (matchingStocks.length === 0) {
        stockSelect.innerHTML = '<option value="">Aucun stock compatible trouvé</option>';
        return;
      }
      
      matchingStocks.forEach(stock => {
        const option = document.createElement('option');
        option.value = stock.id;
        const currentQty = stock.currentQuantity || stock.quantity || 0;
        option.textContent = `Stock actuel: ${currentQty} (Min: ${stock.minThreshold}, Max: ${stock.maxThreshold})`;
        stockSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Erreur lors du chargement des stocks:', error);
    const stockSelect = document.getElementById('transfer-stock-select');
    stockSelect.innerHTML = '<option value="">Erreur lors du chargement</option>';
  }
}

// Effectuer le transfert
async function performTransfer() {
  const reserveId = document.getElementById('transfer-reserve-id').value;
  const stockId = document.getElementById('transfer-stock-select').value;
  const barId = document.getElementById('transfer-bar-select').value;
  const quantity = document.getElementById('transfer-quantity').value;
  const notes = document.getElementById('transfer-notes').value.trim();
  
  if (!reserveId || !stockId || !barId || !quantity || quantity <= 0) {
    showAlert('Veuillez remplir tous les champs obligatoires', 'warning');
    return;
  }
  
  const maxQuantity = parseInt(document.getElementById('transfer-max-quantity').textContent);
  if (parseInt(quantity) > maxQuantity) {
    showAlert(`Quantité trop élevée. Maximum disponible: ${maxQuantity}`, 'warning');
    return;
  }
  
  try {
    const transferData = {
      reserveId: parseInt(reserveId),
      stockId: parseInt(stockId),
      barId: parseInt(barId),
      quantity: parseInt(quantity),
      notes: notes || null,
      transferredBy: localStorage.getItem('currentUser') || 'Utilisateur inconnu'
    };
    
    const response = await fetchWithAuth('/reserves/transfer', {
      method: 'POST',
      body: JSON.stringify(transferData)
    });
    
    if (response && response.success) {
      showAlert(response.message || 'Transfert effectué avec succès', 'success');
      
      const modal = bootstrap.Modal.getInstance(document.getElementById('transfer-modal'));
      if (modal) modal.hide();
      
      // Recharger les données
      loadReserveTable();
      
      // Invalider le cache du dashboard pour refléter les changements
      if (typeof dashboardCache !== 'undefined') {
        dashboardCache = null;
      }
    } else {
      throw new Error(response?.message || 'Erreur lors du transfert');
    }
  } catch (error) {
    console.error('Erreur lors du transfert:', error);
    showAlert('Erreur lors du transfert: ' + error.message, 'danger');
  }
}

// ====================================
// GESTION DES ENTREPRISES
// ====================================

// Gestionnaire d'événement pour le sélecteur d'entreprise
function setupCompanySelectorEvents() {
  const dropdownMenu = document.getElementById('company-dropdown-menu');
  if (dropdownMenu) {
    dropdownMenu.addEventListener('click', function(e) {
      if (e.target.classList.contains('dropdown-item')) {
        e.preventDefault();
        const companyId = e.target.getAttribute('data-company-id');
        selectCompany(companyId || null);
      }
    });
  }
}

// Charger et afficher le sélecteur d'entreprises
async function loadCompanySelector() {
  try {
    const response = await fetchWithAuth('/companies');
    if (response && response.success) {
      const companies = response.data.filter(company => company.isActive);
      
      // Afficher le sélecteur s'il y a des entreprises
      const selectorContainer = document.getElementById('company-selector-container');
      if (selectorContainer && companies.length > 0) {
        selectorContainer.classList.remove('d-none');
        
        // Peupler le menu déroulant
        const dropdownMenu = document.getElementById('company-dropdown-menu');
        if (dropdownMenu) {
          // Garder l'option "Toutes les entreprises"
          const allOption = dropdownMenu.querySelector('[data-company-id=""]');
          dropdownMenu.innerHTML = '';
          if (allOption) {
            dropdownMenu.appendChild(allOption);
            dropdownMenu.appendChild(document.createElement('hr')).className = 'dropdown-divider';
          }
          
          companies.forEach(company => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.className = 'dropdown-item';
            a.href = '#';
            a.setAttribute('data-company-id', company.id);
            a.innerHTML = `<i class="bi bi-building me-2"></i>${company.name}`;
            li.appendChild(a);
            dropdownMenu.appendChild(li);
          });
        }
      }
      
      // Pour les admins, afficher "Toutes les entreprises" par défaut
      const currentUser = localStorage.getItem('user');
      const user = currentUser ? JSON.parse(currentUser) : null;
      
      if (user && user.role === 'admin') {
        // Admin : voir toutes les entreprises par défaut
        selectCompany(null);
      } else {
        // Autres utilisateurs : restaurer la sélection précédente
        const savedCompanyId = localStorage.getItem('selectedCompanyId');
        if (savedCompanyId && companies.find(c => c.id == savedCompanyId)) {
          selectCompany(savedCompanyId);
        }
      }
    }
  } catch (error) {
    console.error('Erreur lors du chargement du sélecteur d\'entreprises:', error);
  }
}

// Fonction pour réinitialiser la sélection d'entreprise (pour les admins)
function resetCompanySelection() {
  selectedCompanyId = null;
  localStorage.removeItem('selectedCompanyId');
  selectCompany(null);
  showAlert('Affichage de toutes les entreprises', 'success');
}

// Sélectionner une entreprise
function selectCompany(companyId) {
  selectedCompanyId = companyId || null;
  
  // Sauvegarder la sélection
  if (companyId) {
    localStorage.setItem('selectedCompanyId', companyId);
  } else {
    localStorage.removeItem('selectedCompanyId');
  }
  
  // Mettre à jour l'affichage du sélecteur
  const selectedNameSpan = document.getElementById('selected-company-name');
  const dashboardCompanyName = document.getElementById('dashboard-company-name');
  const currentCompanyInfo = document.getElementById('current-company-info');
  const resetCompanyBtn = document.getElementById('reset-company-btn');
  
  // Vérifier si l'utilisateur est admin
  const currentUser = localStorage.getItem('user');
  const user = currentUser ? JSON.parse(currentUser) : null;
  const isAdmin = user && user.role === 'admin';
  
  if (companyId) {
    // Trouver le nom de l'entreprise
    const companyLink = document.querySelector(`[data-company-id="${companyId}"]`);
    const companyName = companyLink ? companyLink.textContent.replace(/^\s*\S+\s*/, '') : 'Entreprise inconnue';
    
    if (selectedNameSpan) selectedNameSpan.textContent = companyName;
    if (dashboardCompanyName) dashboardCompanyName.textContent = companyName;
    if (currentCompanyInfo) currentCompanyInfo.classList.remove('d-none');
    
    // Afficher le bouton de réinitialisation pour les admins
    if (resetCompanyBtn && isAdmin) {
      resetCompanyBtn.classList.remove('d-none');
    }
  } else {
    if (selectedNameSpan) selectedNameSpan.textContent = 'Toutes les entreprises';
    if (dashboardCompanyName) dashboardCompanyName.textContent = 'Toutes les entreprises';
    if (currentCompanyInfo) currentCompanyInfo.classList.add('d-none');
    
    // Masquer le bouton de réinitialisation
    if (resetCompanyBtn) {
      resetCompanyBtn.classList.add('d-none');
    }
  }
  
  // Recharger les données avec le nouveau filtre
  refreshDataForSelectedCompany();
}

// Recharger les données pour l'entreprise sélectionnée
function refreshDataForSelectedCompany() {
  // Invalider le cache du dashboard
  dashboardCache = null;
  
  // Recharger selon la page actuelle
  const currentPage = window.location.hash.replace('#', '') || 'dashboard';
  switch(currentPage) {
    case 'dashboard':
      if (typeof loadDashboardData === 'function') {
        loadDashboardData();
      }
      break;
    case 'bars':
      if (typeof loadBars === 'function') {
        loadBars();
      }
      break;
    case 'stocks':
      if (typeof loadStocks === 'function') {
        loadStocks();
      }
      break;
    case 'reserve':
      if (typeof loadReserve === 'function') {
        loadReserve();
      }
      break;
  }
}

// Charger la page des entreprises
async function loadCompanies() {
  try {
    const response = await fetchWithAuth('/companies');
    if (response && response.success) {
      displayCompanies(response.data);
    } else {
      console.error('Erreur lors du chargement des entreprises:', response);
      showAlert('Erreur lors du chargement des entreprises', 'danger');
    }
  } catch (error) {
    console.error('Erreur lors du chargement des entreprises:', error);
    showAlert('Erreur lors du chargement des entreprises', 'danger');
  }
}

// Afficher les entreprises dans le tableau
function displayCompanies(companies) {
  const tbody = document.getElementById('companies-table-body');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  if (companies.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Aucune entreprise trouvée</td></tr>';
    return;
  }
  
  companies.forEach(company => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <strong>${company.name}</strong>
        ${selectedCompanyId == company.id ? '<span class="badge bg-primary ms-2">Sélectionnée</span>' : ''}
      </td>
      <td>${company.address || '-'}</td>
      <td>${company.phone || '-'}</td>
      <td>${company.email || '-'}</td>
      <td>
        <span class="badge bg-info">${company.Bars?.length || 0} bar(s)</span>
      </td>
      <td>
        <span class="badge bg-${company.isActive ? 'success' : 'secondary'}">
          ${company.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td>
        <div class="btn-group" role="group">
          <button type="button" class="btn btn-sm btn-outline-primary" onclick="editCompany(${company.id})" title="Modifier">
            <i class="bi bi-pencil"></i>
          </button>
          <button type="button" class="btn btn-sm btn-outline-success" onclick="selectCompany(${company.id})" title="Sélectionner">
            <i class="bi bi-check-circle"></i>
          </button>
          <button type="button" class="btn btn-sm btn-outline-info" onclick="viewCompanyBars(${company.id})" title="Voir les bars">
            <i class="bi bi-shop"></i>
          </button>
          <button type="button" class="btn btn-sm btn-outline-danger" onclick="deleteCompany(${company.id})" title="Supprimer">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Ouvrir le modal d'entreprise pour ajouter/modifier
async function openCompanyModal(companyId = null) {
  const modal = document.getElementById('company-modal');
  const title = document.getElementById('company-modal-title');
  
  if (companyId) {
    title.textContent = 'Modifier l\'entreprise';
    
    try {
      const response = await fetchWithAuth(`/companies/${companyId}`);
      if (response && response.success) {
        const company = response.data;
        
        document.getElementById('company-id').value = company.id;
        document.getElementById('company-name').value = company.name || '';
        document.getElementById('company-address').value = company.address || '';
        document.getElementById('company-phone').value = company.phone || '';
        document.getElementById('company-email').value = company.email || '';
        document.getElementById('company-active').checked = company.isActive !== false;
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'entreprise:', error);
      showAlert('Erreur lors de la récupération de l\'entreprise', 'danger');
    }
  } else {
    title.textContent = 'Ajouter une entreprise';
    document.getElementById('company-form').reset();
    document.getElementById('company-id').value = '';
    document.getElementById('company-active').checked = true;
  }
  
  new bootstrap.Modal(modal).show();
}

// Sauvegarder une entreprise
async function saveCompany() {
  const companyId = document.getElementById('company-id').value;
  const name = document.getElementById('company-name').value.trim();
  const address = document.getElementById('company-address').value.trim();
  const phone = document.getElementById('company-phone').value.trim();
  const email = document.getElementById('company-email').value.trim();
  const isActive = document.getElementById('company-active').checked;
  
  if (!name) {
    showAlert('Le nom de l\'entreprise est requis', 'warning');
    return;
  }
  
  try {
    const companyData = {
      name,
      address: address || null,
      phone: phone || null,
      email: email || null,
      isActive
    };
    
    let response;
    if (companyId) {
      response = await fetchWithAuth(`/companies/${companyId}`, {
        method: 'PUT',
        body: JSON.stringify(companyData)
      });
    } else {
      response = await fetchWithAuth('/companies', {
        method: 'POST',
        body: JSON.stringify(companyData)
      });
    }
    
    if (response && response.success) {
      showAlert(companyId ? 'Entreprise mise à jour avec succès' : 'Entreprise créée avec succès', 'success');
      
      const modal = bootstrap.Modal.getInstance(document.getElementById('company-modal'));
      if (modal) modal.hide();
      
      loadCompanies();
      loadCompanySelector(); // Recharger le sélecteur
    } else {
      throw new Error(response?.message || 'Erreur lors de la sauvegarde');
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    showAlert('Erreur lors de la sauvegarde: ' + error.message, 'danger');
  }
}

// Modifier une entreprise
function editCompany(companyId) {
  openCompanyModal(companyId);
}

// Supprimer une entreprise
async function deleteCompany(companyId) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette entreprise ? Tous les bars associés seront également supprimés.')) {
    return;
  }
  
  try {
    const response = await fetchWithAuth(`/companies/${companyId}`, {
      method: 'DELETE'
    });
    
    if (response && response.success) {
      showAlert('Entreprise supprimée avec succès', 'success');
      
      // Si l'entreprise supprimée était sélectionnée, désélectionner
      if (selectedCompanyId == companyId) {
        selectCompany(null);
      }
      
      loadCompanies();
      loadCompanySelector();
    } else {
      throw new Error(response?.message || 'Erreur lors de la suppression');
    }
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    showAlert('Erreur lors de la suppression: ' + error.message, 'danger');
  }
}

// Voir les bars d'une entreprise
function viewCompanyBars(companyId) {
  selectCompany(companyId);
  navigateTo('bars');
}

// ====================================
// GESTION DES BARS AVEC ENTREPRISES
// ====================================

// Charger les entreprises dans le sélecteur de bar
async function loadCompaniesIntoBarSelector() {
  try {
    const response = await fetchWithAuth('/companies');
    if (response && response.success) {
      const companies = response.data.filter(company => company.isActive);
      const barCompanySelect = document.getElementById('bar-company');
      
      if (barCompanySelect) {
        barCompanySelect.innerHTML = '<option value="">Sélectionnez une entreprise</option>';
        
        companies.forEach(company => {
          const option = document.createElement('option');
          option.value = company.id;
          option.textContent = company.name;
          barCompanySelect.appendChild(option);
        });
        
        // Pré-sélectionner l'entreprise actuelle si applicable
        if (selectedCompanyId) {
          barCompanySelect.value = selectedCompanyId;
        }
      }
    }
  } catch (error) {
    console.error('Erreur lors du chargement des entreprises:', error);
  }
}

// Ouvrir le modal de bar pour ajouter/modifier
async function openBarModal(barId = null) {
  const modal = document.getElementById('bar-modal');
  const title = document.getElementById('bar-modal-title');
  
  // Charger les entreprises dans le sélecteur
  await loadCompaniesIntoBarSelector();
  
  if (barId) {
    title.textContent = 'Modifier le bar';
    
    try {
      const response = await fetchWithAuth(`/bars/${barId}`);
      if (response && response.success) {
        const bar = response.data;
        
        document.getElementById('bar-id').value = bar.id;
        document.getElementById('bar-name').value = bar.name || '';
        document.getElementById('bar-location').value = bar.location || '';
        document.getElementById('bar-company').value = bar.companyId || '';
        document.getElementById('bar-active').checked = bar.isActive !== false;
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du bar:', error);
      showAlert('Erreur lors de la récupération du bar', 'danger');
    }
  } else {
    title.textContent = 'Ajouter un bar';
    document.getElementById('bar-form').reset();
    document.getElementById('bar-id').value = '';
    document.getElementById('bar-active').checked = true;
    
    // Pré-sélectionner l'entreprise actuelle
    if (selectedCompanyId) {
      document.getElementById('bar-company').value = selectedCompanyId;
    }
  }
  
  new bootstrap.Modal(modal).show();
}

// Sauvegarder un bar
async function saveBar() {
  const barId = document.getElementById('bar-id').value;
  const name = document.getElementById('bar-name').value.trim();
  const location = document.getElementById('bar-location').value.trim();
  const companyId = document.getElementById('bar-company').value;
  const isActive = document.getElementById('bar-active').checked;
  
  if (!name) {
    showAlert('Le nom du bar est requis', 'warning');
    return;
  }
  
  if (!companyId) {
    showAlert('Veuillez sélectionner une entreprise', 'warning');
    return;
  }
  
  try {
    const barData = {
      name,
      location: location || null,
      companyId: parseInt(companyId),
      isActive
    };
    
    let response;
    if (barId) {
      response = await fetchWithAuth(`/bars/${barId}`, {
        method: 'PUT',
        body: JSON.stringify(barData)
      });
    } else {
      response = await fetchWithAuth('/bars', {
        method: 'POST',
        body: JSON.stringify(barData)
      });
    }
    
    if (response && response.success) {
      showAlert(barId ? 'Bar mis à jour avec succès' : 'Bar créé avec succès', 'success');
      
      const modal = bootstrap.Modal.getInstance(document.getElementById('bar-modal'));
      if (modal) modal.hide();
      
      if (typeof loadBars === 'function') {
        loadBars();
      }
    } else {
      throw new Error(response?.message || 'Erreur lors de la sauvegarde');
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    showAlert('Erreur lors de la sauvegarde: ' + error.message, 'danger');
  }
}

// ====================================
// GESTION DES RÉSERVES MULTIPLES
// ====================================

// Variables globales pour les réserves multiples
let selectedReserveId = null;
let reserveTypes = {};

// Charger la page des réserves multiples
async function loadMultiReserves() {
  try {
    console.log('Chargement des réserves multiples...');
    
    // Charger les types de réserves
    await loadReserveTypes();
    
    // Charger les statistiques
    await loadReserveStats();
    
    // Charger les réserves
    await loadMultiReservesTable();
    
    console.log('Page réserves multiples chargée avec succès');
  } catch (error) {
    console.error('Erreur lors du chargement des réserves multiples:', error);
    showAlert('Erreur lors du chargement des réserves multiples', 'danger');
  }
}

// Charger les types de réserves
async function loadReserveTypes() {
  try {
    let url = '/api/multi-reserves/types';
    if (selectedCompanyId) {
      url += `?companyId=${selectedCompanyId}`;
    }
    
    const response = await fetchWithAuth(url);
    if (response && response.success) {
      reserveTypes = response.data;
      
      // Peupler le sélecteur de types
      const typeFilter = document.getElementById('reserve-type-filter');
      if (typeFilter) {
        typeFilter.innerHTML = '<option value="">Tous les types</option>';
        Object.entries(reserveTypes).forEach(([key, config]) => {
          const option = document.createElement('option');
          option.value = key;
          option.textContent = config.name;
          typeFilter.appendChild(option);
        });
      }
    }
  } catch (error) {
    console.error('Erreur lors du chargement des types de réserves:', error);
  }
}

// Charger les statistiques des réserves
async function loadReserveStats() {
  try {
    let url = '/api/multi-reserves/stats';
    if (selectedCompanyId) {
      url += `?companyId=${selectedCompanyId}`;
    }
    
    const response = await fetchWithAuth(url);
    if (response && response.success) {
      const stats = response.data;
      
      document.getElementById('total-reserves-count').textContent = stats.totalReserves || 0;
      document.getElementById('total-capacity-count').textContent = stats.totalCapacity || 0;
      document.getElementById('total-stock-count').textContent = stats.totalStock || 0;
      document.getElementById('alerts-count').textContent = stats.alertsCount || 0;
    }
  } catch (error) {
    console.error('Erreur lors du chargement des statistiques:', error);
  }
}

// Charger le tableau des réserves
async function loadMultiReservesTable() {
  try {
    let url = '/api/multi-reserves';
    if (selectedCompanyId) {
      url += `?companyId=${selectedCompanyId}`;
    }
    
    const response = await fetchWithAuth(url);
    if (response && response.success) {
      displayMultiReserves(response.data);
      
      // Peupler le sélecteur de réserves
      const reserveFilter = document.getElementById('reserve-filter');
      if (reserveFilter) {
        reserveFilter.innerHTML = '<option value="">Toutes les réserves</option>';
        response.data.forEach(reserve => {
          const option = document.createElement('option');
          option.value = reserve.id;
          option.textContent = reserve.name;
          reserveFilter.appendChild(option);
        });
      }
    }
  } catch (error) {
    console.error('Erreur lors du chargement des réserves:', error);
  }
}

// Afficher les réserves dans le tableau
function displayMultiReserves(reserves) {
  const tbody = document.getElementById('multi-reserves-table-body');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  if (reserves.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Aucune réserve trouvée</td></tr>';
    return;
  }
  
  reserves.forEach(reserve => {
    const stockCount = reserve.ReserveStocks?.length || 0;
    const typeConfig = reserveTypes[reserve.type] || { name: reserve.type };
    
    // Calculer le statut de la réserve
    let statusClass = 'success';
    let statusText = 'Bon';
    let lowStockCount = 0;
    
    if (reserve.ReserveStocks) {
      lowStockCount = reserve.ReserveStocks.filter(stock => 
        stock.quantity <= stock.minQuantity
      ).length;
      
      if (lowStockCount > 0) {
        statusClass = 'warning';
        statusText = `${lowStockCount} alerte(s)`;
      }
    }
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <strong>${reserve.name}</strong>
        ${reserve.Company ? `<br><small class="text-muted">${reserve.Company.name}</small>` : ''}
      </td>
      <td>
        <span class="badge bg-primary">${typeConfig.name}</span>
      </td>
      <td>${reserve.temperature || '-'}</td>
      <td>${reserve.capacity ? `${reserve.capacity} unités` : '-'}</td>
      <td>${reserve.location || '-'}</td>
      <td>
        <span class="badge bg-info">${stockCount} produit(s)</span>
      </td>
      <td>
        <span class="badge bg-${statusClass}">${statusText}</span>
      </td>
      <td>
        <div class="btn-group" role="group">
          <button type="button" class="btn btn-sm btn-outline-primary" onclick="viewReserveStocks(${reserve.id}, '${reserve.name}')" title="Voir les stocks">
            <i class="bi bi-eye"></i>
          </button>
          <button type="button" class="btn btn-sm btn-outline-secondary" onclick="editMultiReserve(${reserve.id})" title="Modifier">
            <i class="bi bi-pencil"></i>
          </button>
          <button type="button" class="btn btn-sm btn-outline-danger" onclick="deleteMultiReserve(${reserve.id})" title="Supprimer">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Voir les stocks d'une réserve
async function viewReserveStocks(reserveId, reserveName) {
  selectedReserveId = reserveId;
  
  try {
    const response = await fetchWithAuth(`/api/multi-reserves/${reserveId}`);
    if (response && response.success) {
      const reserve = response.data;
      
      document.getElementById('selected-reserve-name').textContent = reserveName;
      document.getElementById('reserve-stocks-card').style.display = 'block';
      
      displayReserveStocks(reserve.ReserveStocks || []);
      
      // Scroll vers la section stocks
      document.getElementById('reserve-stocks-card').scrollIntoView({ behavior: 'smooth' });
    }
  } catch (error) {
    console.error('Erreur lors du chargement des stocks de la réserve:', error);
    showAlert('Erreur lors du chargement des stocks', 'danger');
  }
}

// Afficher les stocks d'une réserve
function displayReserveStocks(stocks) {
  const tbody = document.getElementById('reserve-stocks-table-body');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  if (stocks.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">Aucun stock dans cette réserve</td></tr>';
    return;
  }
  
  stocks.forEach(stock => {
    const product = stock.Format?.Product;
    const format = stock.Format;
    
    // Calculer le statut du stock
    let statusClass = 'success';
    let statusText = 'Bon';
    
    if (stock.quantity <= 0) {
      statusClass = 'danger';
      statusText = 'Rupture';
    } else if (stock.quantity <= stock.minQuantity) {
      statusClass = 'warning';
      statusText = 'Stock faible';
    }
    
    // Formater la date d'expiration
    const expirationDate = stock.expirationDate 
      ? new Date(stock.expirationDate).toLocaleDateString('fr-FR')
      : '-';
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${product ? product.name : 'Produit inconnu'}</td>
      <td>${format ? `${format.size} (${format.packaging})` : 'Format inconnu'}</td>
      <td>${stock.quantity}</td>
      <td>${stock.minQuantity}</td>
      <td>${stock.maxQuantity}</td>
      <td>${stock.location || '-'}</td>
      <td>${expirationDate}</td>
      <td>
        <span class="badge bg-${statusClass}">${statusText}</span>
      </td>
      <td>
        <div class="btn-group" role="group">
          <button type="button" class="btn btn-sm btn-outline-primary" onclick="editReserveStock(${stock.id})" title="Modifier">
            <i class="bi bi-pencil"></i>
          </button>
          <button type="button" class="btn btn-sm btn-outline-danger" onclick="deleteReserveStock(${stock.id})" title="Supprimer">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Fermer la sélection de réserve
function clearReserveSelection() {
  selectedReserveId = null;
  document.getElementById('reserve-stocks-card').style.display = 'none';
}

// Ouvrir le modal de réserve
async function openMultiReserveModal(reserveId = null) {
  const modal = document.getElementById('multi-reserve-modal');
  const title = document.getElementById('multi-reserve-modal-title');
  
  if (reserveId) {
    title.textContent = 'Modifier la réserve';
    
    try {
      const response = await fetchWithAuth(`/api/multi-reserves/${reserveId}`);
      if (response && response.success) {
        const reserve = response.data;
        
        document.getElementById('multi-reserve-id').value = reserve.id;
        document.getElementById('multi-reserve-name').value = reserve.name || '';
        document.getElementById('multi-reserve-type').value = reserve.type || '';
        document.getElementById('multi-reserve-temperature').value = reserve.temperature || '';
        document.getElementById('multi-reserve-capacity').value = reserve.capacity || '';
        document.getElementById('multi-reserve-location').value = reserve.location || '';
        document.getElementById('multi-reserve-description').value = reserve.description || '';
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de la réserve:', error);
      showAlert('Erreur lors de la récupération de la réserve', 'danger');
    }
  } else {
    title.textContent = 'Nouvelle réserve';
    document.getElementById('multi-reserve-form').reset();
    document.getElementById('multi-reserve-id').value = '';
  }
  
  new bootstrap.Modal(modal).show();
}

// Sauvegarder une réserve
async function saveMultiReserve() {
  const reserveId = document.getElementById('multi-reserve-id').value;
  const name = document.getElementById('multi-reserve-name').value.trim();
  const type = document.getElementById('multi-reserve-type').value;
  const temperature = document.getElementById('multi-reserve-temperature').value.trim();
  const capacity = document.getElementById('multi-reserve-capacity').value;
  const location = document.getElementById('multi-reserve-location').value.trim();
  const description = document.getElementById('multi-reserve-description').value.trim();
  
  if (!name || !type) {
    showAlert('Le nom et le type de réserve sont requis', 'warning');
    return;
  }
  
  try {
    const reserveData = {
      companyId: selectedCompanyId,
      name,
      type,
      temperature: temperature || null,
      capacity: capacity ? parseInt(capacity) : null,
      location: location || null,
      description: description || null
    };
    
    let response;
    if (reserveId) {
      response = await fetchWithAuth(`/api/multi-reserves/${reserveId}`, {
        method: 'PUT',
        body: JSON.stringify(reserveData)
      });
    } else {
      response = await fetchWithAuth('/api/multi-reserves', {
        method: 'POST',
        body: JSON.stringify(reserveData)
      });
    }
    
    if (response && response.success) {
      showAlert(reserveId ? 'Réserve mise à jour avec succès' : 'Réserve créée avec succès', 'success');
      
      const modal = bootstrap.Modal.getInstance(document.getElementById('multi-reserve-modal'));
      if (modal) modal.hide();
      
      loadMultiReserves();
    } else {
      throw new Error(response?.message || 'Erreur lors de la sauvegarde');
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    showAlert('Erreur lors de la sauvegarde: ' + error.message, 'danger');
  }
}

// Modifier une réserve
function editMultiReserve(reserveId) {
  openMultiReserveModal(reserveId);
}

// Supprimer une réserve
async function deleteMultiReserve(reserveId) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette réserve ? Tous les stocks associés seront également supprimés.')) {
    return;
  }
  
  try {
    const response = await fetchWithAuth(`/api/multi-reserves/${reserveId}`, {
      method: 'DELETE'
    });
    
    if (response && response.success) {
      showAlert('Réserve supprimée avec succès', 'success');
      loadMultiReserves();
      
      // Fermer la sélection si c'était la réserve sélectionnée
      if (selectedReserveId == reserveId) {
        clearReserveSelection();
      }
    } else {
      throw new Error(response?.message || 'Erreur lors de la suppression');
    }
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    showAlert('Erreur lors de la suppression: ' + error.message, 'danger');
  }
}

// Initialiser les réserves par défaut
async function initializeDefaultReserves() {
  if (!selectedCompanyId) {
    showAlert('Veuillez sélectionner une entreprise avant d\'initialiser les réserves', 'warning');
    return;
  }
  
  if (!confirm('Voulez-vous initialiser les réserves par défaut pour cette entreprise ? Cette action créera 5 réserves types (Frigorifique, Congélateur, Sec, Cave, Bar).')) {
    return;
  }
  
  try {
    const response = await fetchWithAuth('/api/multi-reserves/initialize-defaults', {
      method: 'POST',
      body: JSON.stringify({ companyId: selectedCompanyId })
    });
    
    if (response && response.success) {
      showAlert(`${response.data.length} réserves par défaut créées avec succès`, 'success');
      loadMultiReserves();
    } else {
      throw new Error(response?.message || 'Erreur lors de l\'initialisation');
    }
  } catch (error) {
    console.error('Erreur lors de l\'initialisation:', error);
    showAlert('Erreur lors de l\'initialisation: ' + error.message, 'danger');
  }
}

// ====================================
// INITIALISATION DE L'APPLICATION
// ====================================

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
  // Protection contre les initialisations multiples
  if (isInitialized) {
    console.log('Application déjà initialisée, sortie...');
    return;
  }
  
  console.log('DOM chargé, initialisation de l\'application...');
  isInitialized = true;
  
  // Gestionnaires d'événements pour les boutons d'ajout (une seule fois)
  const addProductBtn = document.getElementById('add-product-btn');
  if (addProductBtn) {
    addProductBtn.addEventListener('click', () => openProductModal());
  }
  
  // Gestionnaires pour les entreprises
  const addCompanyBtn = document.getElementById('add-company-btn');
  if (addCompanyBtn) {
    addCompanyBtn.addEventListener('click', () => openCompanyModal());
  }
  
  const saveCompanyBtn = document.getElementById('save-company-btn');
  if (saveCompanyBtn) {
    saveCompanyBtn.addEventListener('click', saveCompany);
  }
  
  // Gestionnaires pour les bars
  const addBarBtn = document.getElementById('add-bar-btn');
  if (addBarBtn) {
    addBarBtn.addEventListener('click', () => openBarModal());
  }
  
  const saveBarBtn = document.getElementById('save-bar-btn');
  if (saveBarBtn) {
    saveBarBtn.addEventListener('click', saveBar);
  }
  
  // Initialiser le sélecteur d'entreprise
  setupCompanySelectorEvents();
  
  // Gestionnaire pour la sélection d'entreprise (backup)
  document.addEventListener('click', function(e) {
    if (e.target.matches('[data-company-id]')) {
      e.preventDefault();
      const companyId = e.target.getAttribute('data-company-id');
      selectCompany(companyId || null);
    }
  });
  
  // Bouton d'ajout de format dans le modal produit
  const addFormatToProductBtn = document.getElementById('add-format-to-product-btn');
  if (addFormatToProductBtn) {
    addFormatToProductBtn.addEventListener('click', showAddFormatForm);
  }
  
  // Bouton de sauvegarde de format
  const saveNewFormatBtn = document.getElementById('save-new-format-btn');
  if (saveNewFormatBtn) {
    saveNewFormatBtn.addEventListener('click', saveNewFormat);
  }
  
  // Bouton d'annulation de format
  const cancelNewFormatBtn = document.getElementById('cancel-new-format-btn');
  if (cancelNewFormatBtn) {
    cancelNewFormatBtn.addEventListener('click', hideAddFormatForm);
  }
  
  // Sauvegarder le produit
  const saveProductBtn = document.getElementById('save-product-btn');
  if (saveProductBtn) {
    saveProductBtn.addEventListener('click', saveProduct);
  }
  
  // Gestionnaire pour le sélecteur de bar dans la page stocks
  const stockBarSelect = document.getElementById('stock-bar-select');
  if (stockBarSelect) {
    stockBarSelect.addEventListener('change', function() {
      const selectedBarId = this.value;
      loadStocksTable(selectedBarId || null);
    });
  }
  
  // Gestionnaire pour le sélecteur de bar dans le dashboard
  const dashboardBarSelect = document.getElementById('bar-select');
  if (dashboardBarSelect) {
    dashboardBarSelect.addEventListener('change', function() {
      const selectedBarId = this.value;
      
      // Sauvegarder la sélection pour usage ultérieur
      if (selectedBarId) {
        localStorage.setItem('selectedBarId', selectedBarId);
      } else {
        localStorage.removeItem('selectedBarId');
      }
      
      // Charger les produits à recharger pour ce bar
      loadRestockItems(selectedBarId);
      
      // Mettre à jour le nom du bar sélectionné
      const selectedBarNameSpan = document.getElementById('selected-bar-name');
      if (selectedBarNameSpan) {
        if (selectedBarId) {
          const selectedOption = this.options[this.selectedIndex];
          selectedBarNameSpan.textContent = `- ${selectedOption.text}`;
        } else {
          selectedBarNameSpan.textContent = '';
        }
      }
    });
  }

  // Bouton d'actualisation de tous les bars du dashboard
  const refreshAllBarsBtn = document.getElementById('refresh-all-bars-btn');
  if (refreshAllBarsBtn) {
    refreshAllBarsBtn.addEventListener('click', function() {
      dashboardCache = null; // Invalider le cache
      loadDashboardData();
      showAlert('Actualisation en cours...', 'info');
    });
  }

  // Gestionnaires d'événements pour la réserve
  const addReserveBtn = document.getElementById('add-reserve-btn');
  if (addReserveBtn) {
    addReserveBtn.addEventListener('click', () => openReserveModal());
  }

  const saveReserveBtn = document.getElementById('save-reserve-btn');
  if (saveReserveBtn) {
    saveReserveBtn.addEventListener('click', saveReserve);
  }

  const initializeReservesBtn = document.getElementById('initialize-reserves-btn');
  if (initializeReservesBtn) {
    initializeReservesBtn.addEventListener('click', initializeReserves);
  }

  const confirmInitializeBtn = document.getElementById('confirm-initialize-btn');
  if (confirmInitializeBtn) {
    confirmInitializeBtn.addEventListener('click', confirmInitializeReserves);
  }

  // Gestionnaire pour le changement de bar dans le modal de transfert
  const transferBarSelect = document.getElementById('transfer-bar-select');
  if (transferBarSelect) {
    transferBarSelect.addEventListener('change', function() {
      const selectedBarId = this.value;
      if (selectedBarId) {
        loadStocksForTransfer(selectedBarId);
      } else {
        document.getElementById('transfer-stock-select').innerHTML = '<option value="">Sélectionnez d\'abord un bar</option>';
      }
    });
  }

  // Bouton de confirmation de transfert
  const confirmTransferBtn = document.getElementById('confirm-transfer-btn');
  if (confirmTransferBtn) {
    confirmTransferBtn.addEventListener('click', performTransfer);
  }

  // Gestionnaires pour les réserves multiples
  const initializeDefaultReservesBtn = document.getElementById('initialize-default-reserves-btn');
  if (initializeDefaultReservesBtn) {
    initializeDefaultReservesBtn.addEventListener('click', initializeDefaultReserves);
  }

  const addNewReserveBtn = document.getElementById('add-new-reserve-btn');
  if (addNewReserveBtn) {
    addNewReserveBtn.addEventListener('click', () => openMultiReserveModal());
  }

  const saveMultiReserveBtn = document.getElementById('save-multi-reserve-btn');
  if (saveMultiReserveBtn) {
    saveMultiReserveBtn.addEventListener('click', saveMultiReserve);
  }

  const clearReserveSelectionBtn = document.getElementById('clear-reserve-selection');
  if (clearReserveSelectionBtn) {
    clearReserveSelectionBtn.addEventListener('click', clearReserveSelection);
  }
  
  // Gestionnaire pour le bouton de recherche d'historique
  const loadHistoryBtn = document.getElementById('load-history-btn');
  if (loadHistoryBtn) {
    loadHistoryBtn.addEventListener('click', async function() {
      const barId = document.getElementById('history-bar-select').value;
      const startDate = document.getElementById('history-start-date').value;
      const endDate = document.getElementById('history-end-date').value;
      
      try {
        let url = '/stock-history';
        const params = new URLSearchParams();
        
        if (barId) params.append('barId', barId);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        
        if (params.toString()) {
          url += '?' + params.toString();
        }
        
        const response = await fetchWithAuth(url);
        if (response && response.success) {
          displayStockHistory(response.data);
        } else {
          displayStockHistory([]);
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'historique:', error);
        displayStockHistory([]);
      }
    });
  }
  
  // Navigation (une seule fois)
  window.addEventListener('hashchange', handleRoute);
  
  // Navigation navbar (une seule fois)
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        navigateTo(href.substring(1));
      }
    });
  });
  
  // Charger le sélecteur d'entreprises si l'utilisateur est connecté
  if (checkAuth()) {
    loadCompanySelector();
    updateUIForUserRole(); // Mettre à jour l'interface selon les permissions
  }
  
  // Initialiser la route actuelle
  handleRoute();
}); 