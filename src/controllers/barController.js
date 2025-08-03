const { Bar, Company } = require('../models');

// Créer un nouveau bar
exports.createBar = async (req, res) => {
  try {
    const { name, location, description, companyId } = req.body;
    
    // Vérifier si un bar avec ce nom existe déjà
    const existingBar = await Bar.findOne({ where: { name } });
    
    if (existingBar) {
      return res.status(400).json({
        success: false,
        message: "Un bar avec ce nom existe déjà"
      });
    }
    
    // Vérifier que l'entreprise existe si companyId est fourni
    if (companyId) {
      const company = await Company.findByPk(companyId);
      if (!company) {
        return res.status(400).json({
          success: false,
          message: "Entreprise non trouvée"
        });
      }
    }
    
    // Créer un nouveau bar
    const bar = await Bar.create({
      name,
      location,
      description,
      companyId: companyId || null,
      isActive: true
    });
    
    return res.status(201).json({
      success: true,
      message: "Bar créé avec succès",
      data: bar
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création du bar",
      error: error.message
    });
  }
};

// Obtenir tous les bars (avec filtrage selon les permissions)
exports.getAllBars = async (req, res) => {
  try {
    const { companyId } = req.query;
    const currentUser = req.user;
    

    
    let whereClause = {};
    
    // Filtrage selon le rôle de l'utilisateur connecté
    if (currentUser && currentUser.role !== 'superuser') {
      // Tous les rôles sauf superuser ne voient que les bars de leur entreprise
      if (currentUser.companyId) {
        whereClause.companyId = currentUser.companyId;
      } else {
        // Si l'utilisateur n'a pas d'entreprise assignée, ne renvoyer aucun bar
        return res.status(200).json({
          success: true,
          count: 0,
          data: []
        });
      }
    } else if (companyId) {
      // Pour les superusers, respecter le filtre companyId s'il est fourni
      whereClause.companyId = companyId;
    }
    
    const bars = await Bar.findAll({
      where: whereClause,
      include: [
        {
          model: Company,
          attributes: ['id', 'name']
        }
      ],
      order: [['name', 'ASC']]
    });
    
    return res.status(200).json({
      success: true,
      count: bars.length,
      data: bars
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des bars",
      error: error.message
    });
  }
};

// Obtenir un bar par son ID (avec vérification des permissions)
exports.getBarById = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    
    const bar = await Bar.findByPk(id, {
      include: [
        {
          model: Company,
          attributes: ['id', 'name']
        }
      ]
    });
    
    if (!bar) {
      return res.status(404).json({
        success: false,
        message: "Bar non trouvé"
      });
    }
    
    // Vérifier les permissions : seuls les superusers peuvent voir tout bar
    // Les autres ne peuvent voir que les bars de leur entreprise
    if (currentUser.role !== 'superuser' && currentUser.companyId !== bar.companyId) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé - Vous ne pouvez voir que les bars de votre entreprise"
      });
    }
    
    return res.status(200).json({
      success: true,
      data: bar
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du bar",
      error: error.message
    });
  }
};

// Mettre à jour un bar
exports.updateBar = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, description, isActive, companyId } = req.body;
    
    let bar = await Bar.findByPk(id);
    
    if (!bar) {
      return res.status(404).json({
        success: false,
        message: "Bar non trouvé"
      });
    }
    
    // Vérifier si le nouveau nom existe déjà pour un autre bar
    if (name && name !== bar.name) {
      const existingBar = await Bar.findOne({ where: { name } });
      
      if (existingBar) {
        return res.status(400).json({
          success: false,
          message: "Un bar avec ce nom existe déjà"
        });
      }
    }
    
    // Vérifier que l'entreprise existe si companyId est fourni
    if (companyId !== undefined && companyId !== null) {
      const company = await Company.findByPk(companyId);
      if (!company) {
        return res.status(400).json({
          success: false,
          message: "Entreprise non trouvée"
        });
      }
    }
    
    // Mettre à jour le bar
    bar = await bar.update({
      name: name || bar.name,
      location: location !== undefined ? location : bar.location,
      description: description !== undefined ? description : bar.description,
      companyId: companyId !== undefined ? companyId : bar.companyId,
      isActive: isActive !== undefined ? isActive : bar.isActive
    });
    
    return res.status(200).json({
      success: true,
      message: "Bar mis à jour avec succès",
      data: bar
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du bar",
      error: error.message
    });
  }
};

// Supprimer un bar
exports.deleteBar = async (req, res) => {
  try {
    const { id } = req.params;
    
    const bar = await Bar.findByPk(id);
    
    if (!bar) {
      return res.status(404).json({
        success: false,
        message: "Bar non trouvé"
      });
    }
    
    // Désactiver le bar au lieu de le supprimer
    await bar.update({ isActive: false });
    
    return res.status(200).json({
      success: true,
      message: "Bar désactivé avec succès"
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la désactivation du bar",
      error: error.message
    });
  }
}; 