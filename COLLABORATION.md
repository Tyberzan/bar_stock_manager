# 🤝 Guide de Collaboration - Bar Stock Manager

## 🚀 Setup Initial pour Nouveau Développeur

### 1. **Cloner le Repository**
```bash
git clone https://github.com/Tyberzan/bar_stock_manager.git
cd bar_stock_manager
```

### 2. **Installer les Dépendances**
```bash
npm install
```

### 3. **Importer la Base de Données**
```bash
# Importer les données partagées
node scripts/export-database.js import exports/database-export-2025-08-03.json
```

### 4. **Créer le fichier .env**
```bash
# Copier depuis .env.example ou créer :
# Contenu minimum requis dans .env :
DB_PATH=./database.sqlite
JWT_SECRET=your_jwt_secret_here
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
GOOGLE_SHEETS_ENABLED=false
REPORTS_ENABLED=false
```

### 5. **Démarrer l'Application**
```bash
npm run dev
# Ouvrir http://localhost:3000
# Login: admin / admin123
```

---

## 🔄 Workflow de Collaboration

### **Avant de Commencer à Travailler**
```bash
# 1. Récupérer les dernières modifications
git pull origin main

# 2. Créer une branche pour votre fonctionnalité
git checkout -b feature/votre-fonctionnalite

# 3. Si base de données modifiée, importer la dernière version
node scripts/export-database.js import exports/database-export-YYYY-MM-DD.json
```

### **Pendant le Développement**
```bash
# Démarrer en mode développement
npm run dev

# Le serveur redémarre automatiquement à chaque modification
# Socket.IO synchronise les changements en temps réel
```

### **Partager vos Modifications**
```bash
# 1. Exporter votre base de données modifiée
node scripts/export-database.js export

# 2. Ajouter tous les fichiers
git add .

# 3. Commit avec message descriptif
git commit -m "✨ Nouvelle fonctionnalité: Description"

# 4. Pousser votre branche
git push origin feature/votre-fonctionnalite

# 5. Créer une Pull Request sur GitHub
```

---

## 📊 Structure des Données Exportées

L'export contient :
- **5 entreprises** avec leurs configurations
- **6 bars** répartis dans les entreprises  
- **11 produits** du catalogue
- **Utilisateurs** (mots de passe réinitialisés)
- **Historique des stocks** (100 dernières entrées)
- **Réserves et transferts**

---

## 🔧 Scripts Utiles

### **Base de Données**
```bash
# Exporter la base actuelle
node scripts/export-database.js export

# Importer une base partagée
node scripts/export-database.js import exports/fichier.json

# Réinitialiser complètement
npm run init-db
```

### **Développement**
```bash
# Mode développement (auto-reload)
npm run dev

# Mode production
npm start

# Tests
npm run test
```

### **Maintenance**
```bash
# Créer un super-utilisateur
node scripts/create-superuser.js

# Vérifier l'état de la DB
node scripts/check-db-status.js

# Nettoyer et redémarrer
node scripts/simple-reset.js
```

---

## 🌐 Cursor Live Share

### **Hôte (Celui qui partage)**
1. `Ctrl+Shift+P` → "Cursor: Start Live Share"
2. Partager le lien généré
3. Les modifications sont synchronisées en temps réel

### **Invité (Celui qui rejoint)**
1. Cliquer sur le lien Live Share
2. Cursor s'ouvre automatiquement
3. Développement collaboratif instantané

### **Avantages Live Share + Git**
- ✅ Édition simultanée du code
- ✅ Partage de terminal
- ✅ Debug collaboratif  
- ✅ Chat intégré
- ✅ Synchronisation avant commit Git

---

## 🗃️ Gestion des Conflits

### **Base de Données**
Si conflit sur la base de données :
1. L'un des deux exporte : `node scripts/export-database.js export`
2. Commit et push l'export
3. L'autre importe : `node scripts/export-database.js import exports/latest.json`

### **Code**
Git standard avec l'aide de Cursor AI pour résoudre les conflits.

---

## 📞 Support

### **Problèmes Fréquents**

**Serveur ne démarre pas :**
```bash
taskkill /f /im node.exe
npm run dev
```

**Base corrompue :**
```bash
node scripts/export-database.js import exports/database-export-YYYY-MM-DD.json
```

**Dépendances manquantes :**
```bash
rm -rf node_modules package-lock.json
npm install
```

### **Contacts**
- **Repository** : [https://github.com/Tyberzan/bar_stock_manager](https://github.com/Tyberzan/bar_stock_manager)
- **Issues** : Créer une issue GitHub pour les problèmes
- **Live Share** : Utiliser Cursor pour assistance en temps réel

---

## ✅ Checklist Nouveau Développeur

- [ ] Repository cloné
- [ ] `npm install` exécuté
- [ ] Fichier `.env` créé
- [ ] Base de données importée  
- [ ] `npm run dev` fonctionne
- [ ] Accès à http://localhost:3000
- [ ] Login réussi
- [ ] Cursor configuré pour Live Share
- [ ] Première branche créée

**🎉 Prêt pour la collaboration !**