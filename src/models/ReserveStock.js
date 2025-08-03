const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ReserveStock = sequelize.define('ReserveStock', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  reserveId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Reserves',
      key: 'id'
    },
    comment: 'Référence vers la réserve'
  },
  formatId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Formats',
      key: 'id'
    },
    comment: 'Référence vers le format du produit'
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    },
    comment: 'Quantité actuelle en stock'
  },
  minQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10,
    comment: 'Quantité minimale (seuil d\'alerte)'
  },
  maxQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 100,
    comment: 'Quantité maximale (capacité)'
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Emplacement spécifique dans la réserve (étagère, zone, etc.)'
  },
  expirationDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date d\'expiration du lot'
  },
  batchNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Numéro de lot'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notes spécifiques à ce stock'
  },
  lastRestockDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date du dernier réapprovisionnement'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'ReserveStocks',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['reserveId', 'formatId'],
      name: 'unique_reserve_format'
    },
    {
      fields: ['reserveId']
    },
    {
      fields: ['formatId']
    },
    {
      fields: ['quantity']
    },
    {
      fields: ['expirationDate']
    }
  ]
});

module.exports = ReserveStock; 