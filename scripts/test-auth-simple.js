const http = require('http');

function testLogin() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      username: 'admin',
      password: 'admin123'
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('🔍 Test de connexion admin...');
        console.log('📋 Réponse du serveur :');
        console.log('   - Status:', res.statusCode);
        console.log('   - Headers:', res.headers);
        
        try {
          const jsonData = JSON.parse(data);
          console.log('   - Success:', jsonData.success);
          console.log('   - Message:', jsonData.message);
          console.log('   - Token présent:', !!jsonData.token);
          
          if (jsonData.user) {
            console.log('   - Utilisateur:', jsonData.user.username);
            console.log('   - Rôle:', jsonData.user.role);
          }
          
          if (res.statusCode === 200 && jsonData.success) {
            console.log('✅ Connexion réussie !');
          } else {
            console.log('❌ Connexion échouée');
          }
          
          resolve(jsonData);
        } catch (error) {
          console.log('   - Réponse brute:', data);
          console.error('❌ Erreur parsing JSON:', error);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Erreur de connexion:', error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Exécuter le test
if (require.main === module) {
  testLogin()
    .then(() => {
      console.log('🎉 Test terminé');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test échoué:', error);
      process.exit(1);
    });
}

module.exports = { testLogin }; 