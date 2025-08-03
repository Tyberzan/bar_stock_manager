const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Stock = sequelize.define('Stock', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  barId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Bars',
      key: 'id'
    }
  },
  formatId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Formats',
      key: 'id'
    }
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Products',
      key: 'id'
    }
  },
  currentQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  minThreshold: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10,
    // Seuil d'alerte pour le réapprovisionnement
  },
  maxThreshold: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 30,
    // Quantité maximale recommandée en stock
  }
}, {
  timestamps: true
});

module.exports = Stock; 