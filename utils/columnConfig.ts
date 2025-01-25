import * as SQLite from 'expo-sqlite';
import { initializeDatabase } from './database';

// Variables globales pour chaque type de données
export let denominationProduit: string[] = [];
export let codeEAN: string[] = [];
export let periode: string[] = [];
export let indicateur: string[] = [];
export let circuit: string[] = [];
export let segmentation: string[] = [];

/**
 * Fonction pour récupérer et structurer les colonnes par type depuis la table SQL
 */
export const fetchColumnsByType = async (): Promise<void> => {
  try {
    const db = await initializeDatabase();

    // Exécuter une requête pour récupérer les données de la table
    const result = await db.getAllAsync('SELECT colonne, valeur FROM segments;'); // Adaptez le nom de la table ici
    //console.log('Données récupérées depuis la table segments :', result);

    // Organiser les colonnes par "valeur"
    const groupedColumns: { [key: string]: string[] } = {};

    result.forEach((row: { colonne: string; valeur: string }) => {
      const { colonne, valeur } = row;

      if (!groupedColumns[valeur]) {
        groupedColumns[valeur] = [];
      }
      groupedColumns[valeur].push(colonne);
    });

    // Assigner les colonnes aux variables globales
    denominationProduit = groupedColumns['Dénomination produit'] || [];
    codeEAN = groupedColumns['code EAN'] || [];
    periode = groupedColumns['Période'] || [];
    indicateur = groupedColumns['Indicateur'] || [];
    circuit = groupedColumns['Circuit'] || [];
    segmentation = groupedColumns['Segmentation'] || [];

    //console.log('Colonnes assignées avec succès :');
    //console.log('Dénomination produit :', denominationProduit);
    //console.log('Code EAN :', codeEAN);
    //console.log('Période :', periode);
    //console.log('Indicateur :', indicateur);
    //console.log('Circuit :', circuit);
    //console.log('Segmentation :', segmentation);
  } catch (error) {
    console.error('Erreur lors de la récupération des colonnes :', error);
  }
};

// Appeler la fonction immédiatement pour initialiser les variables au chargement du fichier
fetchColumnsByType();
