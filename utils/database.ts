import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import {API_URL} from './apiUrl';


export let codeEAN: string[] = [];
export let periode: string[] = [];
export let indicateur: string[] = [];
export let circuit: string[] = [];
export let segmentation: string[] = [];
export let denominationProduit: string[] = [];

export let valeurPeriodes: string[] = [];
export let valeurcircuit: string[] = [];


/*permets d'initialiser une instance de la base de données.
Appeller la fonction permets de se connecter à une meme instance de la base 
Si ce n'était pas le cas, les données seraient effacées d'une connexion à l'autre.*/
let db: SQLite.SQLiteDatabase;
export const initializeDatabase = async () => {
  if (!db) {
    db = await SQLite.openDatabaseAsync('data.db');
    //console.log('Base de données initialisée');
  }
  return db;
};

//const API_URL = 'http:localhost:5000';

//récupère l'ensemble des codes barres de la table pour les afficher sur la page historique --> à remplacer par l'historique des EAN scannés
export const fetchTableData = async () => {
  const db = await initializeDatabase();
  try {
    const result = await db.getAllAsync('SELECT EAN FROM data LIMIT 20;');
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

export const getData = async () => {
  const db = await initializeDatabase();
  const jwt = await AsyncStorage.getItem('jwt');
  const company = await AsyncStorage.getItem('entreprise');
  const apiUrl = `${API_URL}/data_receiver/get_data/LastSubmition_${company}`;
  const pageSize = 1;

  const storeSubmissionDate = async (date) => {
    if (date === undefined || date === null) {
      console.error("Submission date is undefined or null, rien n'est stocké");
      return;
    }
    try {
      // S'assurer que la date est stockée en tant que chaîne de caractères
      await AsyncStorage.setItem('submission_date', date.toString());
    } catch (error) {
      console.error("Erreur lors du stockage de la date :", error);
    }
  };

  try {
    // Récupérer les données de l'API
    const response = await fetch(`${apiUrl}?page=1&page_size=${pageSize}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${jwt}` },
    });
    const json = await response.json();

    let submissionDate = null;
    // Si la réponse est un tableau, on récupère la date depuis le premier élément
    if (Array.isArray(json) && json.length > 0 && json[0].submission_date) {
      submissionDate = json[0].submission_date;
    } else if (json.submission_date) {
      submissionDate = json.submission_date;
    }

    if (!submissionDate) {
      console.error("Submission date introuvable dans la réponse :", json);
    } else {
      await storeSubmissionDate(submissionDate);
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des données de date', error);
  }
  console.log('date chargée');
};
// // // //  

export const checkForNewData = async () => {
  try {
    // Récupérer le JWT et le nom de l'entreprise depuis AsyncStorage
    const jwt = await AsyncStorage.getItem('jwt');
    const company = await AsyncStorage.getItem('entreprise');
    
    // Construire l'URL de l'API en fonction du nom de l'entreprise
    const apiUrl = `${API_URL}/data_receiver/get_data/LastSubmition_${company}`;
    
    // Appeler l'API pour récupérer la dernière date de soumission
    const response = await fetch(`${apiUrl}?page=1&page_size=1`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
    
    const json = await response.json();
    
    // Extraction de la date depuis la réponse (qui est un tableau)
    let apiSubmissionDate = null;
    if (Array.isArray(json) && json.length > 0 && json[0].submission_date) {
      apiSubmissionDate = json[0].submission_date;
    } else if (json.submission_date) {
      apiSubmissionDate = json.submission_date;
    } else {
      console.error("Submission date introuvable dans la réponse API :", json);
      return;
    }
    
    // Récupérer la date stockée dans AsyncStorage
    const storedSubmissionDate = await AsyncStorage.getItem('submission_date');
    
    // Comparer les dates
    if (storedSubmissionDate !== apiSubmissionDate) {
      // Si les dates diffèrent, on considère qu'il y a de nouvelles données
      await AsyncStorage.setItem('newData', 'true');
      console.log("Nouvelle donnée détectée : newData mis à true.");
    } else {
      await AsyncStorage.setItem('newData', 'false');
      console.log("Aucune nouvelle donnée : newData mis à false.");
    }
  } catch (error) {
    console.error("Erreur lors de la vérification des nouvelles données :", error);
  }
};



export const getRemoteTotalRowCount = async (table) => {
  const jwt = await AsyncStorage.getItem('jwt');
  const response = await fetch(`${API_URL}/data_receiver/get_count/${table}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!response.ok) {
    throw new Error('Erreur réseau lors de la récupération du nombre total');
  }
  const data = await response.json();
  // On suppose que l'API renvoie un objet { total: nombre }
  return data.total;
};

// Fonction pour charger une page de données et les insérer dans la base SQLite locale
export const fetchDataPage = async (table, tableName, pageSize, pageNumber) => {
  const db = await initializeDatabase();
  const jwt = await AsyncStorage.getItem('jwt');
  const apiUrl = `${API_URL}/data_receiver/get_data/${table}`;
  const response = await fetch(`${apiUrl}?page=${pageNumber}&page_size=${pageSize}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!response.ok) {
    throw new Error('Erreur réseau lors de la récupération des données.');
  }
  const data = await response.json();

  // Pour la première page, on crée la table locale
  if (pageNumber === 1 && data && data.length > 0) {
    const columns = Object.keys(data[0]);
    const createTableQuery = `CREATE TABLE IF NOT EXISTS ${tableName} (${columns.map(col => `"${col}" TEXT`).join(', ')});`;
    await db.execAsync(createTableQuery);
  }

  // Insertion des données dans la table
  if (data && data.length > 0) {
    const columns = Object.keys(data[0]);
    for (const row of data) {
      const placeholders = columns.map(() => '?').join(', ');
      const values = columns.map(col => row[col] ?? null);
      const insertQuery = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders});`;
      await db.runAsync(insertQuery, values);
    }
  }
  return data;
};

export const cleanTable = async (tableName: string): Promise<void> => {
  try {
    const db = await initializeDatabase();
    await db.execAsync(`DROP TABLE IF EXISTS ${tableName};`);
    console.log(`La table "${tableName}" a été effacée avec succès.`);
  } catch (error) {
    console.error(`Erreur lors de l'effacement de la table "${tableName}" :`, error);
    throw error;
  }
};

// // // //  

// permets de récupérer les données de la table mysql sur le serveur 
export const handleDownloadData = async (table: string, tableName: string) => {
  const db = await initializeDatabase();
  // Décommentez et définissez API_URL si nécessaire
  // const API_URL = 'http://localhost:5000';
  const pageSize = 1000;
  const jwt = await AsyncStorage.getItem('jwt');
  const apiUrl = `${API_URL}/data_receiver/get_data/${table}`;

  // Supprimer la table existante
  try {
    await db.execAsync(`DROP TABLE IF EXISTS ${tableName};`);
  } catch (error) {
    console.error('Erreur lors de la suppression de la table :', error);
    return;
  }

  try {
    let page = 1;
    let data: any[] = [];
    let insertData: (rows: any[]) => Promise<void>;
    do {
      // Récupération des données pour la page courante
      const response = await fetch(`${apiUrl}?page=${page}&page_size=${pageSize}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${jwt}` },
      });

      if (!response.ok)
        throw new Error('Erreur réseau lors de la récupération des données.');
      data = await response.json();

      // S'assurer qu'on a bien reçu des données pour la première page
      if (page === 1 && (!data || data.length === 0)) {
        throw new Error('Aucune donnée valide reçue de l\'API.');
      }

      // Création de la table à partir de la première page
      if (page === 1) {
        const columns = Object.keys(data[0]);
        try {
          const createTableQuery = `CREATE TABLE IF NOT EXISTS ${tableName} (${columns
            .map(col => `"${col}" TEXT`)
            .join(', ')});`;
          await db.execAsync(createTableQuery);
        } catch (error) {
          console.error('Erreur lors de la création de la table :', error);
          return;
        }

        // Fonction d'insertion qui utilise les colonnes déterminées
        insertData = async (rows: any[]) => {
          for (const row of rows) {
            const placeholders = columns.map(() => '?').join(', ');
            const values = columns.map(col => row[col] ?? null);
            const insertQuery = `INSERT INTO ${tableName} (${columns.join(
              ', '
            )}) VALUES (${placeholders});`;
            await db.runAsync(insertQuery, values);
          }
        };
      }

      // Insérer les données récupérées pour la page actuelle
      await insertData!(data);
      console.log(`Page ${page} insérée (${data.length} lignes).`);
      page++;
    } while (data.length === pageSize); // Tant que la page contient le nombre maximum d'enregistrements
    fetchColumnsByType();
    console.log('Téléchargement terminé.');
  } catch (error) {
    console.error('Erreur lors du téléchargement des données :', error);
  }
};

export const loadingData = async () => {

  handleDownloadData("TD_oui","data");
  handleDownloadData("Colonnes","segments");
  getData();
  //fetchColumnsByType();

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
  const { ean, periode, periodeComparaison, circuit } = filters;
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
 //console.log("dans la fonction");

  try {
    // Exécution de la requête
    const resultat1 = await db.getAllAsync(query, [ean, periode, circuit]);
    const resultat2 = await db.getAllAsync(query, [ean, periodeComparaison, circuit]);

    const results=[resultat1,resultat2];
    //console.log('Requête traitée avec succès');
    return results; // Retourne les résultats sous forme de tableau
  } catch (error) {
    console.error('Erreur lors de la récupération des données :', error);
    throw error; // Propagation de l'erreur pour une gestion externe
  }
};

export const fetchUniqueValues = async (column: string) => {
  const db = await initializeDatabase();

  // Requête pour récupérer les valeurs uniques
  const query = `
    SELECT DISTINCT ${column} 
    FROM data
    WHERE ${column} IS NOT NULL
  `;

  try {
    const result = await db.getAllAsync(query);
    //console.log(result);
    //const rows = result.rows; // Tableau des lignes retournées
    //return rows.map((row) => row[column]); // Retourne un tableau de valeurs uniques
    return result;
  } catch (error) {
    console.error(`Erreur lors de la récupération des valeurs pour ${column}:`, error);
    return [];
  }
};

export const fetchFilteredColumnValue = async (
  ean: string,
  column: string,
  nomColEAN: string,
): Promise<string | null> => {
  const db = await initializeDatabase();

  const query = `
    SELECT ${column}
    FROM data
    WHERE ${nomColEAN} = ?
    LIMIT 1
  `;
 
  try {
    const result = await db.getAllAsync(query, [ean]);
    return result[0][column] || null;
  } catch (error) {
    console.error(`Erreur lors de la récupération de la valeur filtrée pour ${column}:`, error);
    return null;
  }
};

// Fonction pour récupérer la liste des références classées et filtrées
export const fetchReferences = async (
  eanColumn: string, // Colonne contenant les codes EAN
  sortBy: string, // Colonne d'indicateur pour le tri
  order: 'Croissant' | 'Décroissant',
  filterColumn: string,
  filterValue: string,
  referenceColumn: string, // Colonne contenant l'intitulé des références
  circuitColumn: string,
  periodeColumn: string,
  circuitValue: string,
  periodeValue: string,
): Promise<{ reference: string; indicatorValue: number }[]> => {
  if (!sortBy || !filterColumn || !filterValue || !referenceColumn) return [];

  const orderSQL = order === 'Croissant' ? 'ASC' : 'DESC';
  const query = `
    SELECT ${referenceColumn} AS reference, ${sortBy} AS indicatorValue
    FROM data
    WHERE ${filterColumn} = ? AND ${sortBy} IS NOT NULL  AND ${circuitColumn} = ? AND ${periodeColumn} = ? 
    ORDER BY CAST(${sortBy} AS NUMERIC) ${orderSQL}
  `;

  try {
    const db = await initializeDatabase();
    const result = await db.getAllAsync(query, [filterValue,circuitValue,periodeValue]);

    return result.map((row: any) => ({
      reference: row.reference,
      indicatorValue: row.indicatorValue,
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des références :', error);
    return [];
  }
};

export const fetchReferencesWithIndicators = async (
  eanColumn: string, 
  sortBy: string, 
  order: 'Croissant' | 'Décroissant',
  referenceColumn: string, 
  circuitColumn: string,
  periodeColumn: string,
  circuitValue: string,
  periodeValue: string,
  comparisonPeriodeValue: string, 
  indicators: string[], 
  limit: number,
  scannedEan: string,
  segmentationColumn?: string, 
  advancedFilterIndicator?: string,
  advancedFilterOperator?: string,
  advancedFilterValue?: string 
): Promise<{ references: any[][]; scannedRank: number | null }> => {
  if (!sortBy || !referenceColumn) return { references: [[], []], scannedRank: null };

  const orderSQL = order === 'Croissant' ? 'ASC' : 'DESC';

  try {
    const db = await initializeDatabase();
    
    // 🔹 Récupération de la valeur de segmentation
    let segmentationValue: string | null = null;
    if (segmentationColumn && segmentationColumn !== "Aucun filtre") {
      const validColumnName = segmentationColumn.replace(/[^a-zA-Z0-9_]/g, ""); // Nettoie le nom de colonne
      const segmentationQuery = `
        SELECT ${validColumnName} AS segmentationValue 
        FROM data 
        WHERE ${eanColumn} = ? 
        LIMIT 1;
      `;

      try {
        const segmentationResult = await db.getAllAsync(segmentationQuery, [scannedEan]);
        segmentationValue = segmentationResult.length > 0 ? segmentationResult[0].segmentationValue : null;
      } catch (error) {
        console.error("Erreur lors de la récupération de segmentationValue :", error);
      }
    }
    console.log("ok1");
    // 📌 Construction dynamique des filtres SQL
    let whereConditions = [`${circuitColumn} = ?`, `${periodeColumn} = ?`];
    let queryParams: any[] = [circuitValue, periodeValue];

    if (segmentationColumn && segmentationValue && segmentationValue !== 'Aucun filtre') {
      whereConditions.push(`${segmentationColumn} = ?`);
      queryParams.push(segmentationValue);
    }

    if (advancedFilterIndicator && advancedFilterOperator && advancedFilterValue !== undefined && advancedFilterValue !== '') {
      const numericValue = parseFloat(advancedFilterValue);
      if (!isNaN(numericValue)) {
        whereConditions.push(`CAST(${advancedFilterIndicator} AS NUMERIC) ${advancedFilterOperator} ?`);
        queryParams.push(numericValue);
      }
    }
    console.log("ok2");
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 🔹 Requête SQL principale avec classement des références
    const query = `
     SELECT
        ROW_NUMBER() OVER (ORDER BY CAST(${sortBy} AS NUMERIC) ${orderSQL}) AS rank,
        ${referenceColumn} AS reference, 
        ${eanColumn} AS ean, 
        ${sortBy} AS indicatorValue
      FROM data
      ${whereClause}
      ORDER BY CAST(${sortBy} AS NUMERIC) ${orderSQL}
      LIMIT ?;
    ;
    `;

    queryParams.push(limit);

    console.log(queryParams,...queryParams.slice(0, -1));

    const result1 = await db.getAllAsync(query, queryParams);
    console.log("ok3");
    const result2 = await db.getAllAsync(query, [...queryParams.slice(0), comparisonPeriodeValue, limit]);
    console.log("ok4");
    // 🔹 Requête SQL pour récupérer le rang de la référence scannée
    const rankQuery = `
      SELECT rank FROM (
        SELECT 
          ROW_NUMBER() OVER (ORDER BY CAST(${sortBy} AS NUMERIC) ${orderSQL}) AS rank,
          ${eanColumn} AS ean
        FROM data
        ${whereClause}
      ) 
      WHERE ean = ?;
    `;

    const rankResult = await db.getAllAsync(rankQuery, [...queryParams.slice(0, -1), scannedEan]);
    const scannedRank = rankResult.length > 0 ? rankResult[0].rank : null;

    return { references: [result1, result2], scannedRank };
  } catch (error) {
    console.error('Erreur lors de la récupération des références :', error);
    return { references: [[], []], scannedRank: null };
  }
};



/**
 * Récupéartion des valeurs unique pour le premier filtre
@param segmentationColumn - La colonne utilisée pour la segmentation (ex: "Catégorie", "Marque").
* @param segmentationValue - La valeur spécifique de cette colonne (ex: "Boissons", "Coca-Cola").
* @returns Liste des références correspondant à cette valeur de segmentation.
*/
export const fetchUniqueValuesBySegmentation = async (
  column: string,
  advancedFilter?: { column: string; operator: string; value: string; circuit?: string; period?: string } | null,
  circuitColumn?: string,
  periodeColumn?: string
): Promise<string[]> => {
  try {
    const db = await initializeDatabase();
    if (!db) throw new Error("Base de données non initialisée");
    let query = `SELECT DISTINCT ${column} FROM data WHERE 1=1`;
    const params: any[] = [];
    if (advancedFilter) {
      query += ` AND CAST(${advancedFilter.column} AS ${advancedFilter.type}) ${advancedFilter.operator} ?`;
      params.push(advancedFilter.value);
      if (advancedFilter.circuit && circuitColumn) {
        query += ` AND ${circuitColumn} = ?`;
        params.push(advancedFilter.circuit);
      }
      if (advancedFilter.period && periodeColumn) {
        query += ` AND ${periodeColumn} = ?`;
        params.push(advancedFilter.period);
      }
    }
    const results = await db.getAllAsync(query, params);
    console.log("Requête SubFilter :", query);
    console.log("Params :", params);
    return results.map((row: any) => row[column]).filter(Boolean);
  } catch (error) {
    console.error("Erreur lors de la récupération des valeurs uniques :", error);
    return [];
  }
};
/**
 * Récupération des valeurs uniques pour un sous-filtre (2ᵉ niveau)
 */
export const fetchUniqueValuesForSubFilter = async (
  column: string,
  parentColumn: string,
  parentValue: string,
  circuitColumn: string,
  periodeColumn: string,
  advancedFilter?: {
    column: string;
    operator: string;
    value: string;
    type: 'integer' | 'text';
    circuit?: string;
    period?: string;
  } | null
): Promise<string[]> => {
  try {
    const db = await initializeDatabase();
    let query = `SELECT DISTINCT ${column} FROM data WHERE ${parentColumn} = ?`;
    const params: any[] = [parentValue];

    console.log("filtre avancé",advancedFilter);

    if (
      advancedFilter &&
      advancedFilter.column &&
      advancedFilter.operator &&
      advancedFilter.value !== ''
    ) {
      if (advancedFilter.type === 'integer') {
        query += ` AND CAST(${advancedFilter.column} AS ${advancedFilter.type}) ${advancedFilter.operator} ?`;
        params.push(parseFloat(advancedFilter.value));
      } else {
        query += ` AND ${advancedFilter.column} ${advancedFilter.operator} ?`;
        params.push(advancedFilter.value);
      }

      if (advancedFilter.circuit) {
        query += ` AND ${circuitColumn} = ?`;
        params.push(advancedFilter.circuit);
      }
      if (advancedFilter.period) {
        query += ` AND ${periodeColumn} = ?`;
        params.push(advancedFilter.period);
      }
    }

    const results = await db.getAllAsync(query, params);
    return results.map((row: any) => row[column]).filter(Boolean);
  } catch (error) {
    console.error("Erreur subFilter :", error);
    return [];
  }
};
/**
 * fetchUniqueValuesForThirdFilter
 */
export const fetchUniqueValuesForThirdFilter = async (
  column: string,
  parentColumn1: string,
  parentValue1: string,
  parentColumn2: string,
  parentValue2: string,
  circuitColumn: string,
  periodeColumn: string,
  advancedFilter?: {
    column: string;
    operator: string;
    value: string;
    type: 'integer' | 'text';
    circuit?: string;
    period?: string;
  } | null
): Promise<string[]> => {
  try {
    const db = await initializeDatabase();
    let query = `SELECT DISTINCT ${column} FROM data WHERE ${parentColumn1} = ? AND ${parentColumn2} = ?`;
    const params: any[] = [parentValue1, parentValue2];

    if (
      advancedFilter &&
      advancedFilter.column &&
      advancedFilter.operator &&
      advancedFilter.value !== ''
    ) {
      if (advancedFilter.type === 'integer') {
        query += ` AND CAST(${advancedFilter.column} AS ${advancedFilter.type}) ${advancedFilter.operator} ?`;
        params.push(parseFloat(advancedFilter.value));
      } else {
        query += ` AND ${advancedFilter.column} ${advancedFilter.operator} ?`;
        params.push(advancedFilter.value);
      }

      if (advancedFilter.circuit) {
        query += ` AND ${circuitColumn} = ?`;
        params.push(advancedFilter.circuit);
      }
      if (advancedFilter.period) {
        query += ` AND ${periodeColumn} = ?`;
        params.push(advancedFilter.period);
      }
    }

    const results = await db.getAllAsync(query, params);
    return results.map((row: any) => row[column]).filter(Boolean);
  } catch (error) {
    console.error("Erreur thirdFilter :", error);
    return [];
  }
};




/**
 * fetchUniqueValuesForReferences (3 filtres actifs)
 */
export const fetchUniqueValuesForReferences = async (
  denominationColumn: string,
  eanColumn: string,
  parentColumn1: string,
  parentValue1: string,
  parentColumn2: string,
  parentValue2: string,
  parentColumn3: string,
  parentValue3: string,
  circuitColumn: string,
  periodeColumn: string,
  circuitSelect?: string,
  periodSelect?: string,
  advancedFilter?: {
    column: string;
    operator: string;
    value: string;
    type: 'integer' | 'text';
    circuit?: string;
    period?: string;
  } | null,
  filtrerVia?: string,
  sortOrder: 'asc' | 'desc' = 'asc'
): Promise<{ intitule: string; codeEAN: string; filtrerViaValue?: any }[]> => {
  try {
    const db = await initializeDatabase();

    // On applique le tri de base uniquement si filtrerVia est renseigné (différent de "Aucun filtre")
    // ET que circuitSelect et periodSelect sont fournis.
    const applyBasicOrder =
      filtrerVia && filtrerVia !== "Aucun filtre" &&
      circuitSelect && periodSelect;

    console.log("État (circuitSelect, periodSelect):", circuitSelect, periodSelect);

    // Construction du SELECT :
    // Si le tri de base s'applique, on sélectionne directement la valeur de l'indicateur.
    // Sinon, on utilise MIN() pour garantir l'unicité.
    let selectClause = "";
    if (applyBasicOrder) {
      selectClause = `SELECT ${eanColumn} AS codeEAN, ${denominationColumn} AS intitule`;
      if (filtrerVia) {
        selectClause += `, ${filtrerVia} AS filtrerViaValue`;
      }
    } else {
      selectClause = `SELECT ${eanColumn} AS codeEAN, MIN(${denominationColumn}) AS intitule`;
      if (filtrerVia && filtrerVia !== "Aucun filtre") {
        selectClause += `, MIN(${filtrerVia}) AS filtrerViaValue`;
      }
    }

    let query = `
      ${selectClause}
      FROM data
      WHERE ${parentColumn1} = ?
        AND ${parentColumn2} = ?
        AND ${parentColumn3} = ?
    `;
    const params: any[] = [parentValue1, parentValue2, parentValue3];

    // Ajout des conditions pour circuit et période via circuitSelect et periodSelect.
    if (circuitSelect) {
      query += ` AND ${circuitColumn} = ?`;
      params.push(circuitSelect);
    }
    if (periodSelect) {
      query += ` AND ${periodeColumn} = ?`;
      params.push(periodSelect);
    }

    // Ajout des conditions du filtre avancé pour les autres critères (hors circuit et période)
    if (advancedFilter && advancedFilter.value !== '' && advancedFilter.column && advancedFilter.operator) {
      query += ' AND (';
      const conditions: string[] = [];
      if (advancedFilter.type === 'integer') {
        conditions.push(`CAST(${advancedFilter.column} AS ${advancedFilter.type}) ${advancedFilter.operator} ?`);
        params.push(parseFloat(advancedFilter.value));
      } else {
        conditions.push(`${advancedFilter.column} ${advancedFilter.operator} ?`);
        params.push(advancedFilter.value);
      }
      // Si circuitSelect et periodSelect ne sont pas renseignés, on peut utiliser advancedFilter.circuit/period.
      if (!circuitSelect && advancedFilter.circuit) {
        conditions.push(`${circuitColumn} = ?`);
        params.push(advancedFilter.circuit);
      }
      if (!periodSelect && advancedFilter.period) {
        conditions.push(`${periodeColumn} = ?`);
        params.push(advancedFilter.period);
      }
      query += conditions.join(' AND ');
      query += ')';
    } else {
      // Si advancedFilter est défini mais ne contient pas de valeur, on vérifie si advancedFilter propose circuit/period
      if (advancedFilter && advancedFilter.circuit && !circuitSelect) {
        query += ` AND ${circuitColumn} = ?`;
        params.push(advancedFilter.circuit);
      }
      if (advancedFilter && advancedFilter.period && !periodSelect) {
        query += ` AND ${periodeColumn} = ?`;
        params.push(advancedFilter.period);
      }
    }

    // GROUP BY
    if (applyBasicOrder) {
      // On considère que la combinaison EAN, denomination et l'indicateur est unique pour ce circuit et cette période.
      query += ` GROUP BY ${eanColumn}, ${denominationColumn}, ${filtrerVia}`;
    } else {
      query += ` GROUP BY ${eanColumn}`;
    }

    // ORDER BY : uniquement si filtrerVia est renseigné et différent de "Aucun filtre".
    if (filtrerVia && filtrerVia !== "Aucun filtre") {
      if (applyBasicOrder) {
        query += ` ORDER BY CAST(${filtrerVia} AS NUMERIC) ${sortOrder}`;
      } else {
        query += ` ORDER BY CAST(MIN(${filtrerVia}) AS NUMERIC) ${sortOrder}`;
      }
    }

    console.log('Requête : ', query, ' / Paramètres : ', params);

    const results = await db.getAllAsync(query, params);
    return results.map((row: any) => ({
      intitule: row.intitule,
      codeEAN: row.codeEAN,
      filtrerViaValue: filtrerVia && filtrerVia !== "Aucun filtre" ? row.filtrerViaValue : undefined,
    }));
  } catch (error) {
    console.error("Erreur references :", error);
    return [];
  }
};


/**
 * fetchUniqueValuesForReferencesOne (1 filtre actif)
 */
export const fetchUniqueValuesForReferencesOne = async (
  denominationColumn: string,
  eanColumn: string,
  parentColumn: string,
  parentValue: string,
  circuitColumn: string,
  periodeColumn: string,
  circuitSelect?: string,
  periodSelect?: string,
  advancedFilter?: {
    column: string;
    operator: string;
    value: string;
    type: 'integer' | 'text';
    circuit?: string;
    period?: string;
  } | null,
  filtrerVia?: string,
  sortOrder: 'asc' | 'desc' = 'asc'
): Promise<{ intitule: string; codeEAN: string; filtrerViaValue?: any }[]> => {
  try {
    const db = await initializeDatabase();

    // Détermine si on peut appliquer le tri de base directement :
    // On considère que le tri de base est applicable si :
    // 1. filtrerVia est renseigné (et différent de "Aucun filtre")
    // 2. Les valeurs de circuit et période de la première ligne sont renseignées.
    // Ici, on suppose que ces informations proviennent de l advancedFilter
    // uniquement pour le tri de base (elles doivent être renseignées pour le tri).
    const applyBasicOrder =
      filtrerVia && filtrerVia !== "Aucun filtre" &&
      circuitSelect && periodSelect ;

      console.log("Etat : ",periodSelect,circuitSelect);

    // Construction du SELECT
    // Si le tri de base est applicable, on sélectionne directement la valeur de l'indicateur.
    // Sinon, on utilise MIN() pour garantir l'unicité.
    let selectClause = "";
    if (applyBasicOrder) {
      selectClause = `SELECT ${eanColumn} AS codeEAN, ${denominationColumn} AS intitule`;
      if (filtrerVia) {
        selectClause += `, ${filtrerVia} AS filtrerViaValue`;
      }
    } else {
      selectClause = `SELECT ${eanColumn} AS codeEAN, MIN(${denominationColumn}) AS intitule`;
      if (filtrerVia && filtrerVia !== "Aucun filtre") {
        selectClause += `, MIN(${filtrerVia}) AS filtrerViaValue`;
      }
    }

    let query = `
      ${selectClause}
      FROM data
      WHERE ${parentColumn} = ?
    `;
    const params: any[] = [parentValue];

    if (circuitSelect) {
      query += `AND ${circuitColumn} = ?`;
      params.push(circuitSelect);
    }
    if (periodSelect) {
      query += `AND ${periodeColumn} = ?`;
      params.push(periodSelect);
    }

    // Ajout des conditions du filtre avancé
    // Ces conditions s'appliquent indépendamment du tri de base.
    if (advancedFilter && advancedFilter.value !== '') {
      query += ' AND (';
      const conditions: string[] = [];
      if (advancedFilter.column && advancedFilter.operator) {
        if (advancedFilter.type === 'integer') {
          conditions.push(`CAST(${advancedFilter.column} AS ${advancedFilter.type}) ${advancedFilter.operator} ?`);
          params.push(parseFloat(advancedFilter.value));
        } else {
          conditions.push(`${advancedFilter.column} ${advancedFilter.operator} ?`);
          params.push(advancedFilter.value);
        }
      }
      // Ces filtres circuit et période ici proviennent du filtre avancé et s'appliquent si renseignés
      if (circuitSelect) {
        conditions.push(`${circuitColumn} = ?`);
        params.push(circuitSelect);
      }
      if (periodSelect) {
        conditions.push(`${periodeColumn} = ?`);
        params.push(periodSelect);
      }
      query += conditions.join(' AND ');
      query += ')';
    } else {
      // S'il n'y a pas de filtre avancé, on peut tout de même appliquer les conditions de circuit et période 
      // si elles sont présentes dans advancedFilter (pour le tri de base).
      if (advancedFilter && advancedFilter.circuit) {
        query += ` AND ${circuitColumn} = ?`;
        params.push(advancedFilter.circuit);
      }
      if (advancedFilter && advancedFilter.period) {
        query += ` AND ${periodeColumn} = ?`;
        params.push(advancedFilter.period);
      }
    }

    // Si on n'applique pas le tri de base, on regroupe uniquement par EAN
    if (!applyBasicOrder) {
      query += ` GROUP BY ${eanColumn}`;
    } else {
      // Sinon, on considère que EAN, denomination et l'indicateur (filtrerVia) définissent une combinaison unique
      query += ` GROUP BY ${eanColumn}, ${denominationColumn}, ${filtrerVia}`;
    }

    // ORDER BY : uniquement si le tri de base est applicable.
    if (applyBasicOrder && filtrerVia && filtrerVia !== "Aucun filtre") {
      query += ` ORDER BY CAST(${filtrerVia} AS NUMERIC) ${sortOrder}`;
    } else if (filtrerVia && filtrerVia !== "Aucun filtre") {
      query += ` ORDER BY CAST(MIN(${filtrerVia}) AS NUMERIC) ${sortOrder}`;
    }
    
    console.log('Requête : ', query, ' / Paramètres : ', params);

    const results = await db.getAllAsync(query, params);
    return results.map((row: any) => ({
      intitule: row.intitule,
      codeEAN: row.codeEAN,
      filtrerViaValue: filtrerVia && filtrerVia !== "Aucun filtre" ? row.filtrerViaValue : undefined,
    }));
  } catch (error) {
    console.error("Erreur referencesOne :", error);
    return [];
  }
};

/**
 * fetchUniqueValuesForReferencesTwo (2 filtres actifs)
 */
export const fetchUniqueValuesForReferencesTwo = async (
  denominationColumn: string,
  eanColumn: string,
  parentColumn1: string,
  parentValue1: string,
  parentColumn2: string,
  parentValue2: string,
  circuitColumn: string,
  periodeColumn: string,
  circuitSelect?: string,
  periodSelect?: string,
  advancedFilter?: {
    column: string;
    operator: string;
    value: string;
    type: 'integer' | 'text';
    circuit?: string;
    period?: string;
  } | null,
  filtrerVia?: string,
  sortOrder: 'asc' | 'desc' = 'asc'
): Promise<{ intitule: string; codeEAN: string; filtrerViaValue?: any }[]> => {
  try {
    const db = await initializeDatabase();

    // Détermine si on peut appliquer le tri de base directement
    // C'est le cas si filtrerVia est renseigné (différent de "Aucun filtre")
    // ET que circuitSelect et periodSelect sont fournis.
    const applyBasicOrder =
      filtrerVia && filtrerVia !== "Aucun filtre" &&
      circuitSelect && periodSelect;

    console.log("État (circuitSelect, periodSelect):", circuitSelect, periodSelect);

    // Construction du SELECT
    let selectClause = "";
    if (applyBasicOrder) {
      // On sélectionne directement la valeur de l'indicateur
      selectClause = `SELECT ${eanColumn} AS codeEAN, ${denominationColumn} AS intitule`;
      if (filtrerVia) {
        selectClause += `, ${filtrerVia} AS filtrerViaValue`;
      }
    } else {
      // Sinon, on utilise MIN() pour garantir l'unicité
      selectClause = `SELECT ${eanColumn} AS codeEAN, MIN(${denominationColumn}) AS intitule`;
      if (filtrerVia && filtrerVia !== "Aucun filtre") {
        selectClause += `, MIN(${filtrerVia}) AS filtrerViaValue`;
      }
    }

    let query = `
      ${selectClause}
      FROM data
      WHERE ${parentColumn1} = ? 
        AND ${parentColumn2} = ?
    `;
    const params: any[] = [parentValue1, parentValue2];

    // Ajout des conditions pour circuit et période à partir de circuitSelect et periodSelect
    if (circuitSelect) {
      query += ` AND ${circuitColumn} = ?`;
      params.push(circuitSelect);
    }
    if (periodSelect) {
      query += ` AND ${periodeColumn} = ?`;
      params.push(periodSelect);
    }

    // Ajout des conditions du filtre avancé pour d'autres critères (hors circuit et période)
    if (advancedFilter && advancedFilter.value !== '') {
      query += ' AND (';
      const conditions: string[] = [];
      if (advancedFilter.column && advancedFilter.operator) {
        if (advancedFilter.type === 'integer') {
          conditions.push(`CAST(${advancedFilter.column} AS ${advancedFilter.type}) ${advancedFilter.operator} ?`);
          params.push(parseFloat(advancedFilter.value));
        } else {
          conditions.push(`${advancedFilter.column} ${advancedFilter.operator} ?`);
          params.push(advancedFilter.value);
        }
      }
      // Ces filtres circuit et période ici proviennent du filtre avancé et s'appliquent si renseignés
      if (circuitSelect) {
        conditions.push(`${circuitColumn} = ?`);
        params.push(circuitSelect);
      }
      if (periodSelect) {
        conditions.push(`${periodeColumn} = ?`);
        params.push(periodSelect);
      }
      query += conditions.join(' AND ');
      query += ')';
    } else {
      // S'il n'y a pas de filtre avancé, on peut tout de même appliquer les conditions de circuit et période 
      // si elles sont présentes dans advancedFilter (pour le tri de base).
      if (advancedFilter && advancedFilter.circuit) {
        query += ` AND ${circuitColumn} = ?`;
        params.push(advancedFilter.circuit);
      }
      if (advancedFilter && advancedFilter.period) {
        query += ` AND ${periodeColumn} = ?`;
        params.push(advancedFilter.period);
      }
    }

    // GROUP BY
    if (applyBasicOrder) {
      // La combinaison (EAN, denomination, filtrerVia) définit une ligne unique pour ce circuit et cette période
      query += ` GROUP BY ${eanColumn}, ${denominationColumn}, ${filtrerVia}`;
    } else {
      query += ` GROUP BY ${eanColumn}`;
    }

    // ORDER BY : si filtrerVia est renseigné et différent de "Aucun filtre"
    if (filtrerVia && filtrerVia !== "Aucun filtre") {
      if (applyBasicOrder) {
        query += ` ORDER BY CAST(${filtrerVia} AS NUMERIC) ${sortOrder}`;
      } else {
        query += ` ORDER BY CAST(MIN(${filtrerVia}) AS NUMERIC) ${sortOrder}`;
      }
    }

    console.log('Requête : ', query, ' / Paramètres : ', params);

    const results = await db.getAllAsync(query, params);
    return results.map((row: any) => ({
      intitule: row.intitule,
      codeEAN: row.codeEAN,
      filtrerViaValue: filtrerVia && filtrerVia !== "Aucun filtre" ? row.filtrerViaValue : undefined,
    }));
  } catch (error) {
    console.error("Erreur referencesTwo :", error);
    return [];
  }
};




//récupère l'intitulé d'une référence selon son gencode
export const getIntitule = async (
  EAN: string,
  colonneEAN:string,
  colonneDeno: string,
) => {
  try {
    const db = await initializeDatabase();
    let query = `
      SELECT ${colonneDeno}
      FROM data
      WHERE ${colonneEAN} = ? 
    `;
    
    const params = `${EAN}`

    const results = await db.getFirstAsync(query, params);
    return results[colonneDeno];
     
  } catch (error) {
    console.error("Erreur recupération intitulé :", error);
    return [];
  }
};


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
    segmentation = ['Aucun filtre', ...(groupedColumns['Segmentation'] || [])];

    // Charger les valeurs uniques pour "Période" et "Circuit"
    if (periode[0]) {
      valeurPeriodes = await fetchUniqueValues(periode[0]);
    }
    if (circuit[0]) {
      valeurcircuit = await fetchUniqueValues(circuit[0]);
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des colonnes :', error);
  }
};

// Appeler la fonction immédiatement pour initialiser les variables au chargement du fichier
fetchColumnsByType().then(() => {
  // Les variables sont initialisées ici
});