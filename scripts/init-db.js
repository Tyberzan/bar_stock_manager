const { sequelize, Bar, Product, Format, User, Company } = require('../src/models');

// Fonction pour initialiser la base de données
async function initDatabase() {
  try {
    console.log('Synchronisation de la base de données...');
    
    // Force = true pour recréer la base de données (attention, supprime toutes les données)
    await sequelize.sync({ force: true });
    
    console.log('Base de données synchronisée');
    
    // Créer un compte administrateur par défaut
    console.log('Création du compte administrateur...');
    
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123',  // Sera haché par les hooks du modèle
      role: 'admin'
    });
    
    console.log('Compte administrateur créé:');
    console.log('  Username: admin');
    console.log('  Password: admin123');
    
    // Créer quelques entreprises de démonstration
    console.log('\nCréation des entreprises de démonstration...');
    
    const company1 = await Company.create({
      name: 'Restaurant Le Gourmet',
      address: '123 Avenue de la Gastronomie',
      phone: '01 23 45 67 89',
      email: 'contact@legourmet.fr'
    });
    
    const company2 = await Company.create({
      name: 'Hôtel Prestige',
      address: '456 Boulevard du Luxe',
      phone: '01 98 76 54 32',
      email: 'info@hotelprestige.fr'
    });
    
    console.log(`${await Company.count()} entreprises créées`);
    
    // Créer quelques bars de démonstration
    console.log('\nCréation des bars de démonstration...');
    
    const bar1 = await Bar.create({
      name: 'Bar Principal',
      location: 'Rez-de-chaussée',
      description: 'Bar principal du restaurant',
      companyId: company1.id
    });
    
    const bar2 = await Bar.create({
      name: 'Bar Lounge',
      location: '1er étage',
      description: 'Bar de l\'espace lounge',
      companyId: company1.id
    });
    
    const bar3 = await Bar.create({
      name: 'Bar Piscine',
      location: 'Terrasse extérieure',
      description: 'Bar de la piscine',
      companyId: company2.id
    });
    
    console.log(`${await Bar.count()} bars créés`);
    
    // Créer quelques produits de démonstration
    console.log('\nCréation des produits de démonstration...');
    
    const product1 = await Product.create({
      name: 'Coca-Cola',
      brand: 'Coca-Cola',
      category: 'Soda'
    });
    
    const product2 = await Product.create({
      name: 'Heineken',
      brand: 'Heineken',
      category: 'Bière'
    });
    
    const product3 = await Product.create({
      name: 'Smirnoff',
      brand: 'Smirnoff',
      category: 'Spiritueux'
    });
    
    const product4 = await Product.create({
      name: 'Perrier',
      brand: 'Perrier',
      category: 'Eau'
    });
    
    const product5 = await Product.create({
      name: 'Jack Daniel\'s',
      brand: 'Jack Daniel\'s',
      category: 'Whisky'
    });
    
    console.log(`${await Product.count()} produits créés`);
    
    // Créer quelques formats de démonstration
    console.log('\nCréation des formats de démonstration...');
    
    await Format.create({
      productId: product1.id,
      size: '33cl',
      unit: 'canette',
      volume: 33,
      packaging: 'canette'
    });
    
    await Format.create({
      productId: product1.id,
      size: '1L',
      unit: 'bouteille',
      volume: 100,
      packaging: 'bouteille'
    });
    
    await Format.create({
      productId: product2.id,
      size: '33cl',
      unit: 'bouteille',
      volume: 33,
      packaging: 'bouteille'
    });
    
    await Format.create({
      productId: product2.id,
      size: '50cl',
      unit: 'pression',
      volume: 50,
      packaging: 'fut'
    });
    
    await Format.create({
      productId: product3.id,
      size: '75cl',
      unit: 'bouteille',
      volume: 75,
      packaging: 'bouteille'
    });
    
    await Format.create({
      productId: product3.id,
      size: '1L',
      unit: 'bouteille',
      volume: 100,
      packaging: 'bouteille'
    });
    
    await Format.create({
      productId: product3.id,
      size: '1.5L',
      unit: 'bouteille',
      volume: 150,
      packaging: 'bouteille'
    });
    
    await Format.create({
      productId: product4.id,
      size: '33cl',
      unit: 'bouteille',
      volume: 33,
      packaging: 'verre'
    });
    
    await Format.create({
      productId: product4.id,
      size: '75cl',
      unit: 'bouteille',
      volume: 75,
      packaging: 'bouteille'
    });
    
    await Format.create({
      productId: product5.id,
      size: '70cl',
      unit: 'bouteille',
      volume: 70,
      packaging: 'bouteille'
    });
    
    console.log(`${await Format.count()} formats créés`);
    
    console.log('\nInitialisation de la base de données terminée avec succès.');
    console.log('\nVous pouvez maintenant démarrer l\'application avec: npm start');
    
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
  } finally {
    // Fermer la connexion à la base de données
    await sequelize.close();
  }
}

// Exécuter la fonction d'initialisation
initDatabase(); 