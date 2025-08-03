const { sequelize } = require('../src/config/database');
const { User } = require('../src/models');
const bcrypt = require('bcrypt');

async function fixAdminCredentials() {
  try {
    console.log('🔧 Correction des identifiants admin...');
    
    // Vérifier si un utilisateur "admin" existe déjà
    let adminUser = await User.findOne({ where: { username: 'admin' } });
    
    if (adminUser) {
      console.log('👤 Utilisateur "admin" trouvé, mise à jour du mot de passe...');
      
      // Mettre à jour le mot de passe
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await adminUser.update({
        password: hashedPassword,
        email: 'admin@barstock.com',
        firstName: 'Admin',
        lastName: 'System',
        role: 'admin'
      });
      
      console.log('✅ Utilisateur "admin" mis à jour avec succès');
    } else {
      console.log('👤 Création d\'un nouvel utilisateur "admin"...');
      
      // Créer un nouvel utilisateur admin
      const hashedPassword = await bcrypt.hash('admin123', 10);
      adminUser = await User.create({
        username: 'admin',
        email: 'admin@barstock.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'System',
        role: 'admin'
      });
      
      console.log('✅ Utilisateur "admin" créé avec succès');
    }
    
    // Vérifier si un superadmin existe, sinon le créer
    let superAdmin = await User.findOne({ where: { username: 'superadmin' } });
    
    if (!superAdmin) {
      console.log('👤 Création d\'un utilisateur "superadmin"...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        username: 'superadmin',
        email: 'superadmin@barstock.com',
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'superuser'
      });
      console.log('✅ Utilisateur "superadmin" créé avec succès');
    } else {
      console.log('👤 Mise à jour du mot de passe superadmin...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await superAdmin.update({ password: hashedPassword });
      console.log('✅ Mot de passe superadmin mis à jour');
    }
    
    console.log('\n🔑 Identifiants de connexion disponibles :');
    console.log('   - Username: admin     | Password: admin123');
    console.log('   - Username: superadmin | Password: admin123');
    console.log('\n🌐 Accès: http://localhost:3000');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

// Test de connexion avec les nouveaux identifiants
async function testLogin() {
  try {
    console.log('\n🧪 Test de connexion...');
    
    const adminUser = await User.findOne({ where: { username: 'admin' } });
    if (adminUser) {
      const isValidPassword = await bcrypt.compare('admin123', adminUser.password);
      console.log(`✅ Test admin: ${isValidPassword ? 'SUCCÈS' : 'ÉCHEC'}`);
    }
    
    const superUser = await User.findOne({ where: { username: 'superadmin' } });
    if (superUser) {
      const isValidPassword = await bcrypt.compare('admin123', superUser.password);
      console.log(`✅ Test superadmin: ${isValidPassword ? 'SUCCÈS' : 'ÉCHEC'}`);
    }
    
  } catch (error) {
    console.error('❌ Erreur test:', error);
  }
}

// Exécuter la correction
fixAdminCredentials()
  .then(() => testLogin())
  .then(() => {
    console.log('\n🎉 Correction terminée avec succès !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });