const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Reserve = sequelize.define('Reserve', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Companies',
      key: 'id'
    },
    comment: 'Entreprise propriétaire de cette réserve'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Nom de la réserve (ex: Réserve Frigorifique 1)'
  },
  type: {
    type: DataTypes.ENUM,
    values: ['frigorifique', 'sec', 'congelateur', 'cave', 'bar', 'autre'],
    allowNull: false,
    defaultValue: 'sec',
    comment: 'Type de stockage de la réserve'
  },
  temperature: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Température de stockage (ex: -40°C, +4°C, ambiante)'
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Capacité maximale de la réserve en unités'
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Emplacement physique (conteneur 1, cave, etc.)'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Description détaillée de la réserve'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'Reserves',
  timestamps: true,
  indexes: [
    {
      fields: ['companyId']
    },
    {
      fields: ['type']
    },
    {
      fields: ['isActive']
    }
  ]
});

module.exports = Reserve; 