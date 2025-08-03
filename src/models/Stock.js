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
  currentQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  minQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10,
    // Seuil d'alerte pour le réapprovisionnement
  },
  idealQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 30,
    // Quantité idéale à avoir en stock
  }
}, {
  timestamps: true
});

module.exports = Stock; 