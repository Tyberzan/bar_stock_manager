const { Format, Product } = require('../models');

// Créer un nouveau format pour un produit
exports.createFormat = async (req, res) => {
  try {
    const { productId, size, unit, volume, packaging } = req.body;
    
    // Si un productId est fourni, vérifier si le produit existe
    if (productId) {
      const product = await Product.findByPk(productId);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Produit non trouvé"
        });
      }
      
      // Vérifier si ce format existe déjà pour ce produit
      const existingFormat = await Format.findOne({
        where: {
          productId,
          size,
          unit,
          packaging: packaging || 'bouteille'
        }
      });
      
      if (existingFormat) {
        return res.status(400).json({
          success: false,
          message: "Ce format existe déjà pour ce produit"
        });
      }
    }
    
    // Créer un nouveau format (avec ou sans productId)
    const format = await Format.create({
      productId: productId || null, // Permettre null pour les formats globaux
      size,
      unit,
      volume,
      packaging: packaging || 'bouteille',
      isActive: true
    });
    
    return res.status(201).json({
      success: true,
      message: "Format créé avec succès",
      data: format
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création du format",
      error: error.message
    });
  }
};

// Obtenir tous les formats
exports.getAllFormats = async (req, res) => {
  try {
    const query = {};
    
    // Filtre par productId si spécifié
    if (req.query.productId) {
      query.productId = req.query.productId;
    }
    
    // Filtre par état actif/inactif si spécifié
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }
    
    const formats = await Format.findAll({
      where: query,
      include: [Product],
      order: [['size', 'ASC']]
    });
    
    return res.status(200).json({
      success: true,
      count: formats.length,
      data: formats
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des formats",
      error: error.message
    });
  }
};

// Obtenir un format par son ID
exports.getFormatById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const format = await Format.findByPk(id, {
      include: [Product]
    });
    
    if (!format) {
      return res.status(404).json({
        success: false,
        message: "Format non trouvé"
      });
    }
    
    return res.status(200).json({
      success: true,
      data: format
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du format",
      error: error.message
    });
  }
};

// Mettre à jour un format
exports.updateFormat = async (req, res) => {
  try {
    const { id } = req.params;
    const { size, unit, volume, packaging, isActive } = req.body;
    
    let format = await Format.findByPk(id);
    
    if (!format) {
      return res.status(404).json({
        success: false,
        message: "Format non trouvé"
      });
    }
    
    // Vérifier si le nouveau format existe déjà pour ce produit
    if ((size && size !== format.size) || (unit && unit !== format.unit) || (packaging && packaging !== format.packaging)) {
      const existingFormat = await Format.findOne({
        where: {
          productId: format.productId,
          size: size || format.size,
          unit: unit || format.unit,
          packaging: packaging || format.packaging
        }
      });
      
      if (existingFormat && existingFormat.id !== format.id) {
        return res.status(400).json({
          success: false,
          message: "Ce format existe déjà pour ce produit"
        });
      }
    }
    
    // Mettre à jour le format
    format = await format.update({
      size: size || format.size,
      unit: unit || format.unit,
      volume: volume !== undefined ? volume : format.volume,
      packaging: packaging || format.packaging,
      isActive: isActive !== undefined ? isActive : format.isActive
    });
    
    return res.status(200).json({
      success: true,
      message: "Format mis à jour avec succès",
      data: format
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du format",
      error: error.message
    });
  }
};

// Supprimer un format
exports.deleteFormat = async (req, res) => {
  try {
    const { id } = req.params;
    
    const format = await Format.findByPk(id);
    
    if (!format) {
      return res.status(404).json({
        success: false,
        message: "Format non trouvé"
      });
    }
    
    // Désactiver le format au lieu de le supprimer
    await format.update({ isActive: false });
    
    return res.status(200).json({
      success: true,
      message: "Format désactivé avec succès"
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la désactivation du format",
      error: error.message
    });
  }
}; 