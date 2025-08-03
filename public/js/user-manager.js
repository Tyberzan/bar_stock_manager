// ========================================
// GESTIONNAIRE DES UTILISATEURS
// ========================================

let currentUsers = [];
let currentUserStats = {};

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
  if (window.location.hash === '#users') {
    loadUsersPage();
  }
});

// Charger la page des utilisateurs
async function loadUsersPage() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.role || user.role === 'user') {
      alert('Vous n\'avez pas les permissions pour accéder à cette page');
      window.location.hash = '#dashboard';
      return;
    }

    await Promise.all([loadUsers(), loadUserStats()]);
    displayUsersPage();
  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur lors du chargement des utilisateurs');
  }
}

// Charger les utilisateurs
async function loadUsers() {
  const response = await fetchWithAuth('/api/users');
  if (response && response.success) {
    currentUsers = response.data || [];
  } else {
    console.error('Erreur lors du chargement des utilisateurs:', response);
    currentUsers = [];
  }
}

// Charger les statistiques
async function loadUserStats() {
  try {
    const response = await fetchWithAuth('/api/users/stats');
    if (response && response.success) {
      currentUserStats = response.data || {};
    } else {
      currentUserStats = {};
    }
  } catch (error) {
    console.error('Erreur lors du chargement des stats:', error);
    currentUserStats = {};
  }
}

// Afficher la page
function displayUsersPage() {
  const content = document.getElementById('content');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Définir les rôles et permissions
  const roleLabels = {
    'superuser': '👑 Super Admin',
    'admin': '🔧 Administrateur', 
    'manager': '👔 Manager',
    'user': '👤 Utilisateur'
  };
  
  const roleDescriptions = {
    'superuser': 'Accès complet à tous les systèmes',
    'admin': 'Gestion complète de tous les utilisateurs et données', 
    'manager': 'Gestion des utilisateurs de son entreprise',
    'user': 'Accès aux fonctionnalités de base'
  };
  
  content.innerHTML = `
    <div class="container-fluid">
      <!-- En-tête avec info utilisateur connecté -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="alert alert-info">
            <h5><i class="bi bi-info-circle"></i> Gestion des Utilisateurs</h5>
            <p class="mb-0">
              <strong>Connecté en tant que:</strong> ${roleLabels[user.role] || user.role} 
              <span class="badge bg-primary ms-2">${user.username}</span>
            </p>
            <small class="text-muted">${roleDescriptions[user.role] || 'Rôle personnalisé'}</small>
          </div>
        </div>
      </div>

      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2><i class="bi bi-people"></i> Utilisateurs du Système</h2>
        <div>
          <button class="btn btn-success me-2" onclick="loadUsersPage()">
            <i class="bi bi-arrow-clockwise"></i> Actualiser
          </button>
          <button class="btn btn-primary" onclick="openUserModal()">
            <i class="bi bi-person-plus"></i> Nouvel Utilisateur
          </button>
        </div>
      </div>

      <div class="row mb-4">
        <div class="col-md-3">
          <div class="card bg-primary text-white">
            <div class="card-body text-center">
              <i class="bi bi-people-fill fs-1"></i>
              <h5>Total Utilisateurs</h5>
              <h3>${currentUserStats.total || 0}</h3>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-success text-white">
            <div class="card-body text-center">
              <i class="bi bi-person-check-fill fs-1"></i>
              <h5>Utilisateurs Actifs</h5>
              <h3>${currentUserStats.active || 0}</h3>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-warning text-white">
            <div class="card-body text-center">
              <i class="bi bi-shield-fill-check fs-1"></i>
              <h5>Administrateurs</h5>
              <h3>${currentUsers.filter(u => u.role === 'admin' || u.role === 'superuser').length}</h3>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-info text-white">
            <div class="card-body text-center">
              <i class="bi bi-briefcase-fill fs-1"></i>
              <h5>Managers</h5>
              <h3>${currentUsers.filter(u => u.role === 'manager').length}</h3>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h5 class="mb-0"><i class="bi bi-table"></i> Liste des Utilisateurs</h5>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-striped table-hover">
              <thead class="table-dark">
                <tr>
                  <th><i class="bi bi-person"></i> Utilisateur</th>
                  <th><i class="bi bi-envelope"></i> Email</th>
                  <th><i class="bi bi-shield"></i> Rôle</th>
                  <th><i class="bi bi-building"></i> Entreprise</th>
                  <th><i class="bi bi-calendar"></i> Dernière Connexion</th>
                  <th><i class="bi bi-check-circle"></i> Statut</th>
                  <th><i class="bi bi-gear"></i> Actions</th>
                </tr>
              </thead>
              <tbody>
                ${displayUsersTable()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Utilisateur -->
    <div class="modal fade" id="userModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title"><i class="bi bi-person-plus"></i> Nouvel Utilisateur</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="userForm">
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label"><i class="bi bi-person"></i> Nom d'utilisateur *</label>
                    <input type="text" class="form-control" id="username" required>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label"><i class="bi bi-envelope"></i> Email *</label>
                    <input type="email" class="form-control" id="email" required>
                  </div>
                </div>
              </div>
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label"><i class="bi bi-person-badge"></i> Prénom</label>
                    <input type="text" class="form-control" id="firstName">
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label"><i class="bi bi-person-badge"></i> Nom</label>
                    <input type="text" class="form-control" id="lastName">
                  </div>
                </div>
              </div>
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label"><i class="bi bi-shield"></i> Rôle *</label>
                    <select class="form-select" id="role" required>
                      <option value="">Sélectionnez un rôle</option>
                      ${user.role === 'superuser' ? '<option value="superuser">👑 Super Admin</option>' : ''}
                      ${user.role === 'superuser' || user.role === 'admin' ? '<option value="admin">🔧 Administrateur</option>' : ''}
                      <option value="manager">👔 Manager</option>
                      <option value="user">👤 Utilisateur</option>
                    </select>
                    <small class="form-text text-muted">Définit les permissions d'accès</small>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label"><i class="bi bi-lock"></i> Mot de passe *</label>
                    <input type="password" class="form-control" id="password" required>
                    <small class="form-text text-muted">Minimum 6 caractères</small>
                  </div>
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label"><i class="bi bi-telephone"></i> Téléphone</label>
                <input type="tel" class="form-control" id="phone">
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
              <i class="bi bi-x-circle"></i> Annuler
            </button>
            <button type="button" class="btn btn-primary" onclick="saveUser()">
              <i class="bi bi-check-circle"></i> Créer l'utilisateur
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Afficher le tableau des utilisateurs
function displayUsersTable() {
  if (!currentUsers.length) {
    return '<tr><td colspan="7" class="text-center text-muted"><i class="bi bi-info-circle"></i> Aucun utilisateur trouvé</td></tr>';
  }

  return currentUsers.map(user => {
    const roleLabels = {
      'superuser': '<span class="badge bg-danger"><i class="bi bi-crown"></i> Super Admin</span>',
      'admin': '<span class="badge bg-warning text-dark"><i class="bi bi-gear"></i> Administrateur</span>',
      'manager': '<span class="badge bg-info"><i class="bi bi-briefcase"></i> Manager</span>',
      'user': '<span class="badge bg-secondary"><i class="bi bi-person"></i> Utilisateur</span>'
    };

    const statusBadge = user.isActive 
      ? '<span class="badge bg-success"><i class="bi bi-check-circle"></i> Actif</span>'
      : '<span class="badge bg-danger"><i class="bi bi-x-circle"></i> Inactif</span>';
    
    const lastLogin = user.lastLogin 
      ? new Date(user.lastLogin).toLocaleDateString('fr-FR', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : '<span class="text-muted">Jamais</span>';

    return `
      <tr>
        <td>
          <div class="d-flex align-items-center">
            <div class="me-3">
              <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                <i class="bi bi-person"></i>
              </div>
            </div>
            <div>
              <strong class="d-block">${user.username}</strong>
              ${user.firstName || user.lastName ? `<small class="text-muted">${user.firstName || ''} ${user.lastName || ''}</small>` : ''}
            </div>
          </div>
        </td>
        <td>
          <i class="bi bi-envelope text-muted me-1"></i>
          <a href="mailto:${user.email}" class="text-decoration-none">${user.email}</a>
        </td>
        <td>${roleLabels[user.role] || user.role}</td>
        <td>
          ${user.Company ? `<i class="bi bi-building text-muted me-1"></i>${user.Company.name}` : '<span class="text-muted">-</span>'}
        </td>
        <td>
          <i class="bi bi-calendar text-muted me-1"></i>
          ${lastLogin}
        </td>
        <td>${statusBadge}</td>
        <td>
          <div class="btn-group" role="group">
            <button class="btn btn-sm btn-outline-primary" onclick="editUser(${user.id})" title="Modifier">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteUser(${user.id})" title="Désactiver">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Ouvrir le modal utilisateur
function openUserModal() {
  const modal = new bootstrap.Modal(document.getElementById('userModal'));
  document.getElementById('userForm').reset();
  modal.show();
}

// Sauvegarder utilisateur
async function saveUser() {
  const userData = {
    username: document.getElementById('username').value,
    email: document.getElementById('email').value,
    firstName: document.getElementById('firstName').value,
    lastName: document.getElementById('lastName').value,
    role: document.getElementById('role').value,
    password: document.getElementById('password').value
  };

  try {
    const response = await fetchWithAuth('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    if (response && response.success) {
      alert('Utilisateur créé avec succès');
      bootstrap.Modal.getInstance(document.getElementById('userModal')).hide();
      await loadUsersPage();
    } else {
      alert(response?.message || 'Erreur lors de la création');
    }
  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur lors de la sauvegarde');
  }
}

// Modifier utilisateur
function editUser(userId) {
  alert('Fonction d\'édition à implémenter');
}

// Supprimer utilisateur
async function deleteUser(userId) {
  if (!confirm('Êtes-vous sûr de vouloir désactiver cet utilisateur ?')) {
    return;
  }

  try {
    const response = await fetchWithAuth(`/api/users/${userId}`, {
      method: 'DELETE'
    });

    if (response && response.success) {
      alert('Utilisateur désactivé avec succès');
      await loadUsersPage();
    } else {
      alert(response?.message || 'Erreur lors de la suppression');
    }
  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur lors de la suppression');
  }
}

// Export des fonctions
window.loadUsersPage = loadUsersPage;
window.openUserModal = openUserModal;
window.saveUser = saveUser;
window.editUser = editUser;
window.deleteUser = deleteUser; 