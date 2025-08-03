const { Product, Format } = require('../models');

// Créer un nouveau produit
exports.createProduct = async (req, res) => {
  try {
    const { name, brand, category, notes } = req.body;
    
    // Créer un nouveau produit
    const product = await Product.create({
      name,
      brand,
      category,
      notes,
      isActive: true
    });
    
    return res.status(201).json({
      success: true,
      message: "Produit créé avec succès",
      data: product
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création du produit",
      error: error.message
    });
  }
};

// Obtenir tous les produits
exports.getAllProducts = async (req, res) => {
  try {
    const query = {};
    
    // Filtre par catégorie si spécifié
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    // Filtre par état actif/inactif si spécifié
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }
    
    const products = await Product.findAll({
      where: query,
      include: [Format],
      order: [['name', 'ASC']]
    });
    
    return res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des produits",
      error: error.message
    });
  }
};

// Obtenir un produit par son ID
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findByPk(id, {
      include: [Format]
    });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Produit non trouvé"
      });
    }
    
    return res.status(200).json({
      success: true,
      data: product
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du produit",
      error: error.message
    });
  }
};

// Mettre à jour un produit
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, brand, category, notes, isActive } = req.body;
    
    let product = await Product.findByPk(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Produit non trouvé"
      });
    }
    
    // Mettre à jour le produit
    product = await product.update({
      name: name || product.name,
      brand: brand !== undefined ? brand : product.brand,
      category: category || product.category,
      notes: notes !== undefined ? notes : product.notes,
      isActive: isActive !== undefined ? isActive : product.isActive
    });
    
    return res.status(200).json({
      success: true,
      message: "Produit mis à jour avec succès",
      data: product
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du produit",
      error: error.message
    });
  }
};

// Supprimer un produit
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findByPk(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Produit non trouvé"
      });
    }
    
    // Désactiver le produit au lieu de le supprimer
    await product.update({ isActive: false });
    
    return res.status(200).json({
      success: true,
      message: "Produit désactivé avec succès"
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la désactivation du produit",
      error: error.message
    });
  }
}; 