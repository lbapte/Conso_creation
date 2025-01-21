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
 * Fonction pour récupérer deux lignes en fonction des filtres
 * @param ean Code EAN
 * @param circuitFilter Filtre pour le circuit
 * @param periodeFilters Tableau avec deux périodes (période 1 et période 2)
 * @param columns Objet contenant les colonnes à récupérer
 * @returns Promesse avec les deux lignes de données
 */
export const fetchDataByFilters = async (
  ean: string,
  circuitFilter: string,
  periodeFilters: [string, string],
  columns: { codeEAN: string[]; circuit: string[]; denominationProduit: string[]; periode: string[] }
): Promise<any[]> => {
  const { codeEAN, circuit, denominationProduit, periode } = columns;
  const db = await initializeDatabase();
  // Construire la requête SQL
  const query = `
    SELECT ${[...denominationProduit, ...circuit, ...periode, ...codeEAN].join(', ')}
    FROM my_table
    WHERE ${codeEAN[0]} = ? AND ${circuit[0]} = ? AND (${periode[0]} = ? OR ${periode[0]} = ?)
  `;

  return new Promise((resolve, reject) => {
    db.exec(
      [{ sql: query, args: [ean, circuitFilter, ...periodeFilters] }],
      false,
      (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0]?.rows || []);
        }
      }
    );
  });
};