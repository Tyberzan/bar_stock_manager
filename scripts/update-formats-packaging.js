const { sequelize, Format } = require('../src/models');

// Script pour mettre à jour les formats existants avec un packaging par défaut
async function updateFormatsWithPackaging() {
  try {
    console.log('Connexion à la base de données...');
    await sequelize.authenticate();
    
    console.log('Recherche des formats sans packaging...');
    
    // Récupérer tous les formats qui n'ont pas de packaging défini
    const formatsWithoutPackaging = await Format.findAll({
      where: {
        packaging: null
      }
    });
    
    console.log(`${formatsWithoutPackaging.length} formats trouvés sans packaging`);
    
    if (formatsWithoutPackaging.length === 0) {
      console.log('Tous les formats ont déjà un packaging défini. Aucune mise à jour nécessaire.');
      return;
    }
    
    // Mettre à jour chaque format avec un packaging approprié
    for (const format of formatsWithoutPackaging) {
      let packaging = 'bouteille'; // valeur par défaut
      
      // Essayer de deviner le packaging basé sur l'unité
      if (format.unit) {
        switch (format.unit.toLowerCase()) {
          case 'canette':
            packaging = 'canette';
            break;
          case 'pression':
          case 'fut':
            packaging = 'fut';
            break;
          case 'verre':
            packaging = 'verre';
            break;
          case 'bouteille':
            packaging = 'bouteille';
            break;
          case 'cl':
          case 'ml':
          case 'l':
            // Pour les volumes, faire une estimation
            if (format.volume <= 35) {
              packaging = 'canette';
            } else if (format.volume >= 500) {
              packaging = 'fut';
            } else {
              packaging = 'bouteille';
            }
            break;
          default:
            packaging = 'bouteille';
        }
      }
      
      // Mise à jour du format
      await format.update({ packaging });
      console.log(`Format #${format.id} (${format.size}) mis à jour avec packaging: ${packaging}`);
    }
    
    console.log(`${formatsWithoutPackaging.length} formats mis à jour avec succès !`);
    
  } catch (error) {
    console.error('Erreur lors de la mise à jour des formats:', error);
  } finally {
    await sequelize.close();
  }
}

// Exécuter le script
updateFormatsWithPackaging(); 