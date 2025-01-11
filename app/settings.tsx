import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';

export default function SettingsScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [jwt, setJwt] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [companyName, setCompanyName] = useState('');

  const API_URL = 'http:localhost:5000'; // Remplacez par l'URL de votre serveur

  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = await AsyncStorage.getItem('jwt');
      const storedCompanyName = await AsyncStorage.getItem('entreprise');
      if (token) {
        setJwt(token);
        setCompanyName(storedCompanyName || '');
        setIsLoggedIn(true);
      }
    };
    checkLoginStatus();
  }, []);

  const handleLogin = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        Alert.alert('Erreur', errorData.message || 'Échec de la connexion');
        return;
      }

      const data = await response.json();
      if (data.token) {
        setJwt(data.token);
        setCompanyName(data.entreprise);
        setIsLoggedIn(true);
        await AsyncStorage.setItem('jwt', data.token);
        await AsyncStorage.setItem('entreprise', data.entreprise);
        Alert.alert('Succès', 'Connexion réussie');
      } else {
        Alert.alert('Erreur', 'Échec de la connexion');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de se connecter au serveur');
      console.error('Erreur de connexion :', error);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('jwt');
    setJwt(null);
    setIsLoggedIn(false);
    Alert.alert('Déconnexion', 'Vous avez été déconnecté');
  };

  const handleDownloadData = async () => {

    const db = SQLite.openDatabaseAsync('data.db');

    const apiUrl = `${API_URL}/data_receiver/get_data/TD_${companyName}`;
    let page = 1;
    const pageSize = 1000;
  
    try {
      // Supprimer la table existante si elle existe
      (await db).execAsync('DROP TABLE IF EXISTS data;');
  
      // Récupérer la première page de données pour analyser la structure
      const response = await fetch(`${apiUrl}?page=${page}&page_size=${pageSize}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      if (!response.ok) throw new Error('Erreur réseau');
  
      const data = await response.json();
      if (data.length === 0) throw new Error('Aucune donnée reçue de l\'API');
  
      // Analyser les clés du premier objet pour déterminer les colonnes
      const columns = Object.keys(data[0]);
      console.log(data);
  
      // Construire dynamiquement la requête de création de table
      try {
        //const createTableQuery = `CREATE TABLE IF NOT EXISTS data (id INTEGER PRIMARY KEY AUTOINCREMENT, Denomination_produit TEXT, EAN TEXT, id TEXT, mois TEXT, rotations TEXT, type_de_magasin TEXT, ventes_volumes TEXT);`;
        const createTableQuery = `
          CREATE TABLE IF NOT EXISTS data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ${columns.map(col => `"${col}" TEXT`).join(', ')}
          );
        `;
        (await db).runAsync(createTableQuery);
        console.log('Table créée avec succès.');
        console.log(createTableQuery);
        console.log(columns);
      } catch (error) {
        console.error('Erreur lors de la création de la table :', error);
        // Afficher un message d'erreur à l'utilisateur ou effectuer une autre action appropriée
      }
  
      // Fonction pour insérer les données
      const insertData = async (rows) => {
        for (const row of rows) {
          const placeholders = columns.map(() => '?').join(', ');
          const values = columns.map(col => row[col] || null); // Gérer les valeurs manquantes
          const insertQuery = `INSERT INTO data (${columns.join(', ')}) VALUES (${placeholders});`;
          (await db).runAsync(insertQuery, values);
          console.log(`Données insérées pour l'id ${row.id}`);
        }
      };
  
      // Insérer la première page de données
      await insertData(data);
  
      // Traiter les pages suivantes
      while (data.length === pageSize) {
        page++;
        const nextResponse = await fetch(`${apiUrl}?page=${page}&page_size=${pageSize}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        });
        if (!nextResponse.ok) throw new Error('Erreur réseau lors de la récupération des pages suivantes');
  
        const nextData = await nextResponse.json();
        if (nextData.length === 0) break;
  
        await insertData(nextData);
      }
  
      console.log('Téléchargement terminé');
    } catch (error) {
      console.error('Erreur lors du téléchargement des données :', error);
    }
  };
  

  return (
    <View style={styles.container}>
      {isLoggedIn ? (
        <View>
          <Text style={styles.welcomeText}>Bienvenue, {companyName} !</Text>
          <Button title="Charger les données" onPress={handleDownloadData} />
          <Button title="Se déconnecter" onPress={handleLogout} />
        </View>
      ) : (
        <View>
          <Text style={styles.title}>Connexion</Text>
          <TextInput
            style={styles.input}
            placeholder="Nom d'utilisateur"
            value={username}
            onChangeText={setUsername}
          />
          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <Button title="Se connecter" onPress={handleLogin} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    borderRadius: 5,
  },
  welcomeText: { fontSize: 18, textAlign: 'center', marginBottom: 20 },
});
