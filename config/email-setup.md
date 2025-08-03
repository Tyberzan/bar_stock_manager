# 📧 Configuration du Système d'Email - Bar Stock Manager

## 🚀 Installation des Dépendances

```bash
npm install nodemailer exceljs googleapis moment cron multer
```

## ⚙️ Configuration SMTP

### 1. Variables d'Environnement

Créez un fichier `.env` à la racine du projet :

```env
# Configuration SMTP Gmail
GMAIL_USER=votre-email@gmail.com
GMAIL_APP_PASSWORD=votre-mot-de-passe-app

# Configuration SMTP générique
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe-app

# Configuration Outlook
OUTLOOK_USER=votre-email@outlook.com
OUTLOOK_PASS=votre-mot-de-passe
```

### 2. Configuration Gmail

1. **Activer l'authentification à 2 facteurs** sur votre compte Gmail
2. **Générer un mot de passe d'application** :
   - Allez dans Paramètres Google → Sécurité
   - Authentification à 2 facteurs → Mots de passe des applications
   - Sélectionnez "Autre" et nommez-le "Bar Stock Manager"
   - Utilisez ce mot de passe dans `GMAIL_APP_PASSWORD`

### 3. Configuration Outlook/Hotmail

```env
OUTLOOK_USER=votre-email@outlook.com
OUTLOOK_PASS=votre-mot-de-passe-normal
```

## 📊 Configuration Google Sheets (Optionnel)

### 1. Créer un Projet Google Cloud

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un existant
3. Activez les APIs :
   - Google Sheets API
   - Google Drive API

### 2. Créer un Compte de Service

1. Allez dans IAM & Admin → Comptes de service
2. Créez un nouveau compte de service
3. Téléchargez le fichier JSON des credentials
4. Renommez-le `google-credentials.json`
5. Placez-le dans `src/config/google-credentials.json`

### 3. Partager vos Google Sheets

Pour que le système puisse créer des feuilles, partagez un dossier Google Drive avec l'email du compte de service.

## 🧪 Tests de Configuration

### 1. Test Basique

```bash
node scripts/protocol-test-email-system.js
```

### 2. Test Email Manuel

```javascript
const EmailService = require('./src/services/emailService');

const emailService = new EmailService('gmail');
emailService.sendTestEmail('destinataire@example.com');
```

### 3. Test Export Excel

```bash
curl -X GET "http://localhost:3000/api/email/export/excel/1/stocks" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📋 Endpoints API Disponibles

### Alertes Email
- `POST /api/email/alert` - Envoyer alerte de stock
- `POST /api/email/weekly-report` - Envoyer rapport hebdomadaire
- `POST /api/email/test` - Envoyer email de test

### Exports
- `GET /api/email/export/excel/:barId/:type` - Export Excel
- `GET /api/email/export/google-sheets/:barId/:type` - Export Google Sheets

### Configuration
- `GET /api/email/config/verify` - Vérifier configuration
- `POST /api/email/config/auto-alerts` - Configurer alertes auto

## 🔧 Exemples d'Utilisation

### Envoyer une Alerte de Stock

```javascript
fetch('/api/email/alert', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    barId: 1,
    to: ['manager@bar.com', 'owner@bar.com'],
    threshold: 'low' // 'low', 'critical', 'all'
  })
});
```

### Exporter vers Excel

```javascript
fetch('/api/email/export/excel/1/stocks', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
})
.then(response => response.json())
.then(data => {
  // data.downloadUrl contient le lien de téléchargement
  window.open(data.downloadUrl);
});
```

### Rapport Hebdomadaire avec Exports

```javascript
fetch('/api/email/weekly-report', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    barId: 1,
    to: ['manager@bar.com'],
    includeExcel: true,
    includeGoogleSheets: true
  })
});
```

## 🔄 Alertes Automatiques

### Configuration Cron

```javascript
// Alerte quotidienne à 9h
{
  barId: 1,
  schedule: '0 9 * * *',
  threshold: 'low',
  recipients: ['manager@bar.com'],
  enabled: true
}

// Rapport hebdomadaire le lundi à 8h
{
  barId: 1,
  schedule: '0 8 * * 1',
  recipients: ['owner@bar.com'],
  enabled: true
}
```

## 🛠️ Dépannage

### Erreur SMTP

```
❌ Error: getaddrinfo ENOTFOUND smtp.gmail.com
```
**Solution** : Vérifiez votre connexion internet et les paramètres SMTP.

### Erreur Authentification Gmail

```
❌ Error: Invalid login: 535-5.7.8 Username and Password not accepted
```
**Solution** : Utilisez un mot de passe d'application, pas votre mot de passe normal.

### Google Sheets Non Disponible

```
⚠️ Fichier Google credentials non trouvé
```
**Solution** : Placez `google-credentials.json` dans `src/config/`.

### Exports Volumineux

Les exports sont automatiquement nettoyés après 7 jours. Pour changer :

```javascript
// Nettoyer après 3 jours
excelService.cleanOldExports(3);
```

## 📈 Monitoring

### Logs à Surveiller

- `✅ Email d'alerte envoyé: messageId`
- `✅ Rapport hebdomadaire envoyé: messageId`
- `📁 Fichier créé: filename.xlsx`
- `🔗 Feuille créée: spreadsheetUrl`

### Métriques Importantes

- Taux de succès des envois d'emails
- Temps de génération des exports
- Taille des fichiers générés
- Utilisation de l'espace disque (/exports)

## 🚀 Mise en Production

1. **Variables d'environnement** : Configurez toutes les variables
2. **HTTPS** : Utilisez HTTPS pour les liens dans les emails
3. **Monitoring** : Surveillez les logs d'erreurs
4. **Sauvegarde** : Sauvegardez le dossier /exports si nécessaire
5. **Sécurité** : Limitez l'accès aux credentials Google

## 📞 Support

En cas de problème :
1. Vérifiez les logs du serveur
2. Testez la configuration avec le script de test
3. Vérifiez les credentials et permissions
4. Consultez la documentation des fournisseurs (Gmail, Google Cloud) 