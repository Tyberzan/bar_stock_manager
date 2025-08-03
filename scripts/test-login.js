const axios = require('axios');

async function testLogin() {
  try {
    console.log('🔍 Test de connexion admin...');
    
    const response = await axios.post('http://localhost:3000/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Connexion réussie !');
    console.log('📋 Réponse du serveur :');
    console.log('   - Status:', response.status);
    console.log('   - Success:', response.data.success);
    console.log('   - Message:', response.data.message);
    console.log('   - Token présent:', !!response.data.token);
    console.log('   - Utilisateur:', response.data.user.username);
    console.log('   - Rôle:', response.data.user.role);
    
  } catch (error) {
    console.error('❌ Erreur de connexion :');
    if (error.response) {
      console.log('   - Status:', error.response.status);
      console.log('   - Message:', error.response.data.message);
      console.log('   - Data:', error.response.data);
    } else {
      console.log('   - Erreur:', error.message);
    }
  }
}

// Exécuter
if (require.main === module) {
  testLogin();
}

module.exports = { testLogin }; 