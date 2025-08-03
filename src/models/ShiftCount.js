const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ShiftCount = sequelize.define('ShiftCount', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  shiftId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Shifts',
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
  initialCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  finalCount: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  consumed: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  toRestock: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = ShiftCount; 