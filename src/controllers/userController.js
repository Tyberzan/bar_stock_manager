const { User, Company, Bar, sequelize } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');

// Récupérer tous les utilisateurs (avec filtrage selon les permissions)
const getAllUsers = async (req, res) => {
  try {
    const currentUser = req.user || {};
    let whereClause = {};
    
    // Filtrage selon le rôle de l'utilisateur connecté
    if (currentUser.role === 'admin') {
      // Admin voit seulement les utilisateurs de son entreprise (multi-tenant)
      whereClause.companyId = currentUser.companyId;
    } else if (currentUser.role === 'manager') {
      // Manager ne voit que les utilisateurs de son entreprise avec rôle user
      whereClause = {
        companyId: currentUser.companyId,
        role: 'user'
      };
    } else if (currentUser.role === 'user') {
      // User ne peut voir que son propre profil
      whereClause.id = currentUser.id;
    }
    // superuser voit tout (pas de filtre)
    
    const users = await User.findAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Company,
          as: 'Company',
          attributes: ['id', 'name']
        },
        {
          model: Bar,
          as: 'Bar',
          attributes: ['id', 'name', 'location']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs',
      error: error.message
    });
  }
};

// Créer un nouvel utilisateur
const createUser = async (req, res) => {
  try {
    const currentUser = req.user;
    const { username, email, password, role, companyId, barId, firstName, lastName, phone } = req.body;
    
    // Vérifications des permissions
    if (currentUser.role === 'user') {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas les permissions pour créer des utilisateurs'
      });
    }
    
    if (currentUser.role === 'manager' && role !== 'user') {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez créer que des utilisateurs avec le rôle "user"'
      });
    }
    
    if (currentUser.role === 'admin' && role === 'superuser') {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez pas créer des superutilisateurs'
      });
    }
    
    // Validation des données
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nom d\'utilisateur, email et mot de passe sont requis'
      });
    }
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }]
      }
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Cet utilisateur ou cette adresse e-mail existe déjà'
      });
    }
    
    // Déterminer l'entreprise selon le rôle de l'utilisateur connecté
    let finalCompanyId = companyId;
    if (currentUser.role === 'admin' || currentUser.role === 'manager') {
      finalCompanyId = currentUser.companyId; // Force l'entreprise de l'admin/manager
    }
    
    // Créer l'utilisateur
    const user = await User.create({
      username,
      email,
      password,
      role: role || 'user',
      companyId: finalCompanyId,
      barId: barId || null,
      firstName,
      lastName,
      phone,
      isActive: true
    });
    
    // Récupérer l'utilisateur créé avec les relations
    const createdUser = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Company,
          as: 'Company',
          attributes: ['id', 'name']
        },
        {
          model: Bar,
          as: 'Bar',
          attributes: ['id', 'name', 'location']
        }
      ]
    });
    
    res.status(201).json({
      success: true,
      data: createdUser,
      message: 'Utilisateur créé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'utilisateur',
      error: error.message
    });
  }
};

// Mettre à jour un utilisateur
const updateUser = async (req, res) => {
  try {
    const currentUser = req.user;
    const { id } = req.params;
    const { username, email, role, companyId, barId, firstName, lastName, phone, isActive } = req.body;
    
    // Trouver l'utilisateur à modifier
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    // Vérifications des permissions
    if (currentUser.role === 'user' && currentUser.id !== parseInt(id)) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez modifier que votre propre profil'
      });
    }
    
    if (currentUser.role === 'admin' && user.companyId !== currentUser.companyId) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez modifier que les utilisateurs de votre entreprise'
      });
    }
    
    if (currentUser.role === 'manager' && (user.companyId !== currentUser.companyId || user.role !== 'user')) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez modifier que les utilisateurs de votre entreprise avec le rôle "user"'
      });
    }
    
    // Empêcher la modification du rôle par des utilisateurs non autorisés
    if (role && currentUser.role === 'user') {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez pas modifier votre rôle'
      });
    }
    
    // Mettre à jour l'utilisateur
    const updateData = {
      username: username || user.username,
      email: email || user.email,
      firstName: firstName !== undefined ? firstName : user.firstName,
      lastName: lastName !== undefined ? lastName : user.lastName,
      phone: phone !== undefined ? phone : user.phone
    };
    
    // Seuls superuser et admin peuvent modifier le rôle et l'entreprise
    if (currentUser.role === 'superuser') {
      updateData.role = role || user.role;
      updateData.companyId = companyId !== undefined ? companyId : user.companyId;
      updateData.isActive = isActive !== undefined ? isActive : user.isActive;
    } else if (currentUser.role === 'admin') {
      if (role && role !== 'superuser') {
        updateData.role = role;
      }
      updateData.isActive = isActive !== undefined ? isActive : user.isActive;
    }
    
    // Admin et manager peuvent assigner un bar
    if ((currentUser.role === 'admin' || currentUser.role === 'manager') && barId !== undefined) {
      updateData.barId = barId;
    }
    
    await user.update(updateData);
    
    // Récupérer l'utilisateur mis à jour
    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Company,
          as: 'Company',
          attributes: ['id', 'name']
        },
        {
          model: Bar,
          as: 'Bar',
          attributes: ['id', 'name', 'location']
        }
      ]
    });
    
    res.json({
      success: true,
      data: updatedUser,
      message: 'Utilisateur mis à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'utilisateur',
      error: error.message
    });
  }
};

// Changer le mot de passe
const changePassword = async (req, res) => {
  try {
    const currentUser = req.user;
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    
    // Vérifier que l'utilisateur peut changer ce mot de passe
    if (currentUser.role === 'user' && currentUser.id !== parseInt(id)) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez changer que votre propre mot de passe'
      });
    }
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    // Si c'est l'utilisateur qui change son propre mot de passe, vérifier l'ancien
    if (currentUser.id === parseInt(id)) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Mot de passe actuel requis'
        });
      }
      
      const isCurrentPasswordValid = await user.checkPassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Mot de passe actuel incorrect'
        });
      }
    }
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
      });
    }
    
    // Mettre à jour le mot de passe (sera haché automatiquement par les hooks)
    await user.update({ password: newPassword });
    
    res.json({
      success: true,
      message: 'Mot de passe changé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de mot de passe',
      error: error.message
    });
  }
};

// Supprimer un utilisateur (désactiver)
const deleteUser = async (req, res) => {
  try {
    const currentUser = req.user;
    const { id } = req.params;
    
    // Seuls superuser et admin peuvent supprimer
    if (currentUser.role === 'user' || currentUser.role === 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas les permissions pour supprimer des utilisateurs'
      });
    }
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    // Admin ne peut supprimer que les utilisateurs de son entreprise
    if (currentUser.role === 'admin' && user.companyId !== currentUser.companyId) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez supprimer que les utilisateurs de votre entreprise'
      });
    }
    
    // Empêcher la suppression de soi-même
    if (currentUser.id === parseInt(id)) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas supprimer votre propre compte'
      });
    }
    
    // Désactiver au lieu de supprimer
    await user.update({ isActive: false });
    
    res.json({
      success: true,
      message: 'Utilisateur désactivé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'utilisateur',
      error: error.message
    });
  }
};

// Obtenir les statistiques des utilisateurs
const getUserStats = async (req, res) => {
  try {
    const currentUser = req.user;
    let whereClause = {};
    
    // Filtrage selon le rôle
    if (currentUser.role === 'admin') {
      whereClause.companyId = currentUser.companyId;
    } else if (currentUser.role === 'manager') {
      whereClause = {
        companyId: currentUser.companyId,
        role: 'user'
      };
    } else if (currentUser.role === 'user') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }
    
    const stats = {
      total: await User.count({ where: whereClause }),
      active: await User.count({ where: { ...whereClause, isActive: true } }),
      inactive: await User.count({ where: { ...whereClause, isActive: false } }),
      byRole: {}
    };
    
    // Statistiques par rôle
    const roles = ['superuser', 'admin', 'manager', 'user'];
    for (const role of roles) {
      stats.byRole[role] = await User.count({ 
        where: { ...whereClause, role } 
      });
    }
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  changePassword,
  deleteUser,
  getUserStats
}; 