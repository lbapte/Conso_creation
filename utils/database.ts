import * as SQLite from 'expo-sqlite';

export default {};

export const db = SQLite.openDatabaseAsync('scans.db');
export const data = SQLite.openDatabaseAsync('data.db');

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

export async function getData(): Promise<string[]> {
  const result: string[] = [];
  
  const voir = (await data).getEachAsync('SELECT * FROM data;');
  console.log(voir);

  for await (const row of (await data).getEachAsync('SELECT * FROM data;')) {
    result.push((row as { code: string }).code);
  }
  
  return result;
}