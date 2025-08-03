const { User, sequelize } = require('../src/models');
const bcrypt = require('bcrypt');

async function createSuperUser() {
  try {
    // Connexion à la base de données
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données établie');

    // Synchroniser les modèles
    await sequelize.sync({ alter: true });
    console.log('✅ Base de données synchronisée');

    // Vérifier si un superutilisateur existe déjà
    const existingSuperUser = await User.findOne({
      where: { role: 'superuser' }
    });

    if (existingSuperUser) {
      console.log('ℹ️  Un superutilisateur existe déjà:', existingSuperUser.username);
      return;
    }

    // Créer le superutilisateur
    const superUser = await User.create({
      username: 'superadmin',
      email: 'superadmin@barstock.com',
      password: 'superadmin123',
      role: 'superuser',
      firstName: 'Super',
      lastName: 'Administrateur',
      isActive: true,
      companyId: null, // Superuser n'est lié à aucune entreprise
      barId: null
    });

    console.log('🎉 Superutilisateur créé avec succès !');
    console.log('📋 Informations de connexion :');
    console.log('   Username: superadmin');
    console.log('   Password: superadmin123');
    console.log('   Email: superadmin@barstock.com');
    console.log('   Rôle: superuser');

    // Créer également un admin de test pour PoneyClub (si n'existe pas)
    const existingAdmin = await User.findOne({ where: { username: 'admin' } });
    if (!existingAdmin) {
      const adminUser = await User.create({
        username: 'admin',
        email: 'admin@poneyclub.com',
        password: 'admin123',
        role: 'admin',
        firstName: 'Admin',
        lastName: 'PoneyClub',
        isActive: true,
        companyId: 2, // PoneyClub
        barId: null
      });

      console.log('🎉 Administrateur PoneyClub créé avec succès !');
      console.log('📋 Informations de connexion :');
      console.log('   Username: admin');
      console.log('   Password: admin123');
      console.log('   Email: admin@poneyclub.com');
      console.log('   Rôle: admin (PoneyClub)');
    } else {
      console.log('ℹ️  Administrateur admin existe déjà');
    }

    // Créer un manager de test (si n'existe pas)
    const existingManager = await User.findOne({ where: { username: 'manager' } });
    if (!existingManager) {
      const managerUser = await User.create({
        username: 'manager',
        email: 'manager@poneyclub.com',
        password: 'manager123',
        role: 'manager',
        firstName: 'Manager',
        lastName: 'PoneyClub',
        isActive: true,
        companyId: 2, // PoneyClub
        barId: null
      });

      console.log('🎉 Manager PoneyClub créé avec succès !');
      console.log('📋 Informations de connexion :');
      console.log('   Username: manager');
      console.log('   Password: manager123');
      console.log('   Email: manager@poneyclub.com');
      console.log('   Rôle: manager (PoneyClub)');
    } else {
      console.log('ℹ️  Manager manager existe déjà');
    }

    // Créer un utilisateur basique (si n'existe pas)
    const existingUser = await User.findOne({ where: { username: 'user' } });
    if (!existingUser) {
      const basicUser = await User.create({
        username: 'user',
        email: 'user@poneyclub.com',
        password: 'user123',
        role: 'user',
        firstName: 'Utilisateur',
        lastName: 'Bar',
        isActive: true,
        companyId: 2, // PoneyClub
        barId: 6 // Bar Terrasse
      });

      console.log('🎉 Utilisateur basique créé avec succès !');
      console.log('📋 Informations de connexion :');
      console.log('   Username: user');
      console.log('   Password: user123');
      console.log('   Email: user@poneyclub.com');
      console.log('   Rôle: user (Bar Terrasse - PoneyClub)');
    } else {
      console.log('ℹ️  Utilisateur user existe déjà');
    }

    console.log('\n🎯 Système de gestion des utilisateurs prêt !');
    console.log('🔐 4 niveaux d\'accès créés :');
    console.log('   1. superuser - Accès total système');
    console.log('   2. admin - Gestion entreprise PoneyClub');
    console.log('   3. manager - Gestion bars PoneyClub');
    console.log('   4. user - Gestion Bar Terrasse uniquement');

  } catch (error) {
    console.error('❌ Erreur lors de la création du superutilisateur:', error);
  } finally {
    await sequelize.close();
  }
}

// Exécuter le script
createSuperUser(); 