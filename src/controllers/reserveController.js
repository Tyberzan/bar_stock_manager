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

// Créer une nouvelle réserve
const createReserve = async (req, res) => {
  try {
    const { formatId, quantity, minQuantity, maxQuantity, location, notes } = req.body;

    // Vérifier si le format existe
    const format = await Format.findByPk(formatId);
    if (!format) {
      return res.status(404).json({
        success: false,
        message: 'Format non trouvé'
      });
    }

    // Vérifier si une réserve existe déjà pour ce format
    const existingReserve = await Reserve.findOne({ where: { formatId } });
    if (existingReserve) {
      return res.status(400).json({
        success: false,
        message: 'Une réserve existe déjà pour ce format'
      });
    }

    const reserve = await Reserve.create({
      formatId,
      quantity: quantity || 0,
      minQuantity: minQuantity || 10,
      maxQuantity: maxQuantity || 100,
      location,
      notes,
      lastRestockDate: quantity > 0 ? new Date() : null
    });

    const createdReserve = await Reserve.findByPk(reserve.id, {
      include: [
        {
          model: Format,
          include: [{ model: Product }]
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: createdReserve,
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

// Mettre à jour une réserve
const updateReserve = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, minQuantity, maxQuantity, location, notes, isActive } = req.body;

    const reserve = await Reserve.findByPk(id);
    if (!reserve) {
      return res.status(404).json({
        success: false,
        message: 'Réserve non trouvée'
      });
    }

    const oldQuantity = reserve.quantity;
    
    await reserve.update({
      quantity: quantity !== undefined ? quantity : reserve.quantity,
      minQuantity: minQuantity !== undefined ? minQuantity : reserve.minQuantity,
      maxQuantity: maxQuantity !== undefined ? maxQuantity : reserve.maxQuantity,
      location: location !== undefined ? location : reserve.location,
      notes: notes !== undefined ? notes : reserve.notes,
      isActive: isActive !== undefined ? isActive : reserve.isActive,
      lastRestockDate: (quantity !== undefined && quantity > oldQuantity) ? new Date() : reserve.lastRestockDate
    });

    const updatedReserve = await Reserve.findByPk(id, {
      include: [
        {
          model: Format,
          include: [{ model: Product }]
        }
      ]
    });

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

// Initialiser les réserves pour tous les formats
const initializeReserves = async (req, res) => {
  try {
    // Récupérer tous les formats actifs qui n'ont pas encore de réserve
    const formats = await Format.findAll({
      include: [{ model: Product }],
      where: { isActive: true }
    });

    if (formats.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucun format trouvé pour initialiser les réserves'
      });
    }

    // Vérifier quels formats n'ont pas encore de réserve
    const existingReserves = await Reserve.findAll({
      attributes: ['formatId']
    });
    const existingFormatIds = existingReserves.map(r => r.formatId);
    
    const formatsToInitialize = formats.filter(format => !existingFormatIds.includes(format.id));

    if (formatsToInitialize.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Toutes les réserves sont déjà initialisées'
      });
    }

    // Créer les réserves avec des valeurs par défaut intelligentes
    const reservesToCreate = formatsToInitialize.map(format => {
      const product = format.Product;
      const category = product?.category || 'other';
      
      // Définir des quantités par défaut selon la catégorie
      let defaultQuantity = 0;
      let minQuantity = 10;
      let maxQuantity = 100;
      let location = 'À définir';
      
      switch (category.toLowerCase()) {
        case 'beer':
        case 'bière':
          minQuantity = 20;
          maxQuantity = 150;
          location = 'Zone bières';
          break;
        case 'soft':
        case 'soda':
          minQuantity = 15;
          maxQuantity = 200;
          location = 'Zone sodas';
          break;
        case 'spirit':
        case 'spiritueux':
          minQuantity = 5;
          maxQuantity = 50;
          location = 'Armoire sécurisée';
          break;
        case 'wine':
        case 'vin':
          minQuantity = 8;
          maxQuantity = 60;
          location = 'Cave à vin';
          break;
        default:
          minQuantity = 10;
          maxQuantity = 100;
          location = 'Zone générale';
      }

      return {
        formatId: format.id,
        quantity: defaultQuantity,
        minQuantity,
        maxQuantity,
        location,
        notes: `Réserve initialisée automatiquement pour ${product?.name || 'produit'} ${format.size}`,
        isActive: true
      };
    });

    // Créer toutes les réserves en une seule transaction
    const { sequelize } = require('../config/database');
    const transaction = await sequelize.transaction();

    try {
      const createdReserves = await Reserve.bulkCreate(reservesToCreate, { transaction });
      await transaction.commit();

      // Récupérer les réserves créées avec leurs relations
      const reservesWithDetails = await Reserve.findAll({
        where: {
          id: createdReserves.map(r => r.id)
        },
        include: [
          {
            model: Format,
            include: [{ model: Product }]
          }
        ]
      });

      res.json({
        success: true,
        data: reservesWithDetails,
        message: `${createdReserves.length} réserve(s) initialisée(s) avec succès`,
        summary: {
          total: createdReserves.length,
          byCategory: reservesToCreate.reduce((acc, reserve) => {
            const format = formatsToInitialize.find(f => f.id === reserve.formatId);
            const category = format?.Product?.category || 'other';
            acc[category] = (acc[category] || 0) + 1;
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