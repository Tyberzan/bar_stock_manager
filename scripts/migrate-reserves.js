const { sequelize } = require('../src/config/database');

async function migrateReserves() {
  try {
    console.log('🔄 Début de la migration des réserves...');
    
    // Connexion à la base de données
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données établie');
    
    // Supprimer complètement la table Reserves si elle existe
    await sequelize.query('DROP TABLE IF EXISTS `Reserves`');
    console.log('🗑️  Ancienne table Reserves supprimée');
    
    // Supprimer la table ReserveStocks si elle existe (dépendance)
    await sequelize.query('DROP TABLE IF EXISTS `ReserveStocks`');
    console.log('🗑️  Ancienne table ReserveStocks supprimée');
    
    // Supprimer la table ReserveTransfers si elle existe (dépendance)
    await sequelize.query('DROP TABLE IF EXISTS `ReserveTransfers`');
    console.log('🗑️  Ancienne table ReserveTransfers supprimée');
    
    // Forcer la synchronisation pour recréer les tables avec la nouvelle structure
    await sequelize.sync({ force: true });
    console.log('🔄 Tables recréées avec la nouvelle structure');
    
    console.log('✅ Migration des réserves terminée avec succès !');
    console.log('📋 Nouvelles tables créées :');
    console.log('   - Reserves (avec companyId, name, type, etc.)');
    console.log('   - ReserveStocks (stocks dans chaque réserve)');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Exécuter la migration
if (require.main === module) {
  migrateReserves()
    .then(() => {
      console.log('🎉 Migration terminée avec succès !');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Échec de la migration:', error);
      process.exit(1);
    });
}

module.exports = { migrateReserves }; 