import * as SQLite from 'expo-sqlite';
import { initializeDatabase, fetchUniqueValues } from './database';

// Variables globales pour chaque type de données
export let denominationProduit: string[] = [];
export let codeEAN: string[] = [];
export let periode: string[] = [];
export let indicateur: string[] = [];
export let circuit: string[] = [];
export let segmentation: string[] = [];

export let valeurPeriodes: string[] = [];
export let valeurcircuit: string[] = [];

/**
 * Fonction pour récupérer et structurer les colonnes par type depuis la table SQL
 */
export const fetchColumnsByType = async (): Promise<void> => {
  try {
    const db = await initializeDatabase();

    // Exécuter une requête pour récupérer les données de la table
    const result = await db.getAllAsync('SELECT colonne, valeur FROM segments;');

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

    console.log('Colonnes initialisées :', {
      periode,
      circuit,
      denominationProduit,
    });

    // Charger les valeurs uniques pour "Période" et "Circuit"
    if (periode[0]) {
      valeurPeriodes = await fetchUniqueValues(periode[0]);
      console.log('Valeurs pour Périodes :', valeurPeriodes);
    }
    if (circuit[0]) {
      valeurcircuit = await fetchUniqueValues(circuit[0]);
      console.log('Valeurs pour Circuit :', valeurcircuit);
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des colonnes :', error);
  }
};

// Appeler la fonction immédiatement pour initialiser les variables au chargement du fichier
fetchColumnsByType().then(() => {
  // Les variables sont initialisées ici
  console.log('Valeurs après initialisation :');
  console.log('Périodes :', valeurPeriodes);
  console.log('Circuits :', valeurcircuit);
});