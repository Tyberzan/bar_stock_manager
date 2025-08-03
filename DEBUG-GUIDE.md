# 🔍 GUIDE DE DÉBOGAGE COMPLET - Bar Stock Manager

## 🌐 TOUTES LES ROUTES API DISPONIBLES

### 📊 **STOCKS - Routes principales**
```bash
# Tous les stocks
GET http://localhost:3000/api/stocks

# Stocks d'un bar spécifique
GET http://localhost:3000/api/stocks?barId=1
GET http://localhost:3000/api/stocks?barId=2  # Bar Terrasse
GET http://localhost:3000/api/stocks?barId=3
GET http://localhost:3000/api/stocks?barId=4

# Produits à recharger par bar
GET http://localhost:3000/api/stocks/restock/1
GET http://localhost:3000/api/stocks/restock/2  # Bar Terrasse (PROBLÈME)
GET http://localhost:3000/api/stocks/restock/3
GET http://localhost:3000/api/stocks/restock/4

# Créer/modifier stock
POST http://localhost:3000/api/stocks
PUT http://localhost:3000/api/stocks/:id
DELETE http://localhost:3000/api/stocks/:id

# Rapport de restock
GET http://localhost:3000/api/stocks/restock-report/:barId
```

### 🏢 **BARS - Routes**
```bash
# Tous les bars
GET http://localhost:3000/api/bars

# Bar spécifique
GET http://localhost:3000/api/bars/:id

# Bars par entreprise
GET http://localhost:3000/api/bars?companyId=1
```

### 🍺 **PRODUITS - Routes**  
```bash
# Tous les produits
GET http://localhost:3000/api/products

# Produit spécifique
GET http://localhost:3000/api/products/:id

# Produits par catégorie
GET http://localhost:3000/api/products?category=soft
GET http://localhost:3000/api/products?category=beer
GET http://localhost:3000/api/products?category=spirits
```

### 🏪 **ENTREPRISES - Routes**
```bash
# Toutes les entreprises
GET http://localhost:3000/api/companies

# Entreprise spécifique
GET http://localhost:3000/api/companies/:id
```

### 👥 **UTILISATEURS - Routes**
```bash
# Tous les utilisateurs
GET http://localhost:3000/api/users

# Login
POST http://localhost:3000/api/auth/login
# Body: {"username": "admin", "password": "admin123"}
```

---

## 🖥️ PAGES WEB FRONTEND

### **Pages principales**
- **Dashboard**: http://localhost:3000/
- **Stocks**: http://localhost:3000/stocks.html
- **Réserves**: http://localhost:3000/reserves.html
- **Produits**: http://localhost:3000/products.html
- **Login**: http://localhost:3000/login.html

### **JavaScript Frontend Files**
- **Main App**: `/public/js/app.js` (PROBLÈME PROBABLE ICI)
- **Stocks Logic**: Fonction `displayStocks()` ligne ~380
- **API Calls**: Fonction `loadStocks()` ligne ~350

---

## 🧪 TESTS EN LIGNE DE COMMANDE

### **Test 1: Vérifier la base de données**
```bash
node scripts/diagnose-database.js
```

### **Test 2: Test API Stock direct**
```bash
node scripts/test-product-relation-fix.js
```

### **Test 3: Test Bar Terrasse spécifique**
```bash
node scripts/debug-bar-terrasse.js
```

### **Test 4: Diagnostic complet**
```bash
node scripts/deep-debug-stock-display.js
```

---

## 🔍 DÉBOGAGE NAVIGATEUR

### **Console JavaScript (F12)**
1. **Ouvrez F12** → **Console**
2. **Rechargez la page** (F5)
3. **Sélectionnez Bar Terrasse**
4. **Cherchez ces erreurs** :
   ```javascript
   // Erreurs possibles:
   - "Cannot read property 'name' of undefined"
   - "displayStocks is not defined" 
   - "API call failed"
   - "stock.Product is undefined"
   ```

### **Network Tab (F12)**
1. **Onglet Network**
2. **Filtrer par XHR/Fetch**
3. **Sélectionnez Bar Terrasse**
4. **Vérifiez l'appel** :
   ```
   GET /api/stocks?barId=2
   Status: 200 ✅ ou 500 ❌ ?
   Response: {...data...} ou erreur ?
   ```

---

## 📊 BASE DE DONNÉES - STRUCTURE

### **Tables et relations**
```sql
-- Stocks (table principale du problème)
Stock {
  id: INTEGER
  barId: INTEGER → Bar.id
  productId: INTEGER → Product.id
  formatId: INTEGER → Format.id
  currentQuantity: INTEGER
  minThreshold: INTEGER  (ancien: minQuantity)
  maxThreshold: INTEGER  (ancien: idealQuantity)
}

-- Relations critiques
Stock → Bar (barId)
Stock → Product (productId) ← CETTE RELATION ÉTAIT CASSÉE
Stock → Format (formatId)
Format → Product (productId)
```

### **Requête SQL équivalente du problème**
```sql
-- Ce que fait l'API GET /stocks?barId=2
SELECT 
  s.*,
  b.name as bar_name,
  p.name as product_name,
  f.size as format_size
FROM Stocks s
LEFT JOIN Bars b ON s.barId = b.id
LEFT JOIN Products p ON s.productId = p.id  -- CETTE JOINTURE MANQUAIT
LEFT JOIN Formats f ON s.formatId = f.id
WHERE s.barId = 2;
```

---

## 🚨 POINTS D'ÉCHEC POSSIBLES

### **1. API Stocks ne retourne pas Product**
- **Symptôme**: `stock.Product = undefined`
- **Test**: `GET /api/stocks?barId=2` → vérifier `data[0].Product`
- **Fix**: Contrôleur `stockController.js` ligne 130-140

### **2. JavaScript displayStocks() échoue**
- **Symptôme**: "Aucun stock trouvé" malgré API 200
- **Test**: Console F12 → erreurs JavaScript
- **Fix**: `public/js/app.js` ligne 380-450

### **3. Colonnes base de données incorrectes**
- **Symptôme**: "no such column: minThreshold"
- **Test**: `node scripts/diagnose-database.js`
- **Fix**: `scripts/fix-missing-data.js` ou migration

### **4. Relations Sequelize cassées**
- **Symptôme**: "Product is not associated to Stock"
- **Test**: Vérifier `src/models/index.js`
- **Fix**: Définir toutes les relations correctement

---

## 📋 CHECKLIST DE DÉBOGAGE

### ✅ **ÉTAPES À SUIVRE DANS L'ORDRE**

1. **[ ] Vérifier le serveur démarre**
   ```bash
   npm run dev
   # Doit afficher: "Server running on port 3000"
   ```

2. **[ ] Tester API en direct**
   ```bash
   curl http://localhost:3000/api/stocks?barId=2
   # Ou dans navigateur: http://localhost:3000/api/stocks?barId=2
   ```

3. **[ ] Vérifier structure réponse API**
   ```json
   {
     "success": true,
     "count": 8,
     "data": [
       {
         "id": 4,
         "currentQuantity": 5,
         "minThreshold": 10,
         "Product": {  // ← DOIT ÊTRE PRÉSENT !
           "name": "Coca-Cola"
         },
         "Bar": {
           "name": "Bar Terrasse"
         }
       }
     ]
   }
   ```

4. **[ ] Tester page web**
   - Ouvrir http://localhost:3000/stocks.html
   - F12 → Console pour erreurs
   - Sélectionner Bar Terrasse
   - Vérifier tableau stocks

5. **[ ] Si ça ne marche toujours pas**
   - Activer les LOGS détaillés (voir section suivante)
   - Analyser les logs en temps réel

---

## 📝 LOGS DÉTAILLÉS ACTIVÉS ✅

**TOUS LES LOGS SONT MAINTENANT ACTIVÉS** pour tracer chaque étape !

### **🖥️ LOGS SERVEUR** (console `npm run dev`):
```bash
🔍 [STOCK API] getAllStocks appelé
📥 [STOCK API] Query params: { barId: "2" }
📊 [STOCK API] Requête WHERE: { barId: "2" }
📊 [STOCK API] Company filter: undefined
✅ [STOCK API] 8 stocks trouvés
🔍 [STOCK API] Premier stock structure: {
  id: 4,
  barId: 2,
  hasProduct: true,  ← DOIT ÊTRE TRUE !
  productName: "Coca-Cola",
  hasFormat: true,
  formatSize: "33cl",
  hasBar: true,
  barName: "Bar Terrasse"
}
📤 [STOCK API] Envoi réponse 200 OK

# Si erreur:
❌ [STOCK API] ERREUR dans getAllStocks: Cannot read property 'name' of undefined
❌ [STOCK API] Stack trace: [détails...]
```

### **🌐 LOGS CLIENT** (F12 → Console navigateur):
```bash
🔍 [CLIENT] loadStocksTable appelé avec barId: 2
📤 [CLIENT] Appel API: /stocks?barId=2
📥 [CLIENT] Réponse API reçue: {
  success: true,
  count: 8,
  hasData: true,
  dataLength: 8
}
✅ [CLIENT] API success - Appel displayStocks()
📊 [CLIENT] Premier stock reçu: {
  id: 4,
  barId: 2,
  hasProduct: true,  ← DOIT ÊTRE TRUE !
  productName: "Coca-Cola",
  hasBar: true,
  barName: "Bar Terrasse",
  quantities: "5/10/50"
}
🎨 [CLIENT] displayStocks appelé avec 8 stocks
📊 [CLIENT] Affichage de 8 stocks:
   Stock 1: {
     id: 4,
     hasProduct: true,
     productName: "Coca-Cola",  ← PAS "MANQUANT" !
     hasBar: true,
     barName: "Bar Terrasse",
     quantities: "5/10/50"
   }
```

### **Fichiers avec logs activés**:
- ✅ `src/controllers/stockController.js` (getAllStocks, getStocksToRestock)
- ✅ `public/js/app.js` (loadStocksTable, displayStocks)
- 🔄 `src/controllers/barController.js` (à faire)
- 🔄 `src/controllers/productController.js` (à faire)

---

## 🎯 SOLUTION RAPIDE SI TOUT ÉCHOUE

```bash
# Reset complet de la base de données
node scripts/populate-full-database.js

# Reset admin
node scripts/simple-admin-creation.js

# Test final
node scripts/test-product-relation-fix.js
```

---

## 📞 AIDE SUPPLÉMENTAIRE

Si le problème persiste après tous ces tests:

1. **Copier les logs du serveur** (console où tourne `npm run dev`)
2. **Copier les erreurs JavaScript** (F12 → Console)
3. **Copier la réponse API** de `GET /api/stocks?barId=2`
4. **Screenshot de la page stocks.html**

Ces informations permettront un diagnostic précis du problème restant.