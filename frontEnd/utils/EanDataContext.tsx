import AsyncStorage from '@react-native-async-storage/async-storage';
import {getGlobalEanList} from './database';

const STORAGE_KEY = 'eanData';


// Récupère l'objet eanData depuis AsyncStorage
export const getEanData = async () => {
  try {
    const storedData = await AsyncStorage.getItem(STORAGE_KEY);
    return storedData ? JSON.parse(storedData) : {};
  } catch (error) {
    console.error('Erreur lors de la récupération de eanData:', error);
    return {};
  }
};

// Enregistre l'objet eanData dans AsyncStorage
export const setEanData = async (eanData) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(eanData));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de eanData:', error);
  }
};

// Met à jour ou crée une clé pour un code EAN donné dans eanData
export const updateEanData = async (ean, value) => {
  try {
    const currentData = await getEanData();
    currentData[ean] = value;
    await setEanData(currentData);
    console.log(currentData);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de eanData:', error);
  }
};

// Ajoute une clé pour un code EAN si elle n'existe pas déjà
// Les valeurs par défaut sont : eanListe (tableau vide), et les autres indicateurs vides.
export const addEanKey = async (ean) => {
  try {
    const currentData = await getEanData();
    if (!currentData[ean]) {
      currentData[ean] = {
        eanListe: [],
        periode: "",
        periodeComparaison: "",
        circuit: ""
      };
      await setEanData(currentData);
    }
    console.log(currentData);
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la clé ean:', error);
  }
};

// -----------------------------------------------------------------------------
// Fonction pour ajouter un EAN dans la liste d'un élément identifié par "eanKey"
// -----------------------------------------------------------------------------
export const addEanToList = async (eanKey, newEan) => {
  try {
    const currentData = await getEanData();
    // Si la clé n'existe pas, la créer avec la structure par défaut
    if (!currentData[eanKey]) {
      currentData[eanKey] = {
        eanListe: [],
        periode: "",
        periodeComparaison: "",
        circuit: ""
      };
    }
    // Ajoute le nouvel EAN s'il n'est pas déjà présent dans la liste
    if (!currentData[eanKey].eanListe.includes(newEan)) {
      currentData[eanKey].eanListe.push(newEan);
    }
    await setEanData(currentData);
    console.log(`Liste mise à jour pour ${eanKey}:`, currentData[eanKey].eanListe);
    return currentData[eanKey].eanListe;
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'EAN dans la liste:', error);
  }
};

export const removeEanFromList = async (eanKey: string, eanToRemove: string) => {
  try {
    const currentData = await getEanData();
    // Si la clé n'existe pas, rien à faire, on retourne un tableau vide
    if (!currentData[eanKey]) {
      return [];
    }
    // Vérifie si le code EAN est présent dans la liste et le supprime
    const index = currentData[eanKey].eanListe.indexOf(eanToRemove);
    if (index > -1) {
      currentData[eanKey].eanListe.splice(index, 1);
    }
    await setEanData(currentData);
    console.log(`Liste mise à jour pour ${eanKey} après suppression:`, currentData[eanKey].eanListe);
    return currentData[eanKey].eanListe;
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'EAN dans la liste:', error);
  }
};

// -----------------------------------------------------------------------------
// Fonction pour récupérer la liste des EAN pour une clé donnée (ligne)
// -----------------------------------------------------------------------------
export const getEanList = async (eanKey) => {
  try {
    const currentData = await getEanData();
    if (currentData[eanKey] && Array.isArray(currentData[eanKey].eanListe)) {
      console.log("codeOk");
      console.log("liste dans fonction : ",currentData[eanKey].eanListe);
      return currentData[eanKey].eanListe;
    }
    return [];
  } catch (error) {
    console.error('Erreur lors de la récupération de la liste EAN:', error);
    return [];
  }
};





const HISTORICAL_STORAGE_KEY = 'historicalEanList';

// Récupère la liste historique des EAN depuis AsyncStorage
export const getHistoricalEanList = async (): Promise<any[]> => {
  try {
    const storedData = await AsyncStorage.getItem(HISTORICAL_STORAGE_KEY);
    return storedData ? JSON.parse(storedData) : [];
  } catch (error) {
    console.error('Erreur lors de la récupération de historicalEanList:', error);
    return [];
  }
};

// Enregistre la liste historique des EAN dans AsyncStorage
export const setHistoricalEanList = async (data: any[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(HISTORICAL_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de historicalEanList:', error);
  }
};

// Cache local pour éviter des appels répétés
let cachedHistoricalEanList: any[] = [];

/**
 * Initialise l'objet historicalEanList.
 * Si l'objet stocké est vide, la fonction d'attribution des valeurs (importée d'une autre page)
 * est appelée pour récupérer la liste des EAN et dénominations, qui est ensuite stockée.
 * Sinon, l'objet existant est renvoyé.
 *
 * @param getGlobalEanList - Fonction asynchrone qui retourne la liste des EAN et dénominations.
 * @returns La liste historique des EAN et produits.
 */
export const initializeHistoricalEanList = async (): Promise<any[]> => {
  try {
    const storedData = await getHistoricalEanList();
    if (storedData && storedData.length > 0) {
      cachedHistoricalEanList = storedData;
      return cachedHistoricalEanList;
    }
    // Si l'objet est vide, on appelle la fonction importée pour récupérer les valeurs
    const fetchedData = await getGlobalEanList();
    await setHistoricalEanList(fetchedData);
    cachedHistoricalEanList = fetchedData;
    return fetchedData;
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de historicalEanList:', error);
    return [];
  }
};