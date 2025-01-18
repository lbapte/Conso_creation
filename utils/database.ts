import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';

let db;

export const initializeDatabase = async () => {
  if (!db) {
    db = await SQLite.openDatabaseAsync('data.db');
    console.log('Base de données initialisée');
  }
  return db;
};

const API_URL = 'http:localhost:5000';
//const db = SQLite.openDatabaseAsync('data.db');


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

    export const fetchTableData = async () => {
      const db = await initializeDatabase();
      try {
        const result = await db.getAllAsync('SELECT EAN FROM data;');
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

export const handleDownloadData = async () => {
  const db = await initializeDatabase();
  const API_URL = 'http://localhost:5000';
  const companyName = 'oui'; // Assurez-vous de récupérer cette valeur dynamiquement
  
  const pageSize = 1000;
  const jwt = await AsyncStorage.getItem('jwt');
  const apiUrl = `${API_URL}/data_receiver/get_data/TD_${companyName}`;
  // Supprimer la table existante
  try {
    await db.execAsync(`DROP TABLE IF EXISTS data;`);
    console.log('Table supprimée avec succès.');
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
    console.log('Colonnes détectées :', columns);

    try {
      
    const createTableQuery = `CREATE TABLE IF NOT EXISTS data (caca INTEGER PRIMARY KEY AUTOINCREMENT,${columns.map(col => `"${col}" TEXT`).join(', ')});`;
    await db.execAsync(createTableQuery);
      //console.log('Table créée avec succès.');

      //await db.execAsync(`CREATE TABLE IF NOT EXISTS data (id INTEGER PRIMARY KEY NOT NULL, value TEXT NOT NULL, intValue INTEGER);`);
      //await db.execAsync(`INSERT INTO data (value, intValue) VALUES ('test56', 123);`);
       
      
    } catch (error) {
      console.error('Erreur lors de la création de la table :', error);
      // Afficher un message d'erreur à l'utilisateur ou effectuer une autre action appropriée
    }

    // Fonction pour insérer les données
   const insertData = async (rows: any) => {
      console.log("ok",columns);
      for (const row of rows) {
        const placeholders = columns.map(() => '?').join(', ');
        const values = columns.map(col => row[col] || null); // Gérer les valeurs manquantes
        const insertQuery = `INSERT INTO data (${columns.join(', ')}) VALUES (${placeholders});`;
        await db.runAsync(insertQuery, values);
        console.log(`Données insérées pour l'id ${row.id}`);
      }
    };
    

    // Insérer la première page de données
    await insertData(data);
    console.log(data);

    const firstRow = await db.getFirstAsync('SELECT * FROM data');
    console.log(firstRow);


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

    console.log('Téléchargement terminé.');
  } catch (error) {
    console.error('Erreur lors du téléchargement des données :', error);
  }
};

export const caca = async () => {

  const db = await initializeDatabase();
  const firstRow = await db.getFirstAsync('SELECT * FROM data');
  console.log(firstRow);


};