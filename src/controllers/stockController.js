const { Stock, Format, Product, Bar, Company, sequelize } = require('../models');
const { Op } = require('sequelize');

// Créer ou mettre à jour un stock
exports.createOrUpdateStock = async (req, res) => {
  try {
    const { barId, formatId, currentQuantity, minQuantity, idealQuantity } = req.body;
    
    // Vérifier si le bar existe
    const bar = await Bar.findByPk(barId);
    
    if (!bar) {
      return res.status(404).json({
        success: false,
        message: "Bar non trouvé"
      });
    }
    
    // Vérifier si le format existe
    const format = await Format.findByPk(formatId, {
      include: [Product]
    });
    
    if (!format) {
      return res.status(404).json({
        success: false,
        message: "Format non trouvé"
      });
    }
    
    // Vérifier si le stock existe déjà
    let stock = await Stock.findOne({
      where: {
        barId,
        formatId
      }
    });
    
    let message = "";
    
    if (stock) {
      // Mettre à jour le stock existant
      stock = await stock.update({
        currentQuantity: currentQuantity !== undefined ? currentQuantity : stock.currentQuantity,
        minQuantity: minQuantity !== undefined ? minQuantity : stock.minQuantity,
        idealQuantity: idealQuantity !== undefined ? idealQuantity : stock.idealQuantity
      });
      
      message = "Stock mis à jour avec succès";
    } else {
      // Créer un nouveau stock
      stock = await Stock.create({
        barId,
        formatId,
        currentQuantity: currentQuantity || 0,
        minQuantity: minQuantity || 10,
        idealQuantity: idealQuantity || 30
      });
      
      message = "Stock créé avec succès";
    }
    
    // Récupérer le stock avec les détails du format et du produit
    stock = await Stock.findByPk(stock.id, {
      include: [
        {
          model: Format,
          include: [Product]
        },
        Bar
      ]
    });
    
    // Émettre un événement pour notifier les clients connectés
    if (global.io) {
      global.io.to(`bar-${barId}`).emit('stock-updated', stock);
    }
    
    return res.status(200).json({
      success: true,
      message,
      data: stock
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création ou mise à jour du stock",
      error: error.message
    });
  }
};

// Obtenir tous les stocks
exports.getAllStocks = async (req, res) => {
  try {
    console.log('🔍 [STOCK API] getAllStocks appelé');
    console.log('📥 [STOCK API] Query params:', req.query);
    
    const query = {};
    const { companyId } = req.query || {};
    
    // Filtre par barId si spécifié
    if (req.query && req.query.barId) {
      query.barId = req.query.barId;
    }
    
    // Filtre par formatId si spécifié
    if (req.query && req.query.formatId) {
      query.formatId = req.query.formatId;
    }
    
    // Construire les includes avec filtre par entreprise si nécessaire
    const barInclude = {
      model: Bar,
      include: [
        {
          model: Company,
          attributes: ['id', 'name']
        }
      ]
    };
    
    // Si companyId est spécifié, ajouter le filtre
    if (companyId) {
      barInclude.where = { companyId };
    }
    
    console.log('📊 [STOCK API] Requête WHERE:', query);
    console.log('📊 [STOCK API] Company filter:', companyId);
    
    const stocks = await Stock.findAll({
      where: query,
      include: [
        {
          model: Format,
          include: [Product]
        },
        {
          model: Product
        },
        barInclude
      ],
      order: [['id', 'ASC']]
    });
    
    console.log(`✅ [STOCK API] ${stocks.length} stocks trouvés`);
    if (stocks.length > 0) {
      const firstStock = stocks[0];
      console.log('🔍 [STOCK API] Premier stock structure:', {
        id: firstStock.id,
        barId: firstStock.barId,
        hasProduct: !!firstStock.Product,
        productName: firstStock.Product?.name,
        hasFormat: !!firstStock.Format,
        formatSize: firstStock.Format?.size,
        hasBar: !!firstStock.Bar,
        barName: firstStock.Bar?.name
      });
    }
    
    console.log('📤 [STOCK API] Envoi réponse 200 OK');
    
    return res.status(200).json({
      success: true,
      count: stocks.length,
      data: stocks
    });
    
  } catch (error) {
    console.error('❌ [STOCK API] ERREUR dans getAllStocks:', error.message);
    console.error('❌ [STOCK API] Stack trace:', error.stack);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des stocks",
      error: error.message
    });
  }
};

// Obtenir un stock par son ID
exports.getStockById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const stock = await Stock.findByPk(id, {
      include: [
        {
          model: Format,
          include: [Product]
        },
        Bar
      ]
    });
    
    if (!stock) {
      return res.status(404).json({
        success: false,
        message: "Stock non trouvé"
      });
    }
    
    return res.status(200).json({
      success: true,
      data: stock
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du stock",
      error: error.message
    });
  }
};

// Mettre à jour un stock complet
exports.updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { barId, formatId, currentQuantity, minQuantity, idealQuantity } = req.body;
    
    let stock = await Stock.findByPk(id);
    
    if (!stock) {
      return res.status(404).json({
        success: false,
        message: "Stock non trouvé"
      });
    }
    
    // Vérifier si le bar existe si barId est fourni
    if (barId) {
      const bar = await Bar.findByPk(barId);
      if (!bar) {
        return res.status(404).json({
          success: false,
          message: "Bar non trouvé"
        });
      }
    }
    
    // Vérifier si le format existe si formatId est fourni
    if (formatId) {
      const format = await Format.findByPk(formatId);
      if (!format) {
        return res.status(404).json({
          success: false,
          message: "Format non trouvé"
        });
      }
    }
    
    // Mettre à jour le stock
    stock = await stock.update({
      barId: barId || stock.barId,
      formatId: formatId || stock.formatId,
      currentQuantity: currentQuantity !== undefined ? currentQuantity : stock.currentQuantity,
      minQuantity: minQuantity !== undefined ? minQuantity : stock.minQuantity,
      idealQuantity: idealQuantity !== undefined ? idealQuantity : stock.idealQuantity
    });
    
    // Récupérer le stock avec les détails du format et du produit
    stock = await Stock.findByPk(stock.id, {
      include: [
        {
          model: Format,
          include: [Product]
        },
        Bar
      ]
    });
    
    // Émettre un événement pour notifier les clients connectés
    if (global.io) {
      global.io.to(`bar-${stock.barId}`).emit('stock-updated', stock);
    }
    
    return res.status(200).json({
      success: true,
      message: "Stock mis à jour avec succès",
      data: stock
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du stock",
      error: error.message
    });
  }
};

// Mettre à jour uniquement la quantité d'un stock
exports.updateStockQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentQuantity } = req.body;
    
    let stock = await Stock.findByPk(id);
    
    if (!stock) {
      return res.status(404).json({
        success: false,
        message: "Stock non trouvé"
      });
    }
    
    // Vérifier que la quantité est un nombre valide
    if (currentQuantity === undefined || isNaN(currentQuantity)) {
      return res.status(400).json({
        success: false,
        message: "La quantité doit être un nombre valide"
      });
    }
    
    // Mettre à jour uniquement la quantité
    stock = await stock.update({
      currentQuantity: currentQuantity
    });
    
    // Récupérer le stock avec les détails du format et du produit
    stock = await Stock.findByPk(stock.id, {
      include: [
        {
          model: Format,
          include: [Product]
        },
        Bar
      ]
    });
    
    // Émettre un événement pour notifier les clients connectés
    if (global.io) {
      global.io.to(`bar-${stock.barId}`).emit('stock-updated', stock);
    }
    
    return res.status(200).json({
      success: true,
      message: "Quantité de stock mise à jour avec succès",
      data: stock
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de la quantité du stock",
      error: error.message
    });
  }
};

// Obtenir les stocks à réapprovisionner par bar
exports.getStocksToRestock = async (req, res) => {
  try {
    console.log('🔍 [RESTOCK API] getStocksToRestock appelé');
    console.log('📥 [RESTOCK API] Params:', req.params);
    
    const { barId } = req.params;
    
    // Vérifier si le bar existe
    const bar = await Bar.findByPk(barId);
    
    if (!bar) {
      return res.status(404).json({
        success: false,
        message: "Bar non trouvé"
      });
    }
    
    // Trouver tous les stocks où currentQuantity < minThreshold
    const stocksToRestock = await Stock.findAll({
      where: {
        barId,
        currentQuantity: {
          [Op.lt]: sequelize.col('minThreshold')
        }
      },
      include: [
        {
          model: Format,
          include: [Product]
        },
        Bar
      ],
      order: [
        [sequelize.literal('(minThreshold - currentQuantity)'), 'DESC']  // Trier par quantité manquante
      ]
    });
    
    return res.status(200).json({
      success: true,
      count: stocksToRestock.length,
      data: stocksToRestock
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des stocks à réapprovisionner",
      error: error.message
    });
  }
};

// Initialiser tous les stocks pour un bar spécifique
exports.initializeBarStocks = async (req, res) => {
  try {
    const { barId } = req.params;
    const { stocks } = req.body;
    
    // Vérifier si le bar existe
    const bar = await Bar.findByPk(barId);
    
    if (!bar) {
      return res.status(404).json({
        success: false,
        message: "Bar non trouvé"
      });
    }
    
    if (!Array.isArray(stocks) || stocks.length === 0) {
      return res.status(400).json({
        success: false,
        message: "La liste des stocks à initialiser est vide ou mal formatée"
      });
    }
    
    const updatedStocks = [];
    const errors = [];
    
    // Traiter chaque stock en séquence
    for (const stockData of stocks) {
      try {
        const { formatId, currentQuantity, minQuantity, idealQuantity } = stockData;
        
        // Vérifier si le format existe
        const format = await Format.findByPk(formatId, {
          include: [Product]
        });
        
        if (!format) {
          errors.push({
            formatId,
            message: "Format non trouvé"
          });
          continue;
        }
        
        // Vérifier si le stock existe déjà
        let stock = await Stock.findOne({
          where: {
            barId,
            formatId
          }
        });
        
        if (stock) {
          // Mettre à jour le stock existant
          stock = await stock.update({
            currentQuantity: currentQuantity !== undefined ? currentQuantity : stock.currentQuantity,
            minQuantity: minQuantity !== undefined ? minQuantity : stock.minQuantity,
            idealQuantity: idealQuantity !== undefined ? idealQuantity : stock.idealQuantity
          });
        } else {
          // Créer un nouveau stock
          stock = await Stock.create({
            barId,
            formatId,
            currentQuantity: currentQuantity || 0,
            minQuantity: minQuantity || 10,
            idealQuantity: idealQuantity || 30
          });
        }
        
        // Récupérer le stock avec les détails du format et du produit
        stock = await Stock.findByPk(stock.id, {
          include: [
            {
              model: Format,
              include: [Product]
            },
            Bar
          ]
        });
        
        updatedStocks.push(stock);
      } catch (err) {
        errors.push({
          formatId: stockData.formatId,
          message: err.message
        });
      }
    }
    
    // Émettre un événement pour notifier les clients connectés
    if (global.io && updatedStocks.length > 0) {
      global.io.to(`bar-${barId}`).emit('stocks-initialized', updatedStocks);
    }
    
    return res.status(200).json({
      success: true,
      message: `${updatedStocks.length} stocks initialisés avec succès`,
      data: updatedStocks,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de l'initialisation des stocks du bar",
      error: error.message
    });
  }
};

// Générer un rapport de réapprovisionnement complet pour un bar
exports.generateRestockReport = async (req, res) => {
  try {
    const { barId } = req.params;
    
    // Vérifier si le bar existe
    const bar = await Bar.findByPk(barId, {
      include: [Company]
    });
    
    if (!bar) {
      return res.status(404).json({
        success: false,
        message: "Bar non trouvé"
      });
    }
    
    // Récupérer tous les stocks avec leurs produits et formats
    const allStocks = await Stock.findAll({
      where: { barId },
      include: [
        {
          model: Format,
          include: [Product]
        }
      ],
      order: [
        [sequelize.col('Format->Product.category'), 'ASC'],
        [sequelize.col('Format->Product.name'), 'ASC']
      ]
    });
    
    // Récupérer les stocks à réapprovisionner (quantité actuelle < quantité minimale)
    const stocksToRestock = allStocks.filter(stock => 
      stock.currentQuantity < stock.minThreshold
    );
    
    // Organiser les produits par catégorie
    const stocksByCategory = {};
    const categoryCounts = {};
    
    allStocks.forEach(stock => {
      const category = stock.Format.Product.category;
      const productName = stock.Format.Product.name;
      const formatSize = stock.Format.size;
      const formatUnit = stock.Format.unit;
      
      if (!stocksByCategory[category]) {
        stocksByCategory[category] = [];
        categoryCounts[category] = 0;
      }
      
      if (stock.currentQuantity < stock.minQuantity) {
        categoryCounts[category]++;
      }
      
      stocksByCategory[category].push({
        id: stock.id,
        productName: productName,
        formatSize: formatSize,
        formatUnit: formatUnit,
        currentQuantity: stock.currentQuantity,
        minQuantity: stock.minQuantity,
        idealQuantity: stock.idealQuantity,
        toOrder: Math.max(0, stock.idealQuantity - stock.currentQuantity),
        needsRestock: stock.currentQuantity < stock.minQuantity
      });
    });
    
    // Générer un rapport avec date et informations du bar
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const report = {
      date: dateStr,
      bar: {
        id: bar.id,
        name: bar.name,
        location: bar.location,
        company: bar.Company ? bar.Company.name : null
      },
      summary: {
        totalProducts: allStocks.length,
        totalToRestock: stocksToRestock.length,
        percentageToRestock: Math.round((stocksToRestock.length / allStocks.length) * 100)
      },
      categories: Object.keys(stocksByCategory).map(category => ({
        name: category,
        products: stocksByCategory[category],
        count: stocksByCategory[category].length,
        toRestockCount: categoryCounts[category]
      }))
    };
    
    return res.status(200).json({
      success: true,
      data: report
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la génération du rapport de réapprovisionnement",
      error: error.message
    });
  }
}; 