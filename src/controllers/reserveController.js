const { Reserve, Format, Product, ReserveTransfer, Stock, Bar } = require('../models');
const { Op } = require('sequelize');

// Récupérer toutes les réserves
const getAllReserves = async (req, res) => {
  try {
    const reserves = await Reserve.findAll({
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: reserves
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des réserves:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des réserves',
      error: error.message
    });
  }
};

// Récupérer une réserve par ID
const getReserveById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const reserve = await Reserve.findByPk(id);

    if (!reserve) {
      return res.status(404).json({
        success: false,
        message: 'Réserve non trouvée'
      });
    }

    res.json({
      success: true,
      data: reserve
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la réserve:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la réserve',
      error: error.message
    });
  }
};

// Créer une nouvelle réserve physique
const createReserve = async (req, res) => {
  try {
    const { name, type, temperature, capacity, location, description, companyId } = req.body;

    // Validation des champs requis
    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: 'Le nom et le type de réserve sont requis'
      });
    }

    // Vérifier si une réserve avec ce nom existe déjà
    const existingReserve = await Reserve.findOne({ 
      where: { name, companyId: companyId || null } 
    });
    if (existingReserve) {
      return res.status(400).json({
        success: false,
        message: 'Une réserve avec ce nom existe déjà'
      });
    }

    const reserve = await Reserve.create({
      name,
      type,
      temperature,
      capacity,
      location,
      description,
      companyId: companyId || null,
      isActive: true
    });

    res.status(201).json({
      success: true,
      data: reserve,
      message: 'Réserve créée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la création de la réserve:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la réserve',
      error: error.message
    });
  }
};

// Mettre à jour une réserve physique
const updateReserve = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, temperature, capacity, location, description, isActive } = req.body;

    const reserve = await Reserve.findByPk(id);
    if (!reserve) {
      return res.status(404).json({
        success: false,
        message: 'Réserve non trouvée'
      });
    }

    // Mettre à jour seulement les champs qui existent dans le modèle Reserve
    await reserve.update({
      name: name !== undefined ? name : reserve.name,
      type: type !== undefined ? type : reserve.type,
      temperature: temperature !== undefined ? temperature : reserve.temperature,
      capacity: capacity !== undefined ? capacity : reserve.capacity,
      location: location !== undefined ? location : reserve.location,
      description: description !== undefined ? description : reserve.description,
      isActive: isActive !== undefined ? isActive : reserve.isActive
    });

    // Récupérer la réserve mise à jour sans inclusions incorrectes
    const updatedReserve = await Reserve.findByPk(id);

    res.json({
      success: true,
      data: updatedReserve,
      message: 'Réserve mise à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la réserve:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la réserve',
      error: error.message
    });
  }
};

// Supprimer une réserve
const deleteReserve = async (req, res) => {
  try {
    const { id } = req.params;

    const reserve = await Reserve.findByPk(id);
    if (!reserve) {
      return res.status(404).json({
        success: false,
        message: 'Réserve non trouvée'
      });
    }

    await reserve.destroy();

    res.json({
      success: true,
      message: 'Réserve supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la réserve:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la réserve',
      error: error.message
    });
  }
};

// Transférer des produits de la réserve vers un bar
const transferToBar = async (req, res) => {
  try {
    const { reserveId, stockId, barId, quantity, notes, transferredBy } = req.body;

    if (!reserveId || !stockId || !barId || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Données de transfert invalides'
      });
    }

    // Récupérer la réserve
    const reserve = await Reserve.findByPk(reserveId);
    if (!reserve) {
      return res.status(404).json({
        success: false,
        message: 'Réserve non trouvée'
      });
    }

    // Récupérer le stock de destination
    const stock = await Stock.findByPk(stockId);
    if (!stock) {
      return res.status(404).json({
        success: false,
        message: 'Stock de destination non trouvé'
      });
    }

    // Vérifier que la réserve a suffisamment de quantité
    if (reserve.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `Quantité insuffisante en réserve (disponible: ${reserve.quantity}, demandé: ${quantity})`
      });
    }

    // Vérifier que les formats correspondent
    if (reserve.formatId !== stock.formatId) {
      return res.status(400).json({
        success: false,
        message: 'Les formats de la réserve et du stock ne correspondent pas'
      });
    }

    // Effectuer le transfert dans une transaction
    const { sequelize } = require('../config/database');
    const transaction = await sequelize.transaction();

    try {
      // Sauvegarder les quantités avant transfert
      const reserveQuantityBefore = reserve.quantity;
      const stockQuantityBefore = stock.currentQuantity || stock.quantity || 0;

      // Mettre à jour la réserve
      await reserve.update({
        quantity: reserve.quantity - quantity
      }, { transaction });

      // Mettre à jour le stock
      const newStockQuantity = stockQuantityBefore + quantity;
      await stock.update({
        currentQuantity: newStockQuantity,
        quantity: newStockQuantity // Pour compatibilité
      }, { transaction });

      // Créer l'enregistrement de transfert
      const transfer = await ReserveTransfer.create({
        reserveId,
        stockId,
        barId,
        formatId: reserve.formatId,
        quantity,
        reserveQuantityBefore,
        reserveQuantityAfter: reserve.quantity - quantity,
        stockQuantityBefore,
        stockQuantityAfter: newStockQuantity,
        transferredBy,
        notes,
        transferType: 'restock'
      }, { transaction });

      await transaction.commit();

      // Récupérer les données mises à jour
      const updatedReserve = await Reserve.findByPk(reserveId, {
        include: [{ model: Format, include: [{ model: Product }] }]
      });

      const updatedStock = await Stock.findByPk(stockId, {
        include: [
          { model: Format, include: [{ model: Product }] },
          { model: Bar }
        ]
      });

      // Émettre un événement Socket.IO pour notifier les clients
      if (global.io) {
        global.io.to(`bar-${barId}`).emit('stockUpdated', {
          stockId,
          newQuantity: newStockQuantity,
          transferQuantity: quantity
        });
      }

      res.json({
        success: true,
        data: {
          transfer,
          updatedReserve,
          updatedStock
        },
        message: `Transfert effectué avec succès: ${quantity} unités transférées vers ${updatedStock.Bar.name}`
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Erreur lors du transfert:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du transfert',
      error: error.message
    });
  }
};

// Initialiser les réserves par défaut
const initializeReserves = async (req, res) => {
  try {
    // Vérifier s'il y a déjà des réserves
    const existingReserves = await Reserve.count();
    
    if (existingReserves > 0) {
      return res.status(400).json({
        success: false,
        message: 'Des réserves existent déjà dans le système'
      });
    }

    // Créer des réserves par défaut selon les types de stockage
    const defaultReserves = [
      {
        name: 'Réserve Frigorifique Principale',
        type: 'frigorifique',
        temperature: '+4°C',
        capacity: 500,
        location: 'Cave frigorifique',
        description: 'Réserve principale pour les boissons réfrigérées',
        isActive: true
      },
      {
        name: 'Réserve Sèche',
        type: 'sec',
        temperature: 'Ambiante',
        capacity: 1000,
        location: 'Entrepôt principal',
        description: 'Stockage à température ambiante pour spiritueux et conserves',
        isActive: true
      },
      {
        name: 'Cave à Vins',
        type: 'cave',
        temperature: '+12°C',
        capacity: 200,
        location: 'Cave climatisée',
        description: 'Stockage optimal pour les vins',
        isActive: true
      },
      {
        name: 'Congélateur',
        type: 'congelateur',
        temperature: '-18°C',
        capacity: 100,
        location: 'Zone congélation',
        description: 'Stockage pour produits surgelés',
        isActive: true
      }
    ];

    // Créer les réserves en une seule transaction
    const { sequelize } = require('../config/database');
    const transaction = await sequelize.transaction();

    try {
      const createdReserves = await Reserve.bulkCreate(defaultReserves, { transaction });
      await transaction.commit();

      res.json({
        success: true,
        data: createdReserves,
        message: `${createdReserves.length} réserve(s) initialisée(s) avec succès`,
        summary: {
          total: createdReserves.length,
          types: createdReserves.reduce((acc, reserve) => {
            acc[reserve.type] = (acc[reserve.type] || 0) + 1;
            return acc;
          }, {})
        }
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Erreur lors de l\'initialisation des réserves:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'initialisation des réserves',
      error: error.message
    });
  }
};

// Récupérer l'historique des transferts
const getTransferHistory = async (req, res) => {
  try {
    const { barId, startDate, endDate, limit = 50 } = req.query;

    const whereClause = {};
    if (barId) whereClause.barId = barId;
    if (startDate && endDate) {
      whereClause.transferDate = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const transfers = await ReserveTransfer.findAll({
      where: whereClause,
      include: [
        { model: Reserve, include: [{ model: Format, include: [{ model: Product }] }] },
        { model: Stock, include: [{ model: Bar }] }
      ],
      order: [['transferDate', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: transfers
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique des transferts:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'historique des transferts',
      error: error.message
    });
  }
};

module.exports = {
  getAllReserves,
  getReserveById,
  createReserve,
  updateReserve,
  deleteReserve,
  transferToBar,
  getTransferHistory,
  initializeReserves
}; 