const { sequelize } = require('../src/config/database');

async function checkUsers() {
  try {
    console.log('🔍 Vérification des utilisateurs...');
    
    const User = require('../src/models/User');
    
    await sequelize.authenticate();
    console.log('✅ Connexion établie');
    
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'role', 'barId', 'createdAt']
    });
    
    console.log(`📊 ${users.length} utilisateur(s) trouvé(s) :`);
    
    users.forEach(user => {
      console.log(`   - ID: ${user.id}`);
      console.log(`     Username: ${user.username}`);
      console.log(`     Email: ${user.email}`);
      console.log(`     Role: ${user.role}`);
      console.log(`     Bar ID: ${user.barId}`);
      console.log(`     Créé le: ${user.createdAt}`);
      console.log('   ---');
    });
    
    if (users.length === 0) {
      console.log('⚠️  Aucun utilisateur trouvé !');
      console.log('💡 Exécutez: node scripts/create-admin.js');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await sequelize.close();
  }
}

// Exécuter
if (require.main === module) {
  checkUsers();
}

module.exports = { checkUsers }; 