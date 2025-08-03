const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StockHistory = sequelize.define('StockHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
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
  previousQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  newQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  consumedQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    // Calculé automatiquement: previousQuantity - newQuantity
  },
  shiftDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  shiftName: {
    type: DataTypes.STRING,
    allowNull: true,
    // Par exemple: 'Matin', 'Après-midi', 'Soir', etc.
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
}, {
  timestamps: true
});

module.exports = StockHistory; 