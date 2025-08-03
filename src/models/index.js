const { sequelize } = require('../config/database');
const Bar = require('./Bar');
const Product = require('./Product');
const Format = require('./Format');
const Stock = require('./Stock');
const StockHistory = require('./StockHistory');
const User = require('./User');
const Company = require('./Company');
const Shift = require('./Shift');
const ShiftCount = require('./ShiftCount');
const Reserve = require('./Reserve');
const ReserveStock = require('./ReserveStock');
const ReserveTransfer = require('./ReserveTransfer');

// Définir les relations entre les modèles
// Company <-> Bar (une entreprise peut avoir plusieurs bars)
Company.hasMany(Bar, { foreignKey: 'companyId', onDelete: 'SET NULL' });
Bar.belongsTo(Company, { foreignKey: 'companyId' });

// Product <-> Format (un produit peut avoir plusieurs formats)
Product.hasMany(Format, { foreignKey: 'productId', onDelete: 'CASCADE' });
Format.belongsTo(Product, { foreignKey: 'productId' });

// Bar <-> Stock (un bar a plusieurs stocks)
Bar.hasMany(Stock, { foreignKey: 'barId', onDelete: 'CASCADE' });
Stock.belongsTo(Bar, { foreignKey: 'barId' });

// Format <-> Stock (un format peut être stocké dans plusieurs bars)
Format.hasMany(Stock, { foreignKey: 'formatId', onDelete: 'CASCADE' });
Stock.belongsTo(Format, { foreignKey: 'formatId' });

// Stock <-> StockHistory (un stock a un historique)
Stock.hasMany(StockHistory, { foreignKey: 'stockId', onDelete: 'CASCADE' });
StockHistory.belongsTo(Stock, { foreignKey: 'stockId' });

// Bar <-> StockHistory (un bar a un historique de stock)
Bar.hasMany(StockHistory, { foreignKey: 'barId', onDelete: 'CASCADE' });
StockHistory.belongsTo(Bar, { foreignKey: 'barId' });

// Company <-> User (une entreprise peut avoir plusieurs utilisateurs)
Company.hasMany(User, { foreignKey: 'companyId', onDelete: 'SET NULL' });
User.belongsTo(Company, { foreignKey: 'companyId', as: 'Company' });

// Bar <-> User (un bar peut avoir plusieurs utilisateurs)
Bar.hasMany(User, { foreignKey: 'barId', onDelete: 'SET NULL' });
User.belongsTo(Bar, { foreignKey: 'barId', as: 'Bar' });

// Bar <-> Shift (un bar a plusieurs services)
Bar.hasMany(Shift, { foreignKey: 'barId', onDelete: 'CASCADE' });
Shift.belongsTo(Bar, { foreignKey: 'barId' });

// Shift <-> ShiftCount (un service a plusieurs comptages)
Shift.hasMany(ShiftCount, { foreignKey: 'shiftId', onDelete: 'CASCADE' });
ShiftCount.belongsTo(Shift, { foreignKey: 'shiftId' });

// Stock <-> ShiftCount (un stock est comptabilisé dans plusieurs services)
Stock.hasMany(ShiftCount, { foreignKey: 'stockId', onDelete: 'CASCADE' });
ShiftCount.belongsTo(Stock, { foreignKey: 'stockId' });

// Company <-> Reserve (une entreprise peut avoir plusieurs réserves)
Company.hasMany(Reserve, { foreignKey: 'companyId', onDelete: 'CASCADE' });
Reserve.belongsTo(Company, { foreignKey: 'companyId' });

// Reserve <-> ReserveStock (une réserve a plusieurs stocks)
Reserve.hasMany(ReserveStock, { foreignKey: 'reserveId', onDelete: 'CASCADE' });
ReserveStock.belongsTo(Reserve, { foreignKey: 'reserveId' });

// Format <-> ReserveStock (un format peut être stocké dans plusieurs réserves)
Format.hasMany(ReserveStock, { foreignKey: 'formatId', onDelete: 'CASCADE' });
ReserveStock.belongsTo(Format, { foreignKey: 'formatId' });

// Reserve <-> ReserveTransfer (une réserve a plusieurs transferts)
Reserve.hasMany(ReserveTransfer, { foreignKey: 'reserveId', onDelete: 'CASCADE' });
ReserveTransfer.belongsTo(Reserve, { foreignKey: 'reserveId' });

// Stock <-> ReserveTransfer (un stock peut recevoir plusieurs transferts)
Stock.hasMany(ReserveTransfer, { foreignKey: 'stockId', onDelete: 'CASCADE' });
ReserveTransfer.belongsTo(Stock, { foreignKey: 'stockId' });

// Bar <-> ReserveTransfer (un bar reçoit des transferts)
Bar.hasMany(ReserveTransfer, { foreignKey: 'barId', onDelete: 'CASCADE' });
ReserveTransfer.belongsTo(Bar, { foreignKey: 'barId' });

// Format <-> ReserveTransfer (un format peut être transféré)
Format.hasMany(ReserveTransfer, { foreignKey: 'formatId', onDelete: 'CASCADE' });
ReserveTransfer.belongsTo(Format, { foreignKey: 'formatId' });

// Export des modèles
module.exports = {
  sequelize,
  Bar,
  Product,
  Format,
  Stock,
  StockHistory,
  User,
  Company,
  Shift,
  ShiftCount,
  Reserve,
  ReserveStock,
  ReserveTransfer
}; 