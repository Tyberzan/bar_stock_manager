const { sequelize } = require('../src/config/database');

async function fixAdmin() {
  try {
    console.log('🔧 Correction de l\'utilisateur admin...');
    
    const User = require('../src/models/User');
    const Bar = require('../src/models/Bar');
    
    await sequelize.authenticate();
    console.log('✅ Connexion établie');
    
    // Supprimer l'ancien admin s'il existe
    const existingAdmin = await User.findOne({ where: { username: 'admin' } });
    if (existingAdmin) {
      await existingAdmin.destroy();
      console.log('🗑️  Ancien admin supprimé');
    }
    
    // Récupérer le premier bar
    const firstBar = await Bar.findOne();
    
    // Créer le nouvel admin (le mot de passe sera haché automatiquement par les hooks du modèle)
    const admin = await User.create({
      username: 'admin',
      password: 'admin123', // Sera haché automatiquement par le hook beforeCreate
      email: 'admin@legourmet.fr',
      role: 'admin',
      barId: firstBar ? firstBar.id : null
    });
    
    console.log('✅ Nouvel utilisateur admin créé avec succès !');
    console.log('📋 Identifiants :');
    console.log('   - Username: admin');
    console.log('   - Password: admin123');
    console.log('   - Email: admin@legourmet.fr');
    console.log('   - Role: admin');
    
    // Tester la vérification du mot de passe
    const isPasswordValid = await admin.checkPassword('admin123');
    console.log('🔍 Test de vérification du mot de passe:', isPasswordValid ? 'SUCCÈS' : 'ÉCHEC');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Exécuter
if (require.main === module) {
  fixAdmin()
    .then(() => {
      console.log('🎉 Admin corrigé ! Vous pouvez maintenant vous connecter avec admin/admin123');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Échec:', error);
      process.exit(1);
    });
}

module.exports = { fixAdmin }; 