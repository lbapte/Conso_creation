// baseHistorique.js
import * as SQLite from 'expo-sqlite';

// Active le mode debug et les promesses (optionnel)

let db: SQLite.SQLiteDatabase;
export const initializeDatabase = async () => {
  if (!db) {
    db = await SQLite.openDatabaseAsync('historique.db');
    //console.log('Base de données initialisée');
  }
  return db;
};

export const deleteHistoriqueTable = async () => {
    const db = await initializeDatabase();
    if (!db) {
      console.error("❌ Base de données non initialisée.");
      return;
    }
    try {
      await db.runAsync(`DROP TABLE IF EXISTS historique;`);
      console.log("✅ Table historique supprimée avec succès.");
    } catch (error) {
      console.error("❌ Erreur lors de la suppression de la table historique :", error);
    }
  };

/**
 * Crée la table 'historique' si elle n'existe pas déjà.
 * La table comporte les colonnes :
 *  - id : clé primaire auto-incrémentée
 *  - reference : libellé de la référence
 *  - ean : code EAN
 *  - type : type d'entrée (par exemple "recherche" ou "scan")
 */
export const createHistoriqueTable = async () => {
  
const db = await initializeDatabase();
  try {
    await db.execAsync(`
    CREATE TABLE IF NOT EXISTS historique (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ean TEXT NOT NULL,
    reference TEXT NOT NULL,
    type TEXT NOT NULL,
    timestamp TEXT DEFAULT (datetime('now', 'localtime'))
    );
    `);
    console.log("Table 'historique' créée (ou déjà existante).");
  } catch (error) {
    console.error("Erreur lors de la création de la table 'historique' :", error);
  }
};

/**
 * Insère une entrée dans la table 'historique'.
 *
 * @param {string} reference - L'intitulé de la référence.
 * @param {string} ean - Le code EAN associé.
 * @param {string} type - Le type d'entrée (exemple : "recherche" ou "scan").
 *
 * @returns {Promise} Le résultat de l'exécution SQL.
 */
export const insertHistoriqueEntry = async (ean: any, reference: any, type: any) => {
    if (!db) {
      await initializeDatabase();
    }
    console.log(reference,ean,type)
    try {
        const result = await db.runAsync(
            `INSERT INTO historique (ean, reference, type, timestamp) VALUES (?, ?, ?, datetime('now', 'localtime'))`,
            [reference, ean, type]
          );
      console.log("Insertion réussie dans la table 'historique' :", result);
      return result;
    } catch (error) {
      console.error("Erreur lors de l'insertion dans la table 'historique' :", error);
      throw error;
    }
  };
  
  /**
   * Récupère une liste d'entrées de la table 'historique' en filtrant par code EAN et type,
   * avec une limite sur le nombre de résultats.
   *
   * @param {string} ean - Le code EAN à filtrer.
   * @param {string} type - Le type d'entrée à filtrer (exemple : "recherche" ou "scan").
   * @param {number} limit - La limite du nombre d'enregistrements à retourner.
   *
   * @returns {Promise<Array>} Une liste d'objets correspondant aux enregistrements trouvés.
   */
  export const getHistoriqueByEanAndType = async (type: any, limit: any) => {
    if (!db) {
      await initializeDatabase();
    }
    try {
      let query = `SELECT reference, ean, timestamp FROM historique`;
      let params: any[] = [];
  
      if (type) {
        query += ` WHERE type = ?`;
        params.push(type);
      }
  
      query += ` ORDER BY timestamp DESC LIMIT ?;`;
      params.push(limit);
  
      const results = await db.getAllAsync(query, params);
  
      if (results.length > 0) {
        const historiqueList = results.map(row => ({
          intitule: row.reference,
          ean: row.ean,
          timestamp: row.timestamp, // On récupère la date complète
        }));
        return historiqueList;
      } else {
        console.warn("⚠️ Aucune donnée trouvée.");
        return [];
      }
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des données :", error);
      return [];
    }
  };
  
  export default {
    initializeDatabase,
    createHistoriqueTable,
    insertHistoriqueEntry,
    getHistoriqueByEanAndType,
  };