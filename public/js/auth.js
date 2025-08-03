// Fonctions d'authentification
const API_URL = '/api';

// Fonction pour vérifier si l'utilisateur est connecté
function isAuthenticated() {
  return localStorage.getItem('token') !== null;
}

// Fonction pour obtenir le token
function getToken() {
  return localStorage.getItem('token');
}

// Fonction pour obtenir les informations de l'utilisateur
function getUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

// Fonction pour enregistrer le token et l'utilisateur
function setAuth(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  updateNavbar();
}

// Fonction pour supprimer le token et l'utilisateur
function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  updateNavbar();
  window.location.href = 'login.html';
}

// Fonction pour mettre à jour la barre de navigation
function updateNavbar() {
  const isLoggedIn = isAuthenticated();
  const navLogin = document.getElementById('nav-login');
  const navLogout = document.getElementById('nav-logout');
  
  if (isLoggedIn) {
    navLogin.classList.add('d-none');
    navLogout.classList.remove('d-none');
  } else {
    navLogin.classList.remove('d-none');
    navLogout.classList.add('d-none');
  }
}

// Fonction pour effectuer une requête API avec authentification
async function fetchWithAuth(url, options = {}) {
  const token = getToken();
  
  if (!options.headers) {
    options.headers = {};
  }
  
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }
  
  options.headers['Content-Type'] = 'application/json';
  
  try {
    console.log(`Requête API: ${API_URL}${url}`, options);
    const response = await fetch(`${API_URL}${url}`, options);
    
    // Si la réponse est 401 (non autorisé), déconnecter l'utilisateur
    if (response.status === 401) {
      console.warn('Session expirée ou non authentifiée');
      clearAuth();
      return null;
    }
    
    // Vérifier si la réponse est OK (statut 2xx)
    if (!response.ok) {
      console.error(`Erreur API: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Détails de l\'erreur:', errorText);
      
      // Tenter de parser comme JSON, sinon retourner le texte
      try {
        return JSON.parse(errorText);
      } catch (e) {
        return { 
          success: false, 
          message: `Erreur serveur: ${response.status} ${response.statusText}` 
        };
      }
    }
    
    // Vérifier si la réponse est vide
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn('Réponse non-JSON reçue');
      return { success: true, message: 'Opération réussie', data: await response.text() };
    }
    
    // Parser la réponse JSON
    try {
      const data = await response.json();
      console.log(`Réponse API (${url}):`, data);
      return data;
    } catch (error) {
      console.error('Erreur lors du parsing JSON:', error);
      return { success: false, message: 'Format de réponse invalide' };
    }
  } catch (error) {
    console.error('Erreur de connexion au serveur:', error);
    showAlert('Erreur de connexion au serveur', 'danger');
    return { success: false, message: 'Erreur de connexion au serveur' };
  }
}

// Fonction de connexion
async function login(username, password) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      setAuth(data.token, data.user);
      return true;
    } else {
      showAlert(data.message || 'Identifiants invalides', 'danger');
      return false;
    }
  } catch (error) {
    console.error('Login Error:', error);
    showAlert('Erreur de connexion au serveur', 'danger');
    return false;
  }
}

// Fonction pour afficher une alerte
function showAlert(message, type = 'info') {
  // Create the alert element
  const alertElement = document.createElement('div');
  alertElement.className = `alert alert-${type} alert-dismissible fade show`;
  alertElement.role = 'alert';
  alertElement.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;

  // Find the container to insert the alert (try container-fluid first, then container)
  const container = document.querySelector('.container-fluid') || document.querySelector('.container');
  
  // If no container found, try to find the body as a fallback
  if (!container) {
    if (document.body) {
      // Create a container if one doesn't exist
      const newContainer = document.createElement('div');
      newContainer.className = 'container mt-3 alert-container';
      document.body.prepend(newContainer);
      newContainer.appendChild(alertElement);
    } else {
      // Just log to console if we can't find anywhere to show the alert
      console.warn('Alert not shown:', message, type);
    }
    return;
  }
  
  // Insert the alert at the beginning of the container
  if (container.firstChild) {
    container.insertBefore(alertElement, container.firstChild);
  } else {
    // If no first child, just append to container
    container.appendChild(alertElement);
  }

  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    if (alertElement.parentNode) {
      alertElement.classList.remove('show');
      setTimeout(() => alertElement.remove(), 300);
    }
  }, 5000);
}

// Gestionnaire d'événement pour le formulaire de connexion
document.addEventListener('DOMContentLoaded', function() {
  // Mettre à jour la barre de navigation au chargement
  updateNavbar();
  
  // Vérifier l'authentification et rediriger si nécessaire
  const isLoggedIn = isAuthenticated();
  const currentPage = window.location.hash.substring(1) || 'dashboard';
  
  if (isLoggedIn && currentPage === 'login') {
    window.location.hash = '#dashboard';
  } else if (!isLoggedIn && currentPage !== 'login') {
    window.location.hash = '#login';
  }
  
  // Gestionnaire pour le formulaire de connexion
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      
      const success = await login(username, password);
      
      if (success) {
        navigateTo('dashboard');
      }
    });
  }
  
  // Gestionnaire pour le bouton de déconnexion
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      clearAuth();
    });
  }
}); 