const { ReserveStock, Reserve, Format, Product, sequelize } = require('../models');

// Créer un nouveau stock dans une réserve
exports.createReserveStock = async (req, res) => {
  try {
    const { 
      reserveId, 
      formatId, 
      quantity, 
      minQuantity, 
      maxQuantity, 
      location, 
      expirationDate, 
      batchNumber, 
      notes 
    } = req.body;
    
    // Vérifier que la réserve existe
    const reserve = await Reserve.findByPk(reserveId);
    if (!reserve) {
      return res.status(400).json({
        success: false,
        message: "Réserve non trouvée"
      });
    }
    
    // Vérifier que le format existe
    const format = await Format.findByPk(formatId);
    if (!format) {
      return res.status(400).json({
        success: false,
        message: "Format non trouvé"
      });
    }
    
    // Vérifier qu'il n'y a pas déjà ce format dans cette réserve
    const existingStock = await ReserveStock.findOne({
      where: { reserveId, formatId }
    });
    
    if (existingStock) {
      return res.status(400).json({
        success: false,
        message: "Ce produit existe déjà dans cette réserve"
      });
    }
    
    const reserveStock = await ReserveStock.create({
      reserveId,
      formatId,
      quantity: quantity || 0,
      minQuantity: minQuantity || 10,
      maxQuantity: maxQuantity || 100,
      location,
      expirationDate,
      batchNumber,
      notes,
      lastRestockDate: quantity > 0 ? new Date() : null
    });
    
    return res.status(201).json({
      success: true,
      message: "Stock ajouté à la réserve avec succès",
      data: reserveStock
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de l'ajout du stock à la réserve",
      error: error.message
    });
  }
};

// Obtenir tous les stocks d'une réserve
exports.getReserveStocks = async (req, res) => {
  try {
    const { reserveId } = req.params;
    
    const stocks = await ReserveStock.findAll({
      where: { reserveId, isActive: true },
      include: [
        {
          model: Format,
          include: [Product]
        },
        {
          model: Reserve,
          attributes: ['id', 'name', 'type']
        }
      ],
      order: [
        [{ model: Format, as: 'Format' }, { model: Product, as: 'Product' }, 'name', 'ASC'],
        [{ model: Format, as: 'Format' }, 'size', 'ASC']
      ]
    });
    
    return res.status(200).json({
      success: true,
      count: stocks.length,
      data: stocks
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des stocks de la réserve",
      error: error.message
    });
  }
};

// Obtenir un stock spécifique
exports.getReserveStockById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const stock = await ReserveStock.findByPk(id, {
      include: [
        {
          model: Format,
          include: [Product]
        },
        {
          model: Reserve,
          attributes: ['id', 'name', 'type']
        }
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

// Mettre à jour un stock de réserve
exports.updateReserveStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      quantity, 
      minQuantity, 
      maxQuantity, 
      location, 
      expirationDate, 
      batchNumber, 
      notes,
      isActive 
    } = req.body;
    
    let stock = await ReserveStock.findByPk(id);
    
    if (!stock) {
      return res.status(404).json({
        success: false,
        message: "Stock non trouvé"
      });
    }
    
    const oldQuantity = stock.quantity;
    
    stock = await stock.update({
      quantity: quantity !== undefined ? quantity : stock.quantity,
      minQuantity: minQuantity !== undefined ? minQuantity : stock.minQuantity,
      maxQuantity: maxQuantity !== undefined ? maxQuantity : stock.maxQuantity,
      location: location !== undefined ? location : stock.location,
      expirationDate: expirationDate !== undefined ? expirationDate : stock.expirationDate,
      batchNumber: batchNumber !== undefined ? batchNumber : stock.batchNumber,
      notes: notes !== undefined ? notes : stock.notes,
      isActive: isActive !== undefined ? isActive : stock.isActive,
      lastRestockDate: quantity > oldQuantity ? new Date() : stock.lastRestockDate
    });
    
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

// Supprimer un stock de réserve
exports.deleteReserveStock = async (req, res) => {
  try {
    const { id } = req.params;
    
    const stock = await ReserveStock.findByPk(id);
    
    if (!stock) {
      return res.status(404).json({
        success: false,
        message: "Stock non trouvé"
      });
    }
    
    await stock.destroy();
    
    return res.status(200).json({
      success: true,
      message: "Stock supprimé avec succès"
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression du stock",
      error: error.message
    });
  }
};

// Initialiser les stocks d'une réserve avec des produits suggérés
exports.initializeReserveStocks = async (req, res) => {
  try {
    const { reserveId } = req.params;
    const { formatIds } = req.body;
    
    // Vérifier que la réserve existe
    const reserve = await Reserve.findByPk(reserveId);
    if (!reserve) {
      return res.status(400).json({
        success: false,
        message: "Réserve non trouvée"
      });
    }
    
    // Vérifier que les formats existent
    const formats = await Format.findAll({
      where: { id: formatIds, isActive: true },
      include: [Product]
    });
    
    if (formats.length !== formatIds.length) {
      return res.status(400).json({
        success: false,
        message: "Certains formats sont introuvables"
      });
    }
    
    const transaction = await sequelize.transaction();
    
    try {
      const createdStocks = [];
      
      for (const format of formats) {
        // Vérifier qu'il n'existe pas déjà
        const existingStock = await ReserveStock.findOne({
          where: { reserveId, formatId: format.id }
        });
        
        if (!existingStock) {
          const product = format.Product;
          const category = product?.category || 'other';
          
          // Calculer les valeurs par défaut selon le type de réserve et la catégorie
          let minQuantity = 10;
          let maxQuantity = 100;
          
          // Ajuster selon le type de réserve
          switch (reserve.type) {
            case 'frigorifique':
              minQuantity = category === 'beer' ? 20 : category === 'soft' ? 15 : 10;
              maxQuantity = category === 'beer' ? 150 : category === 'soft' ? 200 : 80;
              break;
            case 'congelateur':
              minQuantity = 5;
              maxQuantity = 50;
              break;
            case 'sec':
              minQuantity = category === 'spirit' ? 5 : 10;
              maxQuantity = category === 'spirit' ? 50 : 100;
              break;
            case 'cave':
              minQuantity = 8;
              maxQuantity = 60;
              break;
            case 'bar':
              minQuantity = 3;
              maxQuantity = 20;
              break;
          }
          
          const stock = await ReserveStock.create({
            reserveId,
            formatId: format.id,
            quantity: 0,
            minQuantity,
            maxQuantity,
            location: `${reserve.location || 'Zone principale'}`,
            notes: `Initialisé automatiquement pour ${reserve.name}`
          }, { transaction });
          
          createdStocks.push(stock);
        }
      }
      
      await transaction.commit();
      
      return res.status(201).json({
        success: true,
        message: `${createdStocks.length} stock(s) initialisé(s) dans la réserve`,
        data: createdStocks
      });
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de l'initialisation des stocks",
      error: error.message
    });
  }
}; 