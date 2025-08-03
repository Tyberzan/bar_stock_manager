# 🍺 Bar Stock Manager

<div align="center">

![Bar Stock Manager](https://img.shields.io/badge/Bar%20Stock-Manager-blue?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTUgMTJIMTlNNSAxMkM1IDEwLjg5NTQgNS44OTU0MyAxMCA3IDEwSDEyQzEzLjEwNDYgMTAgMTQgMTAuODk1NCAxNCAxMlYxOEMxNCAxOS4xMDQ2IDEzLjEwNDYgMjAgMTIgMjBIN0M1Ljg5NTQzIDIwIDUgMTkuMTA0NiA1IDE4VjEyWiIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=)

**Système de gestion de stocks professionnel pour bars et restaurants**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18+-blue?style=flat-square&logo=express)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3+-lightblue?style=flat-square&logo=sqlite)](https://sqlite.org/)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3+-purple?style=flat-square&logo=bootstrap)](https://getbootstrap.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4+-orange?style=flat-square&logo=socket.io)](https://socket.io/)

[🚀 Démo](#-installation) • [📦 Installation](#-installation) • [🎯 Fonctionnalités](#-fonctionnalités) • [👥 Utilisateurs](#-système-de-gestion-des-utilisateurs) • [📖 Documentation](#-api-documentation)

</div>

---

## 🌟 Vue d'ensemble

Bar Stock Manager est une solution complète de gestion de stocks conçue spécialement pour les bars, restaurants et établissements de restauration. Avec son architecture multi-entreprises et son système de permissions avancé, il permet une gestion optimale des stocks, réserves et utilisateurs.

### ✨ Points forts

- 🏢 **Multi-entreprises** : Gestion de plusieurs établissements
- 👥 **4 niveaux d'accès** : Superuser, Admin, Manager, User
- 📊 **Dashboard temps réel** : Suivi des stocks en direct
- 🔄 **Système de réserves** : Gestion centralisée des approvisionnements
- 📱 **Interface responsive** : Compatible mobile et desktop
- 🔐 **Sécurité avancée** : Authentification JWT et permissions granulaires

---

## 🎯 Fonctionnalités

<details>
<summary><strong>🏢 Gestion Multi-Entreprises</strong></summary>

- Création et gestion d'entreprises multiples
- Isolation complète des données par entreprise
- Sélecteur d'entreprise dans la navigation
- Statistiques par entreprise

</details>

<details>
<summary><strong>🍺 Gestion des Bars</strong></summary>

- CRUD complet des bars
- Association aux entreprises
- Gestion des emplacements
- Statuts d'activité

</details>

<details>
<summary><strong>📦 Gestion des Produits & Formats</strong></summary>

- Catalogue de produits avec catégories
- Formats multiples par produit (bouteille, canette, fût, etc.)
- Gestion du packaging intelligent
- Système de marques et références

</details>

<details>
<summary><strong>📊 Gestion des Stocks</strong></summary>

- Stocks par bar avec quantités min/max
- Alertes de stock faible automatiques
- Historique complet des mouvements
- Dashboard multi-bars en temps réel

</details>

<details>
<summary><strong>🏪 Système de Réserves Multiples</strong></summary>

- Réserves par type (frigorifique, sec, congélateur, cave)
- Transferts intelligents réserve → bar
- Gestion des lots et dates d'expiration
- Initialisation automatique par catégorie

</details>

<details>
<summary><strong>👥 Gestion des Utilisateurs</strong></summary>

- 4 niveaux d'accès hiérarchiques
- Interface adaptative selon permissions
- Gestion des mots de passe sécurisée
- Statistiques utilisateurs

</details>

---

## 🔐 Système de Gestion des Utilisateurs

### 🎭 Permissions par Rôle

| Rôle | Entreprises | Utilisateurs | Bars | Stocks | Réserves |
|------|-------------|--------------|------|--------|----------|
| **SuperUser** | ✅ Toutes | ✅ Tous | ✅ Tous | ✅ Tous | ✅ Toutes |
| **Admin** | ✅ La sienne | ✅ Son équipe | ✅ Ses bars | ✅ Ses stocks | ✅ Ses réserves |
| **Manager** | ❌ | ✅ Users uniquement | ✅ Ses bars | ✅ Ses stocks | ✅ Ses réserves |
| **User** | ❌ | ❌ | ✅ Son bar | ✅ Son bar | ✅ Consultation |

### 🔑 Comptes de Test

| Username | Password | Rôle | Accès |
|----------|----------|------|-------|
| `superadmin` | `superadmin123` | SuperUser | Système complet |
| `admin` | `admin123` | Admin | PoneyClub |
| `manager` | `manager123` | Manager | Bars PoneyClub |
| `user` | `user123` | User | Bar Terrasse |

---

## 🏗️ Architecture Technique

### 📁 Structure du Projet

```
bar-stock-manager/
├── 📂 src/
│   ├── 📂 config/         # Configuration base de données
│   ├── 📂 controllers/    # Logique métier
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── companyController.js
│   │   ├── barController.js
│   │   ├── stockController.js
│   │   └── multiReserveController.js
│   ├── 📂 middleware/     # Middlewares Express
│   ├── 📂 models/         # Modèles Sequelize
│   │   ├── User.js
│   │   ├── Company.js
│   │   ├── Bar.js
│   │   ├── Product.js
│   │   ├── Format.js
│   │   ├── Stock.js
│   │   ├── Reserve.js
│   │   └── ReserveStock.js
│   ├── 📂 routes/         # Routes API
│   └── 📄 app.js          # Serveur principal
├── 📂 public/
│   ├── 📂 css/            # Styles
│   ├── 📂 js/             # Scripts frontend
│   │   ├── auth.js
│   │   ├── app.js
│   │   ├── stock-manager.js
│   │   └── user-manager.js
│   └── 📄 index.html      # SPA principale
├── 📂 scripts/            # Scripts utilitaires
└── 📄 package.json       # Dépendances
```

### Stack Technologique

- **Backend** : Node.js 18+, Express 4.18, Sequelize ORM
- **Base de données** : SQLite 3 avec relations complexes
- **Frontend** : HTML5/CSS3, Bootstrap 5.3, Vanilla JavaScript
- **Temps réel** : Socket.IO pour les mises à jour live
- **Sécurité** : JWT, bcrypt, permissions granulaires

---

## 🚀 Installation

### Prérequis

- **Node.js** 18+ 
- **npm** ou **yarn**
- **Git**

### 🔧 Installation Rapide

```bash
# 1. Cloner le repository
git clone https://github.com/votre-username/bar-stock-manager.git
cd bar-stock-manager

# 2. Installer les dépendances
npm install

# 3. Créer les utilisateurs de test
node scripts/create-superuser.js

# 4. Démarrer en mode développement
npm run dev

# 5. Ouvrir dans le navigateur
open http://localhost:3000
```

### ⚙️ Configuration

Le système fonctionne avec SQLite par défaut (aucune configuration requise). Pour personnaliser :

```javascript
// src/config/database.js
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false // Activer pour debug
});
```

---

## 📊 Dashboard Multi-Bars

Le dashboard révolutionnaire affiche tous vos bars simultanément avec des métriques en temps réel :

### 🎨 Fonctionnalités Visuelles

- **Cartes dynamiques** par bar avec statuts colorés
- **Indicateurs temps réel** : Bon/Attention/Critique
- **Top 5 produits à recharger** par établissement
- **Statistiques globales** : Entreprises, bars, produits, alertes
- **Cache intelligent** pour optimiser les performances

### 📈 Exemple de Répartition

```
📊 Statistiques Globales
├── 🏢 2 Entreprises actives
├── 🍺 6 Bars opérationnels  
├── 📦 11 Produits en catalogue
├── 📋 17 Formats disponibles
├── 📊 18 Stocks en surveillance
└── ⚠️ 3 Alertes stock faible
```

---

## 🏪 Système de Réserves Avancé

### Types de Réserves

| Type | Température | Capacité | Produits Recommandés |
|------|-------------|----------|---------------------|
| 🧊 **Frigorifique** | +4°C | 500 unités | Bières, sodas, vins blancs |
| ❄️ **Congélateur** | -18°C | 200 unités | Produits surgelés |
| 🌡️ **Sec** | Ambiante | 300 unités | Spiritueux, vins rouges |
| 🍷 **Cave** | 12-14°C | 300 unités | Vins spécialisés |
| 🍺 **Bar** | Ambiante | 300 unités | Stockage direct |

### 🔄 Logique de Transfert

1. **Sélection** du produit en réserve
2. **Validation** de la quantité disponible
3. **Choix** du bar de destination
4. **Confirmation** du stock compatible
5. **Déduction** automatique de la réserve
6. **Addition** au stock du bar
7. **Historique** complet du transfert

---

## 🎮 Guide d'Utilisation

### 🚀 Démarrage Rapide

1. **Connexion** avec un compte de test
2. **Sélection entreprise** dans la navbar
3. **Initialisation** des réserves par défaut
4. **Ajout produits** et formats
5. **Gestion stocks** par bar
6. **Transferts** réserve → bar

### 🎯 Workflow Recommandé

```
🏢 Créer Entreprise
    ↓
🍺 Ajouter Bars
    ↓
📦 Créer Produits & Formats
    ↓
🏪 Initialiser Réserves (5 types automatiques)
    ↓
📊 Configurer Stocks par Bar
    ↓
🔄 Gérer Transferts Réserve → Bar
    ↓
👥 Ajouter Utilisateurs avec Rôles
```

---

## 📚 API Documentation

### 🔐 Authentification

```javascript
// Headers requis
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json"
}
```

### 🛣️ Endpoints Principaux

| Méthode | Endpoint | Description | Permissions |
|---------|----------|-------------|-------------|
| `POST` | `/api/auth/login` | Connexion utilisateur | Public |
| `GET` | `/api/companies` | Liste entreprises | Admin+ |
| `GET` | `/api/bars` | Liste bars | Tous |
| `GET` | `/api/products` | Liste produits | Tous |
| `GET` | `/api/stocks` | Liste stocks | Tous |
| `GET` | `/api/users` | Liste utilisateurs | Manager+ |
| `POST` | `/api/multi-reserves/initialize-defaults` | Init réserves | Manager+ |
| `POST` | `/api/reserve-stocks/transfer` | Transfert réserve | Manager+ |

### 📝 Exemples d'Utilisation

```javascript
// Connexion
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'admin',
    password: 'admin123'
  })
});

// Récupération des stocks
const stocks = await fetch('/api/stocks?companyId=2', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

## 🔧 Scripts Utilitaires

```bash
# Gestion des utilisateurs
npm run create-superuser    # Créer un superutilisateur
npm run create-test-users   # Créer tous les utilisateurs de test

# Base de données
npm run init-db            # Initialiser la base de données
npm run check-db           # Vérifier l'état de la DB
npm run backup-db          # Sauvegarde de la base

# Serveur
npm start                  # Mode production
npm run dev               # Mode développement (nodemon)

# Maintenance
npm run optimize-db       # Optimiser la base de données
npm run clean-logs        # Nettoyer les logs
```

---

## 🏢 Données de Test - PoneyClub

Le système inclut des données de test complètes pour l'entreprise **PoneyClub** :

### 📊 Configuration Actuelle

- **Entreprise** : PoneyClub (ID: 2)
- **Bars** : 3 bars (Bar Terrasse, Bar Écurie, Bar Réception)
- **Réserves** : 4 réserves (2 Frigorifiques + 2 Sèches)
- **Produits** : 9 produits variés (Coca-Cola, Heineken, Smirnoff, etc.)
- **Stocks** : 14 stocks bars + 16 stocks réserves

### 🔄 Workflow de Test

```bash
# 1. Se connecter avec admin/admin123
# 2. Sélectionner "PoneyClub" dans le dropdown
# 3. Voir le dashboard avec les 3 bars
# 4. Onglet "Réserves" → 4 réserves configurées
# 5. Tester les transferts réserve → bar
```

---

## 🔧 Maintenance et Optimisation

### 📅 Tâches de Maintenance

**Quotidienne :**
- Vérification des alertes stock
- Sauvegarde automatique
- Contrôle des logs d'erreur

**Hebdomadaire :**
- Optimisation de la base de données
- Nettoyage des données temporaires
- Mise à jour des seuils de stock

**Mensuelle :**
- Audit complet du système
- Mise à jour des dépendances
- Révision des permissions utilisateurs

### 🚀 Optimisations Appliquées

- **Index de performance** sur les jointures fréquentes
- **Cache intelligent** pour le dashboard (30s)
- **Seuils optimisés** automatiquement (Min=30% actuel, Max=200%)
- **Nettoyage automatique** des données orphelines

---

## 🤝 Contribution

### 🎯 Comment Contribuer

1. **Fork** le projet
2. **Créer** une branche feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** vos changements (`git commit -m 'Add AmazingFeature'`)
4. **Push** vers la branche (`git push origin feature/AmazingFeature`)
5. **Ouvrir** une Pull Request

### 📋 Standards de Code

- **ESLint** pour la qualité du code
- **Prettier** pour le formatage
- **Conventional Commits** pour les messages
- **Tests** requis pour nouvelles fonctionnalités

---

## 📊 Statistiques du Projet

```
📈 Métriques de Développement
├── 📄 50+ fichiers source
├── 🔧 12 modèles de données
├── 🛣️ 25+ endpoints API
├── 👥 4 niveaux de permissions
├── 🏢 Support multi-entreprises
├── 📊 Dashboard temps réel
├── 🔄 Système de réserves
└── ✅ 100% fonctionnel
```

---

## 📄 Licence

Ce projet est sous licence **MIT**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 🎉 Remerciements

- **Express.js** pour le framework backend robuste
- **Sequelize** pour l'ORM puissant
- **Bootstrap** pour l'interface moderne
- **Socket.IO** pour le temps réel
- **La communauté open source** pour l'inspiration

---

<div align="center">

**🍺 Développé avec ❤️ pour la communauté des bars et restaurants**

[![Made with Node.js](https://img.shields.io/badge/Made%20with-Node.js-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![Powered by Express](https://img.shields.io/badge/Powered%20by-Express-blue?style=for-the-badge&logo=express)](https://expressjs.com/)
[![Built with Bootstrap](https://img.shields.io/badge/Built%20with-Bootstrap-purple?style=for-the-badge&logo=bootstrap)](https://getbootstrap.com/)

[⬆️ Retour en haut](#-bar-stock-manager)

</div> 