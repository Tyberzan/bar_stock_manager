const { sequelize } = require('../src/config/database');
const bcrypt = require('bcrypt');

async function createSimpleAdmin() {
  try {
    console.log('🔧 Création simple d\'un admin...');
    
    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash('admin123', 10);
    console.log('🔑 Mot de passe hashé généré');
    
    // Supprimer l'ancien admin s'il existe (requête SQL directe)
    await sequelize.query(`DELETE FROM Users WHERE username = 'admin'`);
    console.log('🗑️ Ancien admin supprimé');
    
    // Insérer le nouvel admin (requête SQL directe)
    const [results] = await sequelize.query(`
      INSERT INTO Users (username, email, password, firstName, lastName, role, createdAt, updatedAt)
      VALUES ('admin', 'admin@barstock.com', ?, 'Admin', 'System', 'admin', datetime('now'), datetime('now'))
    `, {
      replacements: [hashedPassword]
    });
    
    console.log('✅ Nouvel admin créé avec ID:', results);
    
    // Vérifier la création
    const [adminCheck] = await sequelize.query(`
      SELECT id, username, email, role FROM Users WHERE username = 'admin'
    `);
    
    if (adminCheck.length > 0) {
      console.log('✅ Admin vérifié:', adminCheck[0]);
      
      // Test du mot de passe
      const [passwordCheck] = await sequelize.query(`
        SELECT password FROM Users WHERE username = 'admin'
      `);
      
      const isValid = await bcrypt.compare('admin123', passwordCheck[0].password);
      console.log(`🧪 Test mot de passe: ${isValid ? 'SUCCÈS ✅' : 'ÉCHEC ❌'}`);
      
      if (isValid) {
        console.log('\n🎉 PARFAIT ! Identifiants de connexion :');
        console.log('   👤 Username: admin');
        console.log('   🔑 Password: admin123');
        console.log('   🌐 URL: http://localhost:3000');
        console.log('\n📋 Votre collègue peut maintenant se connecter !');
      }
    } else {
      throw new Error('Admin non trouvé après création');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    throw error;
  }
}

createSimpleAdmin()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));