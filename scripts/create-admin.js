const { sequelize } = require('../src/config/database');
const bcrypt = require('bcrypt');

async function createAdmin() {
  try {
    console.log('🔧 Création de l\'utilisateur admin...');
    
    // Importer le modèle User
    const User = require('../src/models/User');
    const Bar = require('../src/models/Bar');
    
    // Connecter à la base de données
    await sequelize.authenticate();
    console.log('✅ Connexion établie');
    
    // Vérifier s'il y a déjà un admin
    const existingAdmin = await User.findOne({ where: { username: 'admin' } });
    
    if (existingAdmin) {
      console.log('⚠️  L\'utilisateur admin existe déjà');
      
      // Mettre à jour le mot de passe au cas où
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await existingAdmin.update({ password: hashedPassword });
      console.log('🔄 Mot de passe admin mis à jour');
    } else {
      // Récupérer le premier bar pour l'associer à l'admin
      const firstBar = await Bar.findOne();
      
      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      // Créer l'utilisateur admin
      const admin = await User.create({
        username: 'admin',
        password: hashedPassword,
        email: 'admin@legourmet.fr',
        role: 'admin',
        barId: firstBar ? firstBar.id : null
      });
      
      console.log('✅ Utilisateur admin créé avec succès !');
      console.log('📋 Identifiants :');
      console.log('   - Username: admin');
      console.log('   - Password: admin123');
      console.log('   - Email: admin@legourmet.fr');
      console.log('   - Role: admin');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'admin:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Exécuter
if (require.main === module) {
  createAdmin()
    .then(() => {
      console.log('🎉 Admin créé ! Vous pouvez maintenant vous connecter avec admin/admin123');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Échec:', error);
      process.exit(1);
    });
}

module.exports = { createAdmin }; 