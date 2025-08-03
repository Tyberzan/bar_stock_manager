/**
 * Gestion de l'affichage responsive des tableaux
 * Ce script ajoute des attributs data-label aux cellules des tableaux
 * pour permettre un affichage correct sur mobile
 */

document.addEventListener('DOMContentLoaded', function() {
  // Fonction pour ajouter des attributs data-label aux cellules des tableaux
  function addDataLabelsToTables() {
    const tables = document.querySelectorAll('.table');
    
    tables.forEach(table => {
      const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
      const rows = table.querySelectorAll('tbody tr');
      
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        
        cells.forEach((cell, index) => {
          if (index < headers.length) {
            cell.setAttribute('data-label', headers[index]);
          }
        });
      });
    });
  }
  
  // Fonction pour mettre à jour les attributs data-label après le chargement dynamique des données
  function updateDataLabels() {
    // Observer les changements dans le DOM pour détecter les mises à jour des tableaux
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Vérifier si des tableaux ont été ajoutés ou modifiés
          const tables = document.querySelectorAll('.table');
          if (tables.length > 0) {
            addDataLabelsToTables();
          }
        }
      });
    });
    
    // Observer le conteneur principal de l'application
    const appContainer = document.getElementById('app');
    if (appContainer) {
      observer.observe(appContainer, { childList: true, subtree: true });
    }
  }
  
  // Initialiser les attributs data-label
  addDataLabelsToTables();
  
  // Mettre en place l'observateur pour les mises à jour dynamiques
  updateDataLabels();
  
  // Ajouter un écouteur d'événement pour les changements de page
  window.addEventListener('hashchange', function() {
    // Attendre que le contenu de la nouvelle page soit chargé
    setTimeout(addDataLabelsToTables, 100);
  });
}); 