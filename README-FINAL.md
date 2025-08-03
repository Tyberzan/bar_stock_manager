# 🍺 Bar Stock Manager - Système Complet de Gestion de Stocks

## 📋 Vue d'ensemble

**Bar Stock Manager** est un système complet de gestion de stocks pour établissements multi-bars avec réserves centralisées. Conçu pour gérer plusieurs entreprises, bars, produits et un système de réserves multiples par type de stockage.

### ✨ Fonctionnalités principales

- 🏢 **Multi-entreprises** : Gestion séparée de plusieurs établissements
- 🍺 **Multi-bars** : Dashboard temps réel avec statuts de tous les bars
- 🏪 **Réserves multiples** : Système de stockage par type (frigo, sec, congélateur, cave, bar)
- 📦 **Gestion produits avancée** : Produits avec formats multiples et packaging
- ➡️ **Transferts intelligents** : Réserve → Bar avec validation et traçabilité
- 📊 **Dashboard temps réel** : Alertes automatiques et statistiques live
- 🔐 **Authentification** : Système sécurisé avec rôles utilisateurs

## 🚀 Installation et Démarrage

### Prérequis
- Node.js (v14+)
- npm ou yarn

### Installation
```bash
# Cloner le projet
git clone [url-du-repo]
cd bar-stock-manager

# Installer les dépendances
npm install

# Démarrer en développement
npm run dev

# Ou en production
npm start
```

### Accès
- **URL** : http://localhost:3000
- **Connexion** : admin / admin123
- **Port** : 3000

## 📊 État Actuel du Système

### 📈 Statistiques
- **2 entreprises** : Restaurant Le Gourmet, PoneyClub
- **6 bars total** : 2 + 4 bars respectivement
- **11 produits** avec **17 formats** différents
- **18 stocks** répartis dans les bars
- **4 réserves** avec **16 stocks de réserves**

### 🏢 Entreprise PoneyClub (Principale)
- **4 bars** : Bar Terrasse, Bar Écurie, Bar Réception, Bar Lounge
- **18 stocks** répartis intelligemment
- **4 réserves** : 2 Frigorifiques (-40°C) + 2 Sèches (ambiante)
- **Bar Lounge** avec stocks de test originaux restaurés

## 🎯 Workflow Optimal

### 1. 🏢 Sélection Entreprise
- Utiliser le **dropdown navbar** pour filtrer par entreprise
- Option "Toutes les entreprises" pour vue globale

### 2. 📦 Gestion Produits
- Créer produits dans l'onglet "Produits"
- Ajouter formats avec packaging approprié
- Catégories : bière, soda, spiritueux, vin, eau, autre

### 3. 🏪 Initialisation Réserves
- Cliquer **"Initialiser réserves par défaut"** (onglet Réserves)
- Crée automatiquement 5 types de réserves :
  - **Frigorifique** : +4°C, bières/sodas (cap: 500)
  - **Congélateur** : -18°C, surgelés (cap: 200)
  - **Sec** : Ambiante, spiritueux (cap: 300)
  - **Cave** : 12-14°C, vins (cap: 300)
  - **Bar** : Ambiante, stock direct (cap: 300)

### 4. 📊 Approvisionnement
- Remplir les réserves selon les types
- Quantités min/max automatiquement calculées
- Emplacements et lots gérés

### 5. ➡️ Transferts
- Transférer réserve → bar selon besoins
- Validation automatique des quantités
- Traçabilité complète via historique

### 6. 📈 Suivi Continu
- Dashboard temps réel avec alertes
- Statuts colorés : Bon/Attention/Critique
- Top 5 produits à recharger par bar

## 🔧 Architecture Technique

### Backend (Node.js + Express + Sequelize + SQLite)
```
src/
├── app.js              # Serveur principal (port 3000)
├── models/             # Modèles de données (12 fichiers)
│   ├── Company.js      # Entreprises
│   ├── Bar.js          # Bars
│   ├── Product.js      # Produits
│   ├── Format.js       # Formats avec packaging
│   ├── Stock.js        # Stocks par bar
│   ├── Reserve.js      # Réserves multiples
│   ├── ReserveStock.js # Stocks dans réserves
│   └── ...
├── controllers/        # Contrôleurs API (9 fichiers)
├── routes/            # Routes API REST
└── middleware/        # Authentification JWT
```

### Frontend (SPA Bootstrap + Vanilla JS)
```
public/
├── index.html         # SPA principale (894 lignes)
├── js/
│   ├── auth.js        # Authentification (228 lignes)
│   ├── app.js         # Coordinateur principal (1424 lignes)
│   ├── stock-manager.js # Gestionnaire stocks (2540 lignes)
│   └── ...
├── css/styles.css     # Styles Bootstrap personnalisés
└── ...
```

### Base de Données (SQLite)
- **database.sqlite** : Base principale optimisée
- **Relations** : Company → Bar → Stock ← Format ← Product
- **Réserves** : Reserve → ReserveStock ← Format
- **Index** : Optimisés pour performance

## 🛠️ Maintenance

### 📅 Quotidienne
1. Vérifier stocks faibles (< minQuantity)
2. Effectuer transferts réserve → bar
3. Mettre à jour quantités après inventaire
4. Vérifier alertes dashboard

### 📅 Hebdomadaire
1. Réapprovisionner réserves
2. Ajuster seuils min/max
3. Nettoyer produits inactifs
4. Sauvegarder base de données

### 📅 Mensuelle
1. Analyser statistiques consommation
2. Optimiser capacités réserves
3. Ajouter nouveaux produits
4. Former utilisateurs

## 💻 Commandes Utiles

### 🚀 Démarrage
```bash
npm run dev     # Développement avec auto-reload
npm start       # Production
```

### 🔧 Maintenance
```bash
node protocol-test-complete.js    # Test complet système
node optimize-and-maintenance.js  # Optimisation + guide
```

### 📊 Diagnostic SQL
```sql
-- Vérifier stocks faibles
SELECT p.name, f.size, s.currentQuantity, s.minQuantity
FROM Stocks s
JOIN Formats f ON s.formatId = f.id
JOIN Products p ON f.productId = p.id
WHERE s.currentQuantity < s.minQuantity;
```

## 🐛 Bugs Corrigés

### ✅ Problèmes Résolus
- **EagerLoadingError** : Associations Reserve/Format corrigées
- **Dashboard** : Affichage multi-bars simultané implémenté
- **Bar Lounge** : Récupération complète des données originales
- **Authentification** : Harmonisation localStorage (user/currentUser)
- **Contraintes SQLite** : Gestion des migrations et index
- **Performance** : Index optimisés, cache intelligent

### 🔧 Optimisations Appliquées
- **Seuils intelligents** : Min/max calculés automatiquement
- **Index de performance** : Requêtes optimisées
- **Cache dashboard** : 30 secondes pour performances
- **Nettoyage automatique** : Données orphelines supprimées

## ✅ Bonnes Pratiques

### 🔐 Sécurité
- Changer mot de passe admin par défaut
- Sauvegarder régulièrement database.sqlite
- Limiter accès serveur (firewall)

### 📈 Performance
- Nettoyer données anciennes (> 1 an)
- Surveiller taille base (< 100MB)
- Redémarrer serveur si lenteur

### 👥 Utilisation
- Former utilisateurs au workflow optimal
- Utiliser entreprises pour séparer établissements
- Profiter système réserves multiples
- Suivre alertes dashboard

## 🎉 Fonctionnalités Avancées

### 🏪 Système de Réserves Multiples
- **Types configurés** : 5 types de stockage
- **Gestion lots** : Numéros, dates expiration
- **Emplacements** : Zones spécifiques par réserve
- **Capacités** : Limites par type de stockage
- **Alertes** : Statuts visuels temps réel

### 📊 Dashboard Innovant
- **Vue simultanée** : Tous les bars visibles
- **Statuts colorés** : Bon/Attention/Critique
- **Actions rapides** : Voir stocks, Actualiser
- **Cache intelligent** : Performance optimisée
- **Responsive** : Adaptation mobile/desktop

### 🔄 Transferts Intelligents
- **Validation** : Quantités et formats
- **Transaction atomique** : Tout ou rien
- **Socket.IO** : Notifications temps réel
- **Historique** : Traçabilité complète
- **Confirmation** : Modal de validation

## 📞 Support

### 🆘 En cas de problème
1. Vérifier que le serveur tourne (port 3000)
2. Consulter les logs dans la console
3. Relancer `npm run dev` si nécessaire
4. Utiliser `protocol-test-complete.js` pour diagnostic

### 🔄 Reset complet
```bash
# Arrêter le serveur
Ctrl+C

# Supprimer la base (ATTENTION : perte de données)
del database.sqlite

# Redémarrer
npm run dev
```

---

## 🚀 Système Prêt pour Production

✅ **Tests complets** : Tous les tests passent  
✅ **Optimisations** : Performance et sécurité  
✅ **Documentation** : Guide complet  
✅ **Données** : PoneyClub avec 4 bars + réserves  
✅ **Bugs** : Tous corrigés  

**🎯 Le système Bar Stock Manager est maintenant 100% opérationnel pour une utilisation professionnelle intensive !** 