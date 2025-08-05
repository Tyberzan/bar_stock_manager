# 🔄 GUIDE SYNCHRONISATION BASE DE DONNÉES - Collaboration Git

## ❌ **PROBLÈME IDENTIFIÉ :**
- Colonnes "undefined" dans le tableau stocks (cache navigateur)
- Base de données non synchronisée entre collaborateurs Git
- Modifications de schéma (minQuantity → minThreshold) non appliquées partout

---

## ✅ **SOLUTION IMMÉDIATE :**

### **1. VIDER LE CACHE NAVIGATEUR**
```bash
# Dans votre navigateur:
1. F12 → Network → Cocher "Disable cache"
2. Ou Ctrl+F5 (rechargement forcé)
3. Ou Ctrl+Shift+R (vider cache et recharger)
```

### **2. REDÉMARRER LE SERVEUR PROPREMENT**
```bash
# Tuer tous les processus Node.js
taskkill /F /IM node.exe

# Redémarrer proprement
npm run dev
```

### **3. TESTER L'URL CORRECTE**
```
http://localhost:3000/index.html#stocks
```
**PAS** `http://localhost:3000/stocks.html` (qui n'existe pas)

---

## 🔄 **SYSTÈME DE SYNCHRONISATION DATABASE + GIT**

### **WORKFLOW RECOMMANDÉ :**

#### **🔧 Pour celui qui fait des changements de schéma :**
```bash
# 1. Faire les modifications (modèles, contrôleurs, etc.)
git add .
git commit -m "🔧 SCHEMA: Description des changements"

# 2. Exporter la base après changements
node scripts/export-database.js export

# 3. Commiter l'export
git add exports/database-export-*.json
git commit -m "📊 DATABASE: Export après changements schéma"

# 4. Pousser tout
git push origin main
```

#### **🔄 Pour le collaborateur qui récupère :**
```bash
# 1. Récupérer les changements
git pull origin main

# 2. Importer la nouvelle base de données
node scripts/export-database.js import

# 3. Redémarrer le serveur
npm run dev

# 4. Vider le cache navigateur (Ctrl+F5)
```

---

## 📋 **CHECKLIST DE SYNCHRONISATION :**

### **✅ Avant chaque session de travail :**
- [ ] `git pull origin main`
- [ ] `node scripts/export-database.js import` (si nouveau export disponible)
- [ ] `npm run dev`
- [ ] Tester que l'app fonctionne

### **✅ Après des changements importants :**
- [ ] `node scripts/export-database.js export`
- [ ] `git add . && git commit -m "Description"`
- [ ] `git push origin main`
- [ ] Prévenir le collaborateur

### **✅ Si problème "undefined" ou données manquantes :**
- [ ] Vérifier que le serveur tourne (`npm run dev`)
- [ ] Vider cache navigateur (Ctrl+F5)
- [ ] Vérifier l'URL : `http://localhost:3000/index.html#stocks`
- [ ] Importer la dernière base : `node scripts/export-database.js import`

---

## 🛠️ **SCRIPTS DE MAINTENANCE :**

### **1. Diagnostic complet :**
```bash
node scripts/diagnose-database.js
```

### **2. Vérification colonnes stocks :**
```bash
node scripts/check-stock-columns.js
```

### **3. Reset complet si problème :**
```bash
# Arrêter serveur
taskkill /F /IM node.exe

# Importer base propre
node scripts/export-database.js import

# Recréer admin
node scripts/simple-admin-creation.js

# Redémarrer
npm run dev
```

---

## 🎯 **SOLUTION AU PROBLÈME ACTUEL :**

### **Votre problème "undefined" :**
1. **Serveur redémarré** ✅
2. **Base de données correcte** ✅ (`minThreshold: 10, maxThreshold: 50`)
3. **JavaScript corrigé** ✅ (utilise `stock.minThreshold`)

### **Il faut juste :**
1. **Vider le cache navigateur** (Ctrl+F5)
2. **Aller sur la bonne URL** : `http://localhost:3000/index.html#stocks`
3. **Sélectionner un bar** dans le dropdown

➜ **Les colonnes devraient maintenant afficher les vraies valeurs au lieu de "undefined" !**

---

## 📞 **EN CAS DE PROBLÈME PERSISTANT :**

1. **Copier les logs serveur** (console `npm run dev`)
2. **Copier les logs navigateur** (F12 → Console)
3. **Vérifier l'API directement** : `http://localhost:3000/api/stocks?barId=2`
4. **Utiliser les scripts de diagnostic**

La base de données est correcte, c'est un problème de cache/URL ! 🚀