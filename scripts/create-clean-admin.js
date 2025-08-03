const { sequelize } = require('../src/config/database');
const { User } = require('../src/models');
const bcrypt = require('bcrypt');

async function createCleanAdmin() {
  try {
    console.log('🔧 Création d\'un admin propre...');
    
    // Supprimer tous les utilisateurs admin existants
    await User.destroy({ where: { username: 'admin' } });
    await User.destroy({ where: { username: 'superadmin' } });
    
    console.log('🗑️ Anciens utilisateurs admin supprimés');
    
    // Créer un hash de mot de passe propre
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    console.log('🔑 Hash généré pour admin123');
    
    // Créer le nouvel utilisateur admin
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@barstock.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'System',
      role: 'admin'
    });
    
    console.log('✅ Utilisateur admin créé:', adminUser.username);
    
    // Créer également un superadmin
    const superHashedPassword = await bcrypt.hash('admin123', salt);
    const superUser = await User.create({
      username: 'superadmin',
      email: 'superadmin@barstock.com',
      password: superHashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'superuser'
    });
    
    console.log('✅ Utilisateur superadmin créé:', superUser.username);
    
    // Test immédiat
    console.log('\n🧪 Test de validation...');
    const testAdmin = await User.findOne({ where: { username: 'admin' } });
    const isValid = await bcrypt.compare('admin123', testAdmin.password);
    
    console.log(`✅ Test connexion admin: ${isValid ? 'SUCCÈS ✅' : 'ÉCHEC ❌'}`);
    
    if (isValid) {
      console.log('\n🎉 SUCCÈS ! Identifiants de connexion :');
      console.log('   👤 Username: admin');
      console.log('   🔑 Password: admin123');
      console.log('   🌐 URL: http://localhost:3000');
    } else {
      throw new Error('La validation du mot de passe a échoué');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

createCleanAdmin()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));