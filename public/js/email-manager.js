// Email Manager - Interface pour le système d'email et d'export

class EmailManager {
  constructor() {
    this.currentBarId = null;
    this.emailConfig = null;
    this.init();
  }

  init() {
    this.loadEmailConfig();
    this.bindEvents();
    this.loadEmailInterface();
  }

  // Charger la configuration email
  async loadEmailConfig() {
    try {
      const response = await fetchWithAuth('/api/email/config/verify');
      if (response.ok) {
        this.emailConfig = await response.json();
        this.updateConfigStatus();
      }
    } catch (error) {
      console.error('Erreur chargement config email:', error);
    }
  }

  // Mettre à jour le statut de configuration
  updateConfigStatus() {
    const statusElement = document.getElementById('email-config-status');
    if (!statusElement) return;

    if (this.emailConfig?.success) {
      statusElement.innerHTML = `
        <div class="alert alert-success">
          <i class="fas fa-check-circle"></i>
          <strong>Email configuré</strong> - Prêt à envoyer
          ${this.emailConfig.googleSheets ? '<br><i class="fas fa-check"></i> Google Sheets disponible' : '<br><i class="fas fa-times"></i> Google Sheets non configuré'}
        </div>
      `;
    } else {
      statusElement.innerHTML = `
        <div class="alert alert-warning">
          <i class="fas fa-exclamation-triangle"></i>
          <strong>Email non configuré</strong> - Configurez SMTP dans les variables d'environnement
        </div>
      `;
    }
  }

  // Charger l'interface email
  loadEmailInterface() {
    const emailSection = document.getElementById('email-section');
    if (!emailSection) return;

    emailSection.innerHTML = `
      <div class="row">
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h5><i class="fas fa-bell"></i> Alertes de Stock</h5>
            </div>
            <div class="card-body">
              <form id="alert-form">
                <div class="mb-3">
                  <label class="form-label">Bar</label>
                  <select class="form-select" id="alert-bar-select" required>
                    <option value="">Sélectionner un bar...</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label">Destinataires (emails séparés par des virgules)</label>
                  <textarea class="form-control" id="alert-recipients" rows="3" 
                    placeholder="manager@bar.com, owner@bar.com" required></textarea>
                </div>
                <div class="mb-3">
                  <label class="form-label">Type d'alerte</label>
                  <select class="form-select" id="alert-threshold">
                    <option value="low">Stock faible</option>
                    <option value="critical">Ruptures uniquement</option>
                    <option value="all">Tous les problèmes</option>
                  </select>
                </div>
                <button type="submit" class="btn btn-warning">
                  <i class="fas fa-paper-plane"></i> Envoyer Alerte
                </button>
              </form>
            </div>
          </div>
        </div>

        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h5><i class="fas fa-chart-line"></i> Rapports</h5>
            </div>
            <div class="card-body">
              <form id="report-form">
                <div class="mb-3">
                  <label class="form-label">Bar</label>
                  <select class="form-select" id="report-bar-select" required>
                    <option value="">Sélectionner un bar...</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label">Destinataires</label>
                  <textarea class="form-control" id="report-recipients" rows="3" 
                    placeholder="manager@bar.com, owner@bar.com" required></textarea>
                </div>
                <div class="mb-3">
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="include-excel" checked>
                    <label class="form-check-label">Inclure fichier Excel</label>
                  </div>
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="include-sheets">
                    <label class="form-check-label">Inclure Google Sheets</label>
                  </div>
                </div>
                <button type="submit" class="btn btn-primary">
                  <i class="fas fa-file-alt"></i> Envoyer Rapport
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div class="row mt-4">
        <div class="col-md-4">
          <div class="card">
            <div class="card-header">
              <h5><i class="fas fa-download"></i> Exports Excel</h5>
            </div>
            <div class="card-body">
              <div class="mb-3">
                <label class="form-label">Bar</label>
                <select class="form-select" id="excel-bar-select">
                  <option value="">Sélectionner un bar...</option>
                </select>
              </div>
              <div class="d-grid gap-2">
                <button class="btn btn-success" onclick="emailManager.exportExcel('stocks')">
                  <i class="fas fa-table"></i> Export Stocks
                </button>
                <button class="btn btn-info" onclick="emailManager.exportExcel('weekly')">
                  <i class="fas fa-calendar-week"></i> Rapport Hebdomadaire
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-4">
          <div class="card">
            <div class="card-header">
              <h5><i class="fas fa-cloud"></i> Google Sheets</h5>
            </div>
            <div class="card-body">
              <div class="mb-3">
                <label class="form-label">Bar</label>
                <select class="form-select" id="sheets-bar-select">
                  <option value="">Sélectionner un bar...</option>
                </select>
              </div>
              <div class="d-grid gap-2">
                <button class="btn btn-success" onclick="emailManager.exportGoogleSheets('stocks')" 
                  ${!this.emailConfig?.googleSheets ? 'disabled' : ''}>
                  <i class="fab fa-google"></i> Export Stocks
                </button>
                <button class="btn btn-info" onclick="emailManager.exportGoogleSheets('weekly')"
                  ${!this.emailConfig?.googleSheets ? 'disabled' : ''}>
                  <i class="fab fa-google"></i> Rapport Hebdomadaire
                </button>
              </div>
              ${!this.emailConfig?.googleSheets ? '<small class="text-muted">Google Sheets non configuré</small>' : ''}
            </div>
          </div>
        </div>

        <div class="col-md-4">
          <div class="card">
            <div class="card-header">
              <h5><i class="fas fa-cog"></i> Configuration</h5>
            </div>
            <div class="card-body">
              <div id="email-config-status"></div>
              <div class="d-grid gap-2">
                <button class="btn btn-secondary" onclick="emailManager.sendTestEmail()">
                  <i class="fas fa-vial"></i> Test Email
                </button>
                <button class="btn btn-outline-secondary" onclick="emailManager.loadEmailConfig()">
                  <i class="fas fa-sync"></i> Recharger Config
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Test Email -->
      <div class="modal fade" id="testEmailModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Test Email</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Email de test</label>
                <input type="email" class="form-control" id="test-email" 
                  placeholder="votre-email@example.com" required>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
              <button type="button" class="btn btn-primary" onclick="emailManager.executeTestEmail()">
                Envoyer Test
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.loadBarsIntoSelectors();
    this.updateConfigStatus();
  }

  // Charger les bars dans les sélecteurs
  async loadBarsIntoSelectors() {
    try {
      const response = await fetchWithAuth('/api/bars');
      if (response.ok) {
        const bars = await response.json();
        
        const selectors = [
          'alert-bar-select',
          'report-bar-select', 
          'excel-bar-select',
          'sheets-bar-select'
        ];

        selectors.forEach(selectorId => {
          const select = document.getElementById(selectorId);
          if (select) {
            select.innerHTML = '<option value="">Sélectionner un bar...</option>';
            bars.forEach(bar => {
              select.innerHTML += `<option value="${bar.id}">${bar.name}</option>`;
            });
          }
        });
      }
    } catch (error) {
      console.error('Erreur chargement bars:', error);
    }
  }

  // Lier les événements
  bindEvents() {
    // Formulaire d'alerte
    document.addEventListener('submit', async (e) => {
      if (e.target.id === 'alert-form') {
        e.preventDefault();
        await this.sendStockAlert();
      } else if (e.target.id === 'report-form') {
        e.preventDefault();
        await this.sendWeeklyReport();
      }
    });
  }

  // Envoyer une alerte de stock
  async sendStockAlert() {
    try {
      const barId = document.getElementById('alert-bar-select').value;
      const recipients = document.getElementById('alert-recipients').value;
      const threshold = document.getElementById('alert-threshold').value;

      if (!barId || !recipients.trim()) {
        showAlert('Veuillez remplir tous les champs', 'warning');
        return;
      }

      const recipientList = recipients.split(',').map(email => email.trim());

      const response = await fetchWithAuth('/api/email/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barId: parseInt(barId),
          to: recipientList,
          threshold
        })
      });

      const result = await response.json();

      if (response.ok) {
        showAlert(`Alerte envoyée avec succès ! ${result.count} produits alertés.`, 'success');
        document.getElementById('alert-form').reset();
      } else {
        showAlert(`Erreur: ${result.message}`, 'danger');
      }

    } catch (error) {
      console.error('Erreur envoi alerte:', error);
      showAlert('Erreur lors de l\'envoi de l\'alerte', 'danger');
    }
  }

  // Envoyer un rapport hebdomadaire
  async sendWeeklyReport() {
    try {
      const barId = document.getElementById('report-bar-select').value;
      const recipients = document.getElementById('report-recipients').value;
      const includeExcel = document.getElementById('include-excel').checked;
      const includeSheets = document.getElementById('include-sheets').checked;

      if (!barId || !recipients.trim()) {
        showAlert('Veuillez remplir tous les champs', 'warning');
        return;
      }

      const recipientList = recipients.split(',').map(email => email.trim());

      const response = await fetchWithAuth('/api/email/weekly-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barId: parseInt(barId),
          to: recipientList,
          includeExcel,
          includeGoogleSheets: includeSheets
        })
      });

      const result = await response.json();

      if (response.ok) {
        let message = 'Rapport hebdomadaire envoyé avec succès !';
        if (result.exports?.excel) message += '<br>📊 Excel inclus';
        if (result.exports?.googleSheets) message += '<br>📋 Google Sheets inclus';
        
        showAlert(message, 'success');
        document.getElementById('report-form').reset();
      } else {
        showAlert(`Erreur: ${result.message}`, 'danger');
      }

    } catch (error) {
      console.error('Erreur envoi rapport:', error);
      showAlert('Erreur lors de l\'envoi du rapport', 'danger');
    }
  }

  // Exporter vers Excel
  async exportExcel(type) {
    try {
      const barId = document.getElementById('excel-bar-select').value;
      
      if (!barId) {
        showAlert('Veuillez sélectionner un bar', 'warning');
        return;
      }

      const response = await fetchWithAuth(`/api/email/export/excel/${barId}/${type}`);
      const result = await response.json();

      if (response.ok) {
        // Télécharger le fichier
        const link = document.createElement('a');
        link.href = result.downloadUrl;
        link.download = result.filename;
        link.click();

        showAlert(`Export Excel créé: ${result.filename}`, 'success');
      } else {
        showAlert(`Erreur: ${result.message}`, 'danger');
      }

    } catch (error) {
      console.error('Erreur export Excel:', error);
      showAlert('Erreur lors de l\'export Excel', 'danger');
    }
  }

  // Exporter vers Google Sheets
  async exportGoogleSheets(type) {
    try {
      const barId = document.getElementById('sheets-bar-select').value;
      
      if (!barId) {
        showAlert('Veuillez sélectionner un bar', 'warning');
        return;
      }

      const response = await fetchWithAuth(`/api/email/export/google-sheets/${barId}/${type}`);
      const result = await response.json();

      if (response.ok) {
        // Ouvrir la feuille Google
        window.open(result.spreadsheetUrl, '_blank');
        
        showAlert('Export Google Sheets créé avec succès !', 'success');
      } else {
        showAlert(`Erreur: ${result.message}`, 'danger');
      }

    } catch (error) {
      console.error('Erreur export Google Sheets:', error);
      showAlert('Erreur lors de l\'export Google Sheets', 'danger');
    }
  }

  // Afficher le modal de test email
  sendTestEmail() {
    const modal = new bootstrap.Modal(document.getElementById('testEmailModal'));
    modal.show();
  }

  // Exécuter le test email
  async executeTestEmail() {
    try {
      const email = document.getElementById('test-email').value;
      
      if (!email) {
        showAlert('Veuillez saisir un email', 'warning');
        return;
      }

      const response = await fetchWithAuth('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: email })
      });

      const result = await response.json();

      if (response.ok) {
        showAlert('Email de test envoyé avec succès !', 'success');
        bootstrap.Modal.getInstance(document.getElementById('testEmailModal')).hide();
      } else {
        showAlert(`Erreur: ${result.message}`, 'danger');
      }

    } catch (error) {
      console.error('Erreur test email:', error);
      showAlert('Erreur lors de l\'envoi du test', 'danger');
    }
  }
}

// Initialiser le gestionnaire d'email
let emailManager;

// Fonction pour afficher les alertes
function showAlert(message, type) {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  
  const container = document.querySelector('.container-fluid') || document.body;
  container.insertBefore(alertDiv, container.firstChild);
  
  // Auto-dismiss après 5 secondes
  setTimeout(() => {
    if (alertDiv.parentNode) {
      alertDiv.remove();
    }
  }, 5000);
}

// Initialiser quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
  emailManager = new EmailManager();
}); 