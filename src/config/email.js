const nodemailer = require('nodemailer');

// Configuration SMTP
const emailConfig = {
  // Configuration Gmail (exemple)
  gmail: {
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER || 'votre-email@gmail.com',
      pass: process.env.GMAIL_APP_PASSWORD || 'votre-mot-de-passe-app'
    }
  },
  
  // Configuration SMTP générique
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true pour 465, false pour autres ports
    auth: {
      user: process.env.SMTP_USER || 'votre-email@example.com',
      pass: process.env.SMTP_PASS || 'votre-mot-de-passe'
    }
  },
  
  // Configuration Outlook/Hotmail
  outlook: {
    service: 'hotmail',
    auth: {
      user: process.env.OUTLOOK_USER || 'votre-email@outlook.com',
      pass: process.env.OUTLOOK_PASS || 'votre-mot-de-passe'
    }
  }
};

// Créer le transporteur selon la configuration
const createTransporter = (provider = 'gmail') => {
  try {
    const config = emailConfig[provider];
    if (!config) {
      throw new Error(`Configuration email non trouvée pour: ${provider}`);
    }
    
    const transporter = nodemailer.createTransport(config);
    
    // Vérifier la configuration
    transporter.verify((error, success) => {
      if (error) {
        console.error(`Erreur configuration email ${provider}:`, error);
      } else {
        console.log(`✅ Configuration email ${provider} validée`);
      }
    });
    
    return transporter;
  } catch (error) {
    console.error('Erreur création transporteur email:', error);
    throw error;
  }
};

// Templates d'emails
const emailTemplates = {
  stockAlert: {
    subject: '🚨 Alerte Stock - {{barName}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
          <h1>🍺 Bar Stock Manager</h1>
          <h2>🚨 Alerte de Stock</h2>
        </div>
        
        <div style="padding: 20px; background: #f8f9fa;">
          <h3>📍 Bar: {{barName}}</h3>
          <p><strong>📅 Date:</strong> {{date}}</p>
          <p><strong>⏰ Heure:</strong> {{time}}</p>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h4 style="color: #dc3545;">⚠️ Produits à recharger:</h4>
            {{productsList}}
          </div>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="{{dashboardUrl}}" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              📊 Voir le Dashboard
            </a>
          </div>
        </div>
        
        <div style="background: #343a40; color: white; padding: 15px; text-align: center; font-size: 12px;">
          <p>📧 Email automatique envoyé par Bar Stock Manager</p>
          <p>🏢 {{companyName}} - {{timestamp}}</p>
        </div>
      </div>
    `,
    text: `
🍺 BAR STOCK MANAGER - ALERTE STOCK

📍 Bar: {{barName}}
📅 Date: {{date}} - {{time}}

⚠️ PRODUITS À RECHARGER:
{{productsListText}}

📊 Dashboard: {{dashboardUrl}}

---
📧 Email automatique - {{companyName}}
{{timestamp}}
    `
  },
  
  weeklyReport: {
    subject: '📊 Rapport Hebdomadaire - {{barName}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; text-align: center;">
          <h1>🍺 Bar Stock Manager</h1>
          <h2>📊 Rapport Hebdomadaire</h2>
        </div>
        
        <div style="padding: 20px; background: #f8f9fa;">
          <h3>📍 Bar: {{barName}}</h3>
          <p><strong>📅 Période:</strong> {{startDate}} - {{endDate}}</p>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0;">
            <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
              <h4 style="color: #28a745; margin: 0;">{{totalProducts}}</h4>
              <p style="margin: 5px 0;">📦 Produits</p>
            </div>
            <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
              <h4 style="color: #ffc107; margin: 0;">{{lowStockCount}}</h4>
              <p style="margin: 5px 0;">⚠️ Stock Faible</p>
            </div>
            <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
              <h4 style="color: #dc3545; margin: 0;">{{outOfStockCount}}</h4>
              <p style="margin: 5px 0;">🚫 Ruptures</p>
            </div>
          </div>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h4>📈 Mouvements de Stock:</h4>
            {{movementsList}}
          </div>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="{{excelUrl}}" style="background: #198754; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 5px;">
              📊 Télécharger Excel
            </a>
            <a href="{{googleSheetsUrl}}" style="background: #0f5132; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 5px;">
              📋 Google Sheets
            </a>
          </div>
        </div>
        
        <div style="background: #343a40; color: white; padding: 15px; text-align: center; font-size: 12px;">
          <p>📧 Rapport automatique envoyé par Bar Stock Manager</p>
          <p>🏢 {{companyName}} - {{timestamp}}</p>
        </div>
      </div>
    `
  }
};

module.exports = {
  createTransporter,
  emailTemplates,
  emailConfig
}; 