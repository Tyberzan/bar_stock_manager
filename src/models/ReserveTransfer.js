const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ReserveTransfer = sequelize.define('ReserveTransfer', {
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
    }
  },
  stockId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Stocks',
      key: 'id'
    }
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
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  reserveQuantityBefore: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  reserveQuantityAfter: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  stockQuantityBefore: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  stockQuantityAfter: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  transferDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  transferredBy: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Utilisateur qui a effectué le transfert'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  transferType: {
    type: DataTypes.ENUM('restock', 'emergency', 'manual'),
    defaultValue: 'restock'
  }
}, {
  tableName: 'ReserveTransfers',
  timestamps: true,
  indexes: [
    {
      fields: ['reserveId']
    },
    {
      fields: ['stockId']
    },
    {
      fields: ['barId']
    },
    {
      fields: ['transferDate']
    }
  ]
});

module.exports = ReserveTransfer; 