const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Format = sequelize.define('Format', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Products',
      key: 'id'
    }
  },
  size: {
    type: DataTypes.STRING,
    allowNull: false,
    // Par exemple: '33cl', '75cl', '1L', etc.
  },
  unit: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'cl',
    // Par exemple: 'cl', 'L', 'bouteille', 'canette', etc.
  },
  volume: {
    type: DataTypes.FLOAT,
    allowNull: false,
    // Volume en cl (par exemple: 33, 75, 100, etc.)
  },
  packaging: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'bouteille',
    // Par exemple: 'verre', 'canette', 'bouteille', 'fût', 'bag-in-box', etc.
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  }
}, {
  timestamps: true
});

module.exports = Format; 