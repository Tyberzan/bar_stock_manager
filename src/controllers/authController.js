const jwt = require('jsonwebtoken');
const { User, Company, Bar, sequelize } = require('../models');
const { Op } = require('sequelize');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('CRITICAL ERROR: JWT_SECRET environment variable is not set!');
  console.error('Please set a strong JWT_SECRET in your environment variables.');
  process.exit(1);
}
const JWT_EXPIRES_IN = '24h';

// Inscription d'un nouvel utilisateur
exports.register = async (req, res) => {
  try {
    const { username, email, password, role, barId, companyCode, firstName, lastName } = req.body;
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ 
      where: { 
        [Op.or]: [{ username }, { email }] 
      } 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: "Cet utilisateur ou cette adresse e-mail existe déjà." 
      });
    }

    let companyId = null;

    // Si un code d'entreprise est fourni, trouver l'entreprise correspondante
    if (companyCode) {
      const company = await Company.findOne({
        where: { inviteCode: companyCode.toUpperCase() }
      });

      if (!company) {
        return res.status(400).json({
          success: false,
          message: "Code d'entreprise invalide ou entreprise non trouvée."
        });
      }

      companyId = company.id;
    }
    
    // Créer un nouvel utilisateur (le mot de passe sera haché par les hooks du modèle)
    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName,
      role: role || 'user',
      companyId,
      barId: barId || null
    });
    
    // Ne pas renvoyer le mot de passe dans la réponse
    user.password = undefined;
    
    return res.status(201).json({
      success: true,
      message: companyCode ? "Utilisateur créé et ajouté à l'entreprise avec succès" : "Utilisateur créé avec succès",
      data: user
    });
    
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création de l'utilisateur",
      error: error.message
    });
  }
};

// Connexion d'un utilisateur
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ 
      where: { username },
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
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Identifiants invalides"
      });
    }
    
    // Vérifier si l'utilisateur est actif
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Ce compte a été désactivé"
      });
    }
    
    // Vérifier le mot de passe
    const isPasswordValid = await user.checkPassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Identifiants invalides"
      });
    }
    
    // Mettre à jour la date de dernière connexion
    await user.update({ lastLogin: new Date() });
    
    // Générer un token JWT avec toutes les informations nécessaires
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role, 
        companyId: user.companyId,
        barId: user.barId 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    // Ne pas renvoyer le mot de passe dans la réponse
    user.password = undefined;
    
    return res.status(200).json({
      success: true,
      message: "Connexion réussie",
      token,
      user
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la connexion",
      error: error.message
    });
  }
};

// Inscription d'un admin avec création d'entreprise
exports.registerWithCompany = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { username, email, password, firstName, lastName, company } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ 
      where: { 
        [Op.or]: [{ username }, { email }] 
      } 
    });
    
    if (existingUser) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false, 
        message: "Cet utilisateur ou cette adresse e-mail existe déjà." 
      });
    }

    // Vérifier si l'entreprise existe déjà
    if (company && company.name) {
      const existingCompany = await Company.findOne({
        where: { name: company.name }
      });
      
      if (existingCompany) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Une entreprise avec ce nom existe déjà."
        });
      }
    }

    // Créer l'entreprise d'abord
    const newCompany = await Company.create({
      name: company.name,
      email: company.email || email,
      address: company.address,
      phone: company.phone,
      isActive: true,
      // Générer un code d'invitation unique
      inviteCode: crypto.randomBytes(8).toString('hex').toUpperCase()
    }, { transaction });

    // Créer l'utilisateur admin lié à cette entreprise
    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName,
      role: 'admin',
      companyId: newCompany.id,
      isActive: true
    }, { transaction });

    await transaction.commit();

    // Ne pas renvoyer le mot de passe dans la réponse
    user.password = undefined;
    
    return res.status(201).json({
      success: true,
      message: "Entreprise et compte administrateur créés avec succès !",
      data: {
        user,
        company: {
          id: newCompany.id,
          name: newCompany.name,
          inviteCode: newCompany.inviteCode
        }
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('Erreur lors de la création de l\'entreprise et de l\'utilisateur:', error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création de l'entreprise et du compte",
      error: error.message
    });
  }
};

// Obtenir le profil de l'utilisateur connecté
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }
    
    return res.status(200).json({
      success: true,
      data: user
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du profil",
      error: error.message
    });
  }
}; 