import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import { fetchColumnsByType } from './columnConfig';

/*permets d'initialiser une instance de la base de données.
Appeller la fonction permets de se connecter à une meme instance de la base 
Si ce n'était pas le cas, les données seraient effacées d'une connexion à l'autre.*/
let db;
export const initializeDatabase = async () => {
  if (!db) {
    db = await SQLite.openDatabaseAsync('data.db');
    //console.log('Base de données initialisée');
  }
  return db;
};

const API_URL = 'http:localhost:5000';

export const setupDatabase = async () => {
  (await db).runAsync(
      'CREATE TABLE IF NOT EXISTS Barcodes (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT);'
    );
};

export const insertBarcode = async (code: string) => {
  (await db).runAsync('INSERT INTO Barcodes (code) VALUES (?);', [code]);
};

export async function getBarcodes(): Promise<string[]> {
  const result: string[] = [];
  
  for await (const row of (await db).getEachAsync('SELECT code FROM Barcodes;')) {
    result.push((row as { code: string }).code);
  }
  
  return result;
}

//récupère l'ensemble des codes barres de la table pour les afficher sur la page historique --> à remplacer par l'historique des EAN scannés
  export const fetchTableData = async () => {
    const db = await initializeDatabase();
    try {
      const result = await db.getAllAsync('SELECT EAN FROM data LIMIT 100;');
      if (result.length > 0) {
        // Extraire les valeurs de la clé "EAN"
        const eanList = result.map(row => row.EAN); // Récupérer uniquement la valeur EAN
        return eanList; // Retourner un tableau simple avec les EAN
      } else {
        console.error('Aucune donnée trouvée dans la colonne EAN.');
        return [];
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des données EAN :', error);
      return [];
    }
    
  };

// permets de récupérer les données de la table mysql sur le serveur 
export const handleDownloadData = async (table: string, tableName: string) => {
  const db = await initializeDatabase();
  const API_URL = 'http://localhost:5000';
  const companyName = 'oui'; // Assurez-vous de récupérer cette valeur dynamiquement
  
  const pageSize = 1000;
  const jwt = await AsyncStorage.getItem('jwt');
  const apiUrl = `${API_URL}/data_receiver/get_data/${table}`;
  // Supprimer la table existante
  try {
    await db.execAsync(`DROP TABLE IF EXISTS ${tableName};`);
    //console.log('Table supprimée avec succès.');
  } catch (error) {
    console.error('Erreur lors de la suppression de la table :', error);
    return;
  }

  try {
    // Récupérer les données de l'API
    const response = await fetch(`${apiUrl}?page=1&page_size=${pageSize}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${jwt}` },
    });

    if (!response.ok) throw new Error('Erreur réseau lors de la récupération des données.');
    const data = await response.json();
    //console.log('Données reçues de l\'API :', data);

    if (!data || data.length === 0) {
      throw new Error('Aucune donnée valide reçue de l\'API.');
    }

    // Analyser les colonnes
    const columns = Object.keys(data[0]);
    //console.log('Colonnes détectées :', columns);

    try {
    const createTableQuery = `CREATE TABLE IF NOT EXISTS ${tableName} (${columns.map(col => `"${col}" TEXT`).join(', ')});`;
    await db.execAsync(createTableQuery);
      //console.log('Table créée avec succès.');
      
    } catch (error) {
      console.error('Erreur lors de la création de la table :', error);
      // Afficher un message d'erreur à l'utilisateur ou effectuer une autre action appropriée
    }

    // Fonction pour insérer les données
   const insertData = async (rows: any) => {
      console.log("colonnes récupérées :",columns);
      for (const row of rows) {
        const placeholders = columns.map(() => '?').join(', ');
        const values = columns.map(col => row[col] || null); // Gérer les valeurs manquantes
        const insertQuery = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders});`;
        await db.runAsync(insertQuery, values);
        //console.log(`Données insérées pour l'id ${row.id}`);
      }
    };
    

    // Insérer la première page de données
    await insertData(data);
    //console.log(data);

    const firstRow = await db.getAllAsync(`SELECT * FROM ${tableName}`);
    //console.log(firstRow);


    // Pagination pour les pages suivantes
    let page = 2;
    while (data.length === pageSize) {
      const nextResponse = await fetch(`${apiUrl}?page=${page}&page_size=${pageSize}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${jwt}` },
      });

      if (!nextResponse.ok) throw new Error('Erreur réseau lors de la récupération des pages suivantes.');
      const nextData = await nextResponse.json();
      if (nextData.length === 0) break;

      //await insertData(nextData);
      page++;
    }
    //console.log('Téléchargement terminé.');
  } catch (error) {
    console.error('Erreur lors du téléchargement des données :', error);
  }
};

export const loadingData = async () => {

  handleDownloadData("TD_oui","data");
  handleDownloadData("Colonnes","segments");

};

/**
 * Fonction pour récupérer les lignes en fonction des colonnes dynamiques et des filtres
 * @param filters Objet contenant les filtres EAN, période, circuit
 * @param columns Objet contenant les intitulés des colonnes pour chaque catégorie
 * @returns Promesse avec les données récupérées
 */
export const fetchDataByDynamicColumns = async (
  filters: { ean: string; periode: string; periodeComparaison: string; circuit: string },
  columns: { codeEAN: string[]; circuit: string[]; periode: string[]; indicateur: string[] }
): Promise<any[]> => {
  //console.log(filters," changement ",columns);
  const db = await initializeDatabase();
  const { ean, periode, circuit } = filters;
  const { codeEAN, circuit: circuitCols, periode: periodeCols, indicateur } = columns;

  //console.log("ean",ean,"periode",periode,"circuit",circuit);
  //console.log("circuits",circuitCols,"periode",periodeCols,"indicateurs",indicateur);

  // Construire la requête SQL dynamique
  const query = `
    SELECT ${[...indicateur].join(', ')}
    FROM data
    WHERE ${codeEAN[0]} = ? AND ${periodeCols[0]} = ? AND ${circuitCols[0]} = ?
  `;

 //console.log(query);
 console.log("dans la fonction");

  try {
    // Exécution de la requête
    const results = await db.getAllAsync(query, [ean, periode, circuit]);
    console.log(results);

    console.log('Requête traitée avec succès');
    return results || []; // Retourne les résultats sous forme de tableau
  } catch (error) {
    console.error('Erreur lors de la récupération des données :', error);
    throw error; // Propagation de l'erreur pour une gestion externe
  }
};