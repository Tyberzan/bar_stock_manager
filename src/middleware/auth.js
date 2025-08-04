const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('CRITICAL ERROR: JWT_SECRET environment variable is not set!');
  console.error('Please set a strong JWT_SECRET in your environment variables.');
  process.exit(1);
}

// Middleware pour vérifier le token JWT
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Vérifier si l'en-tête Authorization est présent et commence par "Bearer"
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // Vérifier si le token existe
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Vous n'êtes pas autorisé à accéder à cette ressource"
      });
    }
    
    try {
      // Vérifier et décoder le token
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Ajouter l'utilisateur à la requête
      const user = await User.findByPk(decoded.id);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "L'utilisateur n'existe plus"
        });
      }
      
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: "Ce compte a été désactivé"
        });
      }
      
      req.user = {
        id: user.id,
        username: user.username,
        role: user.role,
        barId: user.barId
      };
      
      next();
      
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Token invalide ou expiré"
      });
    }
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur d'authentification",
      error: error.message
    });
  }
};

// Middleware pour restreindre l'accès aux rôles spécifiques
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Vous devez être connecté pour accéder à cette ressource"
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Vous n'avez pas les autorisations nécessaires pour effectuer cette action"
      });
    }
    
    next();
  };
}; 