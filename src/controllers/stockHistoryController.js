const { StockHistory, Stock, Format, Product, Bar, sequelize } = require('../models');
const { Op } = require('sequelize');

// Créer une nouvelle entrée d'historique
exports.createStockHistory = async (req, res) => {
  try {
    const { stockId, previousQuantity, newQuantity, shiftDate, shiftName, notes } = req.body;
    
    // Vérifier si le stock existe
    const stock = await Stock.findByPk(stockId, {
      include: [Bar]
    });
    
    if (!stock) {
      return res.status(404).json({
        success: false,
        message: "Stock non trouvé"
      });
    }
    
    // Calculer la quantité consommée
    const consumedQuantity = previousQuantity - newQuantity;
    
    // Créer une nouvelle entrée d'historique
    const stockHistory = await StockHistory.create({
      stockId,
      barId: stock.barId,
      previousQuantity,
      newQuantity,
      consumedQuantity,
      shiftDate: shiftDate || new Date(),
      shiftName,
      notes
    });
    
    // Mettre à jour la quantité actuelle du stock
    await stock.update({ currentQuantity: newQuantity });
    
    // Récupérer l'historique avec les détails du stock
    const history = await StockHistory.findByPk(stockHistory.id, {
      include: [
        {
          model: Stock,
          include: [
            {
              model: Format,
              include: [Product]
            }
          ]
        },
        Bar
      ]
    });
    
    return res.status(201).json({
      success: true,
      message: "Historique de stock créé avec succès",
      data: history
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création de l'historique de stock",
      error: error.message
    });
  }
};

// Obtenir tout l'historique des stocks
exports.getAllStockHistory = async (req, res) => {
  try {
    const query = {};
    
    // Filtre par barId si spécifié
    if (req.query.barId) {
      query.barId = req.query.barId;
    }
    
    // Filtre par stockId si spécifié
    if (req.query.stockId) {
      query.stockId = req.query.stockId;
    }
    
    // Filtre par date si spécifié
    if (req.query.startDate && req.query.endDate) {
      query.shiftDate = {
        [Op.between]: [req.query.startDate, req.query.endDate]
      };
    } else if (req.query.startDate) {
      query.shiftDate = {
        [Op.gte]: req.query.startDate
      };
    } else if (req.query.endDate) {
      query.shiftDate = {
        [Op.lte]: req.query.endDate
      };
    }
    
    const history = await StockHistory.findAll({
      where: query,
      include: [
        {
          model: Stock,
          include: [
            {
              model: Format,
              include: [Product]
            }
          ]
        },
        Bar
      ],
      order: [['shiftDate', 'DESC'], ['createdAt', 'DESC']]
    });
    
    return res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de l'historique des stocks",
      error: error.message
    });
  }
};

// Obtenir une entrée d'historique par son ID
exports.getStockHistoryById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const history = await StockHistory.findByPk(id, {
      include: [
        {
          model: Stock,
          include: [
            {
              model: Format,
              include: [Product]
            }
          ]
        },
        Bar
      ]
    });
    
    if (!history) {
      return res.status(404).json({
        success: false,
        message: "Historique de stock non trouvé"
      });
    }
    
    return res.status(200).json({
      success: true,
      data: history
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de l'historique de stock",
      error: error.message
    });
  }
};

// Obtenir un résumé de la consommation par jour et par bar
exports.getConsumptionSummary = async (req, res) => {
  try {
    const { barId } = req.params;
    const { startDate, endDate } = req.query;
    
    // Vérifier si le bar existe
    if (barId) {
      const bar = await Bar.findByPk(barId);
      
      if (!bar) {
        return res.status(404).json({
          success: false,
          message: "Bar non trouvé"
        });
      }
    }
    
    const whereClause = {};
    
    // Filtre par barId si spécifié
    if (barId) {
      whereClause.barId = barId;
    }
    
    // Filtre par date si spécifié
    if (startDate && endDate) {
      whereClause.shiftDate = {
        [Op.between]: [startDate, endDate]
      };
    } else if (startDate) {
      whereClause.shiftDate = {
        [Op.gte]: startDate
      };
    } else if (endDate) {
      whereClause.shiftDate = {
        [Op.lte]: endDate
      };
    }
    
    // Obtenir un résumé de la consommation groupé par jour et par bar
    const summary = await StockHistory.findAll({
      where: whereClause,
      attributes: [
        'shiftDate',
        'barId',
        [sequelize.fn('SUM', sequelize.col('consumedQuantity')), 'totalConsumed']
      ],
      include: [
        {
          model: Bar,
          attributes: ['id', 'name']
        }
      ],
      group: ['shiftDate', 'barId', 'Bar.id', 'Bar.name'],
      order: [['shiftDate', 'DESC'], ['barId', 'ASC']]
    });
    
    return res.status(200).json({
      success: true,
      count: summary.length,
      data: summary
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du résumé de consommation",
      error: error.message
    });
  }
}; 