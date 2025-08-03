const { createTransporter, emailTemplates } = require('../config/email');
const moment = require('moment');

class EmailService {
  constructor(provider = 'gmail') {
    this.provider = provider;
    this.transporter = null;
    this.isConfigured = false;
    this.initializeTransporter();
  }

  async initializeTransporter() {
    try {
      this.transporter = createTransporter(this.provider);
      this.isConfigured = true;
      console.log(`✅ Service email initialisé avec ${this.provider}`);
    } catch (error) {
      console.warn(`⚠️ Service email non configuré (${this.provider}):`, error.message);
      this.isConfigured = false;
    }
  }

  // Vérifier si le service est disponible
  checkAvailability() {
    if (!this.isConfigured || !this.transporter) {
      throw new Error('Service email non configuré. Vérifiez vos paramètres SMTP.');
    }
  }

  // Remplacer les variables dans les templates
  replaceTemplateVariables(template, variables) {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value || '');
    }
    return result;
  }

  // Générer la liste des produits pour les emails
  generateProductsList(products, format = 'html') {
    if (!products || products.length === 0) {
      return format === 'html' ? '<p>Aucun produit à recharger</p>' : 'Aucun produit à recharger';
    }

    if (format === 'html') {
      return products.map(product => `
        <div style="padding: 8px; border-left: 3px solid #dc3545; margin: 5px 0; background: #fff3cd;">
          <strong>${product.name}</strong> (${product.format})<br>
          <small>Stock actuel: ${product.currentQuantity} | Recommandé: ${product.idealQuantity}</small>
        </div>
      `).join('');
    } else {
      return products.map(product => 
        `• ${product.name} (${product.format}) - Stock: ${product.currentQuantity}/${product.idealQuantity}`
      ).join('\n');
    }
  }

  // Envoyer une alerte de stock
  async sendStockAlert(options) {
    try {
      this.checkAvailability();
      
      const {
        to,
        barName,
        companyName,
        products,
        dashboardUrl = 'http://localhost:3000'
      } = options;

      const variables = {
        barName,
        companyName,
        date: moment().format('DD/MM/YYYY'),
        time: moment().format('HH:mm'),
        productsList: this.generateProductsList(products, 'html'),
        productsListText: this.generateProductsList(products, 'text'),
        dashboardUrl,
        timestamp: moment().format('DD/MM/YYYY HH:mm:ss')
      };

      const template = emailTemplates.stockAlert;
      const subject = this.replaceTemplateVariables(template.subject, variables);
      const html = this.replaceTemplateVariables(template.html, variables);
      const text = this.replaceTemplateVariables(template.text, variables);

      const mailOptions = {
        from: `"Bar Stock Manager" <${process.env.SMTP_USER || 'noreply@barstockmanager.com'}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        text,
        html
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email d\'alerte envoyé:', result.messageId);
      return { success: true, messageId: result.messageId };

    } catch (error) {
      console.error('❌ Erreur envoi email alerte:', error);
      throw error;
    }
  }

  // Envoyer un rapport hebdomadaire
  async sendWeeklyReport(options) {
    try {
      this.checkAvailability();
      
      const {
        to,
        barName,
        companyName,
        startDate,
        endDate,
        stats,
        movements,
        excelUrl,
        googleSheetsUrl
      } = options;

      const variables = {
        barName,
        companyName,
        startDate: moment(startDate).format('DD/MM/YYYY'),
        endDate: moment(endDate).format('DD/MM/YYYY'),
        totalProducts: stats.totalProducts || 0,
        lowStockCount: stats.lowStockCount || 0,
        outOfStockCount: stats.outOfStockCount || 0,
        movementsList: this.generateMovementsList(movements),
        excelUrl: excelUrl || '#',
        googleSheetsUrl: googleSheetsUrl || '#',
        timestamp: moment().format('DD/MM/YYYY HH:mm:ss')
      };

      const template = emailTemplates.weeklyReport;
      const subject = this.replaceTemplateVariables(template.subject, variables);
      const html = this.replaceTemplateVariables(template.html, variables);

      const mailOptions = {
        from: `"Bar Stock Manager" <${process.env.SMTP_USER || 'noreply@barstockmanager.com'}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Rapport hebdomadaire envoyé:', result.messageId);
      return { success: true, messageId: result.messageId };

    } catch (error) {
      console.error('❌ Erreur envoi rapport hebdomadaire:', error);
      throw error;
    }
  }

  // Générer la liste des mouvements
  generateMovementsList(movements) {
    if (!movements || movements.length === 0) {
      return '<p>Aucun mouvement cette semaine</p>';
    }

    return movements.map(movement => `
      <div style="padding: 8px; border-bottom: 1px solid #dee2e6;">
        <strong>${movement.productName}</strong> - ${movement.type}<br>
        <small>Quantité: ${movement.quantity} | ${moment(movement.date).format('DD/MM HH:mm')}</small>
      </div>
    `).join('');
  }

  // Envoyer un email de test
  async sendTestEmail(to) {
    try {
      this.checkAvailability();
      
      const mailOptions = {
        from: `"Bar Stock Manager" <${process.env.SMTP_USER || 'noreply@barstockmanager.com'}>`,
        to,
        subject: '🧪 Test Email - Bar Stock Manager',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>🧪 Email de Test</h2>
            <p>✅ La configuration email fonctionne correctement !</p>
            <p><strong>Heure d'envoi:</strong> ${moment().format('DD/MM/YYYY HH:mm:ss')}</p>
            <p><strong>Fournisseur:</strong> ${this.provider}</p>
            <hr>
            <p><small>📧 Envoyé depuis Bar Stock Manager</small></p>
          </div>
        `,
        text: `
🧪 EMAIL DE TEST - Bar Stock Manager

✅ La configuration email fonctionne correctement !

Heure d'envoi: ${moment().format('DD/MM/YYYY HH:mm:ss')}
Fournisseur: ${this.provider}

---
📧 Envoyé depuis Bar Stock Manager
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email de test envoyé:', result.messageId);
      return { success: true, messageId: result.messageId };

    } catch (error) {
      console.error('❌ Erreur envoi email de test:', error);
      throw error;
    }
  }

  // Vérifier la configuration email
  async verifyConfiguration() {
    try {
      this.checkAvailability();
      
      await this.transporter.verify();
      console.log('✅ Configuration email vérifiée');
      return { success: true, message: 'Configuration email valide' };
    } catch (error) {
      console.error('❌ Erreur vérification email:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = EmailService; 