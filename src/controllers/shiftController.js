const { Shift, ShiftCount, Bar, Stock, Format, Product, Company, sequelize } = require('../models');
const { Op } = require('sequelize');

// Démarrer un nouveau service
exports.startShift = async (req, res) => {
  try {
    const { barId, notes } = req.body;
    
    // Vérifier si le bar existe
    const bar = await Bar.findByPk(barId);
    
    if (!bar) {
      return res.status(404).json({
        success: false,
        message: "Bar non trouvé"
      });
    }
    
    // Vérifier s'il y a déjà un service en cours pour ce bar
    const activeShift = await Shift.findOne({
      where: {
        barId,
        status: {
          [Op.ne]: 'terminé'
        }
      }
    });
    
    if (activeShift) {
      return res.status(400).json({
        success: false,
        message: "Un service est déjà en cours pour ce bar",
        data: activeShift
      });
    }
    
    // Créer un nouveau service
    const shift = await Shift.create({
      barId,
      startTime: new Date(),
      status: 'en_cours',
      notes
    });
    
    return res.status(201).json({
      success: true,
      message: "Service démarré avec succès",
      data: shift
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors du démarrage du service",
      error: error.message
    });
  }
};

// Obtenir tous les services
exports.getAllShifts = async (req, res) => {
  try {
    const shifts = await Shift.findAll({
      include: [Bar],
      order: [['startTime', 'DESC']]
    });
    
    return res.status(200).json({
      success: true,
      count: shifts.length,
      data: shifts
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des services",
      error: error.message
    });
  }
};

// Obtenir les services actifs
exports.getActiveShifts = async (req, res) => {
  try {
    const shifts = await Shift.findAll({
      where: {
        status: {
          [Op.ne]: 'terminé'
        }
      },
      include: [{
        model: Bar,
        include: [Company]
      }],
      order: [['startTime', 'DESC']]
    });
    
    return res.status(200).json({
      success: true,
      count: shifts.length,
      data: shifts
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des services actifs",
      error: error.message
    });
  }
};

// Obtenir les services d'un bar
exports.getShiftsByBar = async (req, res) => {
  try {
    const { barId } = req.params;
    
    // Vérifier si le bar existe
    const bar = await Bar.findByPk(barId);
    
    if (!bar) {
      return res.status(404).json({
        success: false,
        message: "Bar non trouvé"
      });
    }
    
    const shifts = await Shift.findAll({
      where: { barId },
      order: [['startTime', 'DESC']]
    });
    
    return res.status(200).json({
      success: true,
      count: shifts.length,
      data: shifts
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des services du bar",
      error: error.message
    });
  }
};

// Obtenir un service par son ID
exports.getShiftById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const shift = await Shift.findByPk(id, {
      include: [{
        model: Bar,
        include: [Company]
      }]
    });
    
    if (!shift) {
      return res.status(404).json({
        success: false,
        message: "Service non trouvé"
      });
    }
    
    return res.status(200).json({
      success: true,
      data: shift
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du service",
      error: error.message
    });
  }
};

// Terminer un service
exports.endShift = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    
    let shift = await Shift.findByPk(id);
    
    if (!shift) {
      return res.status(404).json({
        success: false,
        message: "Service non trouvé"
      });
    }
    
    if (shift.status === 'terminé') {
      return res.status(400).json({
        success: false,
        message: "Ce service est déjà terminé"
      });
    }
    
    shift = await shift.update({
      endTime: new Date(),
      status: 'terminé',
      notes: notes || shift.notes
    });
    
    return res.status(200).json({
      success: true,
      message: "Service terminé avec succès",
      data: shift
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la terminaison du service",
      error: error.message
    });
  }
};

// Mettre à jour le statut d'un service
exports.updateShiftStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    let shift = await Shift.findByPk(id);
    
    if (!shift) {
      return res.status(404).json({
        success: false,
        message: "Service non trouvé"
      });
    }
    
    if (!['en_cours', 'comptage', 'terminé'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Statut invalide"
      });
    }
    
    // Si le statut passe à terminé, définir la date de fin
    const endTime = status === 'terminé' ? new Date() : shift.endTime;
    
    shift = await shift.update({
      status,
      endTime,
      notes: notes || shift.notes
    });
    
    return res.status(200).json({
      success: true,
      message: "Statut du service mis à jour avec succès",
      data: shift
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du statut du service",
      error: error.message
    });
  }
};

// Initialiser les comptages d'un service
exports.initializeShiftCounts = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { shiftId } = req.params;
    
    // Vérifier si le service existe
    const shift = await Shift.findByPk(shiftId);
    
    if (!shift) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Service non trouvé"
      });
    }
    
    // Vérifier si des comptages existent déjà pour ce service
    const existingCounts = await ShiftCount.count({
      where: { shiftId }
    });
    
    if (existingCounts > 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Des comptages existent déjà pour ce service"
      });
    }
    
    // Récupérer tous les stocks du bar associé au service
    const stocks = await Stock.findAll({
      where: { barId: shift.barId },
      include: [{
        model: Format,
        include: [Product]
      }]
    });
    
    if (stocks.length === 0) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Aucun stock trouvé pour ce bar"
      });
    }
    
    // Créer un comptage initial pour chaque stock
    const shiftCounts = await Promise.all(
      stocks.map(stock => 
        ShiftCount.create({
          shiftId,
          stockId: stock.id,
          initialCount: stock.currentQuantity,
          finalCount: null,
          consumed: null,
          toRestock: null
        }, { transaction })
      )
    );
    
    // Mettre à jour le statut du service
    await shift.update({
      status: 'en_cours'
    }, { transaction });
    
    await transaction.commit();
    
    return res.status(201).json({
      success: true,
      message: "Comptages initialisés avec succès",
      count: shiftCounts.length,
      data: shiftCounts
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de l'initialisation des comptages du service",
      error: error.message
    });
  }
};

// Obtenir les comptages d'un service
exports.getShiftCounts = async (req, res) => {
  try {
    const { shiftId } = req.params;
    
    // Vérifier si le service existe
    const shift = await Shift.findByPk(shiftId);
    
    if (!shift) {
      return res.status(404).json({
        success: false,
        message: "Service non trouvé"
      });
    }
    
    // Récupérer tous les comptages du service avec détails des stocks
    const shiftCounts = await ShiftCount.findAll({
      where: { shiftId },
      include: [{
        model: Stock,
        include: [{
          model: Format,
          include: [Product]
        }, Bar]
      }],
      order: [[sequelize.literal('Stock.Format.Product.category'), 'ASC'], 
              [sequelize.literal('Stock.Format.Product.name'), 'ASC']]
    });
    
    // Organiser les comptages par catégorie de produit
    const countsByCategory = {};
    
    shiftCounts.forEach(count => {
      const category = count.Stock.Format.Product.category;
      const productName = count.Stock.Format.Product.name;
      const formatSize = count.Stock.Format.size;
      const formatUnit = count.Stock.Format.unit;
      
      if (!countsByCategory[category]) {
        countsByCategory[category] = [];
      }
      
      countsByCategory[category].push({
        id: count.id,
        stockId: count.stockId,
        productName,
        formatSize,
        formatUnit,
        initialCount: count.initialCount,
        finalCount: count.finalCount,
        consumed: count.consumed,
        toRestock: count.toRestock,
        needsRestock: count.toRestock > 0,
        notes: count.notes
      });
    });
    
    return res.status(200).json({
      success: true,
      count: shiftCounts.length,
      data: {
        shift,
        categories: Object.keys(countsByCategory).map(category => ({
          name: category,
          items: countsByCategory[category],
          count: countsByCategory[category].length
        }))
      }
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des comptages du service",
      error: error.message
    });
  }
};

// Mettre à jour un comptage de service
exports.updateShiftCount = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { shiftId, countId } = req.params;
    const { finalCount, notes } = req.body;
    
    // Vérifier si le service existe
    const shift = await Shift.findByPk(shiftId);
    
    if (!shift) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Service non trouvé"
      });
    }
    
    // Vérifier si le comptage existe
    let shiftCount = await ShiftCount.findOne({
      where: { id: countId, shiftId },
      include: [Stock]
    });
    
    if (!shiftCount) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Comptage non trouvé"
      });
    }
    
    // Calculer les quantités consommées et à réapprovisionner
    const consumed = shiftCount.initialCount - finalCount;
    const stock = await Stock.findByPk(shiftCount.stockId);
    const toRestock = Math.max(0, stock.idealQuantity - finalCount);
    
    // Mettre à jour le comptage
    shiftCount = await shiftCount.update({
      finalCount,
      consumed,
      toRestock,
      notes
    }, { transaction });
    
    // Mettre à jour le stock courant avec la valeur finale du comptage
    await stock.update({
      currentQuantity: finalCount
    }, { transaction });
    
    await transaction.commit();
    
    return res.status(200).json({
      success: true,
      message: "Comptage mis à jour avec succès",
      data: shiftCount
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du comptage",
      error: error.message
    });
  }
};

// Générer un rapport de service
exports.generateShiftReport = async (req, res) => {
  try {
    const { shiftId } = req.params;
    
    // Vérifier si le service existe
    const shift = await Shift.findByPk(shiftId, {
      include: [{
        model: Bar,
        include: [Company]
      }]
    });
    
    if (!shift) {
      return res.status(404).json({
        success: false,
        message: "Service non trouvé"
      });
    }
    
    // Récupérer tous les comptages du service
    const shiftCounts = await ShiftCount.findAll({
      where: { shiftId },
      include: [{
        model: Stock,
        include: [{
          model: Format,
          include: [Product]
        }]
      }]
    });
    
    // Vérifier que tous les comptages sont complets
    const incompleteCounts = shiftCounts.filter(count => count.finalCount === null);
    
    if (incompleteCounts.length > 0 && shift.status !== 'terminé') {
      return res.status(400).json({
        success: false,
        message: "Tous les comptages ne sont pas terminés",
        incompleteCounts: incompleteCounts.length
      });
    }
    
    // Calculer les statistiques générales
    const totalStocks = shiftCounts.length;
    const totalConsumed = shiftCounts.reduce((sum, count) => 
      sum + (count.consumed || 0), 0);
    const totalToRestock = shiftCounts.reduce((sum, count) => 
      sum + (count.toRestock || 0), 0);
    const itemsToRestock = shiftCounts.filter(count => 
      (count.toRestock || 0) > 0).length;
    
    // Organiser les comptages par catégorie
    const countsByCategory = {};
    
    shiftCounts.forEach(count => {
      const category = count.Stock.Format.Product.category;
      
      if (!countsByCategory[category]) {
        countsByCategory[category] = {
          items: [],
          consumedCount: 0,
          toRestockCount: 0
        };
      }
      
      countsByCategory[category].items.push({
        id: count.id,
        productName: count.Stock.Format.Product.name,
        formatSize: count.Stock.Format.size,
        formatUnit: count.Stock.Format.unit,
        initialCount: count.initialCount,
        finalCount: count.finalCount,
        consumed: count.consumed,
        toRestock: count.toRestock
      });
      
      if (count.consumed > 0) {
        countsByCategory[category].consumedCount++;
      }
      
      if (count.toRestock > 0) {
        countsByCategory[category].toRestockCount++;
      }
    });
    
    // Formater le rapport
    const startDate = new Date(shift.startTime).toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const endDate = shift.endTime ? new Date(shift.endTime).toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : 'En cours';
    
    const report = {
      shift: {
        id: shift.id,
        status: shift.status,
        startTime: startDate,
        endTime: endDate,
        duration: shift.endTime ? 
          Math.round((new Date(shift.endTime) - new Date(shift.startTime)) / (1000 * 60 * 60)) : 
          null
      },
      bar: {
        id: shift.Bar.id,
        name: shift.Bar.name,
        location: shift.Bar.location,
        company: shift.Bar.Company ? shift.Bar.Company.name : null
      },
      summary: {
        totalProducts: totalStocks,
        totalConsumed,
        totalToRestock,
        itemsToRestock,
        percentageToRestock: Math.round((itemsToRestock / totalStocks) * 100)
      },
      categories: Object.keys(countsByCategory).map(category => ({
        name: category,
        items: countsByCategory[category].items,
        count: countsByCategory[category].items.length,
        consumedCount: countsByCategory[category].consumedCount,
        toRestockCount: countsByCategory[category].toRestockCount
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
      message: "Erreur lors de la génération du rapport de service",
      error: error.message
    });
  }
}; 