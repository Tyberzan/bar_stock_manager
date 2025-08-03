const { Company, Bar } = require('../models');

// Créer une entreprise
exports.createCompany = async (req, res) => {
  try {
    const { name, address, phone, email } = req.body;
    
    const company = await Company.create({
      name,
      address,
      phone,
      email
    });
    
    return res.status(201).json({
      success: true,
      message: "Entreprise créée avec succès",
      data: company
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création de l'entreprise",
      error: error.message
    });
  }
};

// Obtenir toutes les entreprises (avec filtrage selon les permissions)
exports.getAllCompanies = async (req, res) => {
  try {
    const currentUser = req.user;
    let whereClause = {};
    
    // Filtrage selon le rôle de l'utilisateur connecté
    if (currentUser && currentUser.role !== 'superuser') {
      // Tous les rôles sauf superuser ne voient que leur entreprise
      if (currentUser.companyId) {
        whereClause.id = currentUser.companyId;
      } else {
        // Si l'utilisateur n'a pas d'entreprise assignée, ne renvoyer aucune entreprise
        return res.status(200).json({
          success: true,
          count: 0,
          data: []
        });
      }
    }
    // superuser voit toutes les entreprises (pas de filtre)
    
    const companies = await Company.findAll({
      where: whereClause,
      include: [
        {
          model: require('../models').Bar,
          as: 'Bars',
          attributes: ['id', 'name']
        }
      ],
      order: [['name', 'ASC']]
    });
    
    return res.status(200).json({
      success: true,
      count: companies.length,
      data: companies
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des entreprises",
      error: error.message
    });
  }
};

// Obtenir une entreprise par son ID (avec vérification des permissions)
exports.getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    
    // Vérifier les permissions : seuls les superusers peuvent voir toute entreprise
    // Les autres ne peuvent voir que leur propre entreprise
    if (currentUser.role !== 'superuser' && currentUser.companyId != id) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé - Vous ne pouvez voir que les informations de votre entreprise"
      });
    }
    
    const company = await Company.findByPk(id, {
      include: [
        {
          model: require('../models').Bar,
          as: 'Bars',
          attributes: ['id', 'name', 'location']
        }
      ]
    });
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Entreprise non trouvée"
      });
    }
    
    return res.status(200).json({
      success: true,
      data: company
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de l'entreprise",
      error: error.message
    });
  }
};

// Mettre à jour une entreprise
exports.updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, phone, email, isActive } = req.body;
    
    let company = await Company.findByPk(id);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Entreprise non trouvée"
      });
    }
    
    company = await company.update({
      name: name || company.name,
      address: address !== undefined ? address : company.address,
      phone: phone !== undefined ? phone : company.phone,
      email: email !== undefined ? email : company.email,
      isActive: isActive !== undefined ? isActive : company.isActive
    });
    
    return res.status(200).json({
      success: true,
      message: "Entreprise mise à jour avec succès",
      data: company
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de l'entreprise",
      error: error.message
    });
  }
};

// Supprimer une entreprise
exports.deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    
    const company = await Company.findByPk(id);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Entreprise non trouvée"
      });
    }
    
    await company.destroy();
    
    return res.status(200).json({
      success: true,
      message: "Entreprise supprimée avec succès"
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de l'entreprise",
      error: error.message
    });
  }
};

// Obtenir tous les bars d'une entreprise
exports.getCompanyBars = async (req, res) => {
  try {
    const { id } = req.params;
    
    const company = await Company.findByPk(id);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Entreprise non trouvée"
      });
    }
    
    const bars = await Bar.findAll({
      where: { companyId: id },
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
      message: "Erreur lors de la récupération des bars de l'entreprise",
      error: error.message
    });
  }
}; 