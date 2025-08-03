const { Reserve, ReserveStock, Format, Product, Company, ReserveTransfer, sequelize } = require('../models');
const { Op } = require('sequelize');

// Types de réserves avec leurs configurations par défaut
const RESERVE_TYPES = {
  frigorifique: {
    name: 'Réserve Frigorifique',
    temperature: '+4°C',
    description: 'Stockage réfrigéré pour produits frais',
    productCategories: ['bière', 'soda', 'vin blanc', 'champagne', 'eau']
  },
  congelateur: {
    name: 'Réserve Congélateur',
    temperature: '-18°C',
    description: 'Stockage congelé pour produits surgelés',
    productCategories: ['glace', 'produits_surgeles']
  },
  sec: {
    name: 'Réserve Sèche',
    temperature: 'Ambiante',
    description: 'Stockage à température ambiante',
    productCategories: ['spiritueux', 'vin rouge', 'sirop', 'conserves']
  },
  cave: {
    name: 'Cave à Vin',
    temperature: '12-14°C',
    description: 'Stockage spécialisé pour les vins',
    productCategories: ['vin', 'champagne']
  },
  bar: {
    name: 'Réserve Bar',
    temperature: 'Ambiante',
    description: 'Stockage direct derrière le bar',
    productCategories: ['spiritueux', 'sirop', 'garniture']
  }
};

// Créer une nouvelle réserve
exports.createReserve = async (req, res) => {
  try {
    const { companyId, name, type, temperature, capacity, location, description } = req.body;
    
    // Vérifier que l'entreprise existe
    if (companyId) {
      const company = await Company.findByPk(companyId);
      if (!company) {
        return res.status(400).json({
          success: false,
          message: "Entreprise non trouvée"
        });
      }
    }
    
    // Valider le type de réserve
    if (!Object.keys(RESERVE_TYPES).includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Type de réserve invalide"
      });
    }
    
    const reserve = await Reserve.create({
      companyId,
      name,
      type,
      temperature,
      capacity,
      location,
      description
    });
    
    return res.status(201).json({
      success: true,
      message: "Réserve créée avec succès",
      data: reserve
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création de la réserve",
      error: error.message
    });
  }
};

// Obtenir toutes les réserves
exports.getAllReserves = async (req, res) => {
  try {
    const { companyId, type } = req.query;
    
    const whereClause = { isActive: true };
    if (companyId) {
      whereClause.companyId = companyId;
    }
    if (type) {
      whereClause.type = type;
    }
    
    const reserves = await Reserve.findAll({
      where: whereClause,
      include: [
        {
          model: Company,
          attributes: ['id', 'name']
        },
        {
          model: ReserveStock,
          include: [
            {
              model: Format,
              include: [Product]
            }
          ]
        }
      ],
      order: [['type', 'ASC'], ['name', 'ASC']]
    });
    
    return res.status(200).json({
      success: true,
      count: reserves.length,
      data: reserves
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des réserves",
      error: error.message
    });
  }
};

// Obtenir une réserve par son ID
exports.getReserveById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const reserve = await Reserve.findByPk(id, {
      include: [
        {
          model: Company,
          attributes: ['id', 'name']
        },
        {
          model: ReserveStock,
          include: [
            {
              model: Format,
              include: [Product]
            }
          ]
        }
      ]
    });
    
    if (!reserve) {
      return res.status(404).json({
        success: false,
        message: "Réserve non trouvée"
      });
    }
    
    return res.status(200).json({
      success: true,
      data: reserve
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de la réserve",
      error: error.message
    });
  }
};

// Mettre à jour une réserve
exports.updateReserve = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, temperature, capacity, location, description, isActive } = req.body;
    
    let reserve = await Reserve.findByPk(id);
    
    if (!reserve) {
      return res.status(404).json({
        success: false,
        message: "Réserve non trouvée"
      });
    }
    
    reserve = await reserve.update({
      name: name || reserve.name,
      type: type || reserve.type,
      temperature: temperature !== undefined ? temperature : reserve.temperature,
      capacity: capacity !== undefined ? capacity : reserve.capacity,
      location: location !== undefined ? location : reserve.location,
      description: description !== undefined ? description : reserve.description,
      isActive: isActive !== undefined ? isActive : reserve.isActive
    });
    
    return res.status(200).json({
      success: true,
      message: "Réserve mise à jour avec succès",
      data: reserve
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de la réserve",
      error: error.message
    });
  }
};

// Supprimer une réserve
exports.deleteReserve = async (req, res) => {
  try {
    const { id } = req.params;
    
    const reserve = await Reserve.findByPk(id);
    
    if (!reserve) {
      return res.status(404).json({
        success: false,
        message: "Réserve non trouvée"
      });
    }
    
    // Vérifier s'il y a des stocks dans cette réserve
    const stockCount = await ReserveStock.count({
      where: { reserveId: id, quantity: { [Op.gt]: 0 } }
    });
    
    if (stockCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Impossible de supprimer une réserve contenant des stocks"
      });
    }
    
    await reserve.destroy();
    
    return res.status(200).json({
      success: true,
      message: "Réserve supprimée avec succès"
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de la réserve",
      error: error.message
    });
  }
};

// Initialiser les réserves par défaut pour une entreprise
exports.initializeDefaultReserves = async (req, res) => {
  try {
    const { companyId } = req.body;
    
    // Vérifier que l'entreprise existe
    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(400).json({
        success: false,
        message: "Entreprise non trouvée"
      });
    }
    
    // Vérifier s'il y a déjà des réserves pour cette entreprise
    const existingReserves = await Reserve.count({
      where: { companyId, isActive: true }
    });
    
    if (existingReserves > 0) {
      return res.status(400).json({
        success: false,
        message: "Cette entreprise a déjà des réserves configurées"
      });
    }
    
    const transaction = await sequelize.transaction();
    
    try {
      const createdReserves = [];
      
      // Créer les réserves par défaut
      for (const [typeKey, config] of Object.entries(RESERVE_TYPES)) {
        const reserve = await Reserve.create({
          companyId,
          name: `${config.name} - ${company.name}`,
          type: typeKey,
          temperature: config.temperature,
          capacity: typeKey === 'frigorifique' ? 500 : typeKey === 'congelateur' ? 200 : 300,
          location: `Zone ${config.name.toLowerCase()}`,
          description: config.description
        }, { transaction });
        
        createdReserves.push(reserve);
      }
      
      await transaction.commit();
      
      return res.status(201).json({
        success: true,
        message: `${createdReserves.length} réserves par défaut créées avec succès`,
        data: createdReserves
      });
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de l'initialisation des réserves",
      error: error.message
    });
  }
};

// Obtenir les types de réserves disponibles
exports.getReserveTypes = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: RESERVE_TYPES
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des types de réserves",
      error: error.message
    });
  }
};

// Obtenir les statistiques des réserves par entreprise
exports.getReserveStats = async (req, res) => {
  try {
    const { companyId } = req.query;
    
    const whereClause = { isActive: true };
    if (companyId) {
      whereClause.companyId = companyId;
    }
    
    const reserves = await Reserve.findAll({
      where: whereClause,
      include: [
        {
          model: ReserveStock,
          attributes: ['quantity', 'minQuantity', 'maxQuantity']
        }
      ]
    });
    
    const stats = {
      totalReserves: reserves.length,
      byType: {},
      totalCapacity: 0,
      totalStock: 0,
      alertsCount: 0
    };
    
    reserves.forEach(reserve => {
      // Stats par type
      if (!stats.byType[reserve.type]) {
        stats.byType[reserve.type] = {
          count: 0,
          capacity: 0,
          stock: 0
        };
      }
      
      stats.byType[reserve.type].count++;
      stats.byType[reserve.type].capacity += reserve.capacity || 0;
      stats.totalCapacity += reserve.capacity || 0;
      
      // Stats des stocks
      reserve.ReserveStocks.forEach(stock => {
        const stockQty = stock.quantity || 0;
        stats.totalStock += stockQty;
        stats.byType[reserve.type].stock += stockQty;
        
        // Compter les alertes (stock faible)
        if (stockQty <= stock.minQuantity) {
          stats.alertsCount++;
        }
      });
    });
    
    return res.status(200).json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques",
      error: error.message
    });
  }
}; 