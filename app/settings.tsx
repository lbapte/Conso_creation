import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseAsync('data.db');

export default function SettingsScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [jwt, setJwt] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [companyName, setCompanyName] = useState('');

  const API_URL = 'http://localhost:5000'; // Remplacez par l'URL de votre serveur

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
    const apiUrl = `${API_URL}/data_receiver/get_data/TD_${companyName}`;
    let page = 1;
    const pageSize = 1000;

    try {
      (await db).execAsync('DROP TABLE IF EXISTS data;');
      (await db).execAsync(
        'CREATE TABLE IF NOT EXISTS data (id INTEGER PRIMARY KEY, name TEXT, additional_column TEXT);'
      );

      while (true) {
        const response = await fetch(`${apiUrl}?page=${page}&page_size=${pageSize}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        });
        if (!response.ok) throw new Error('Erreur réseau');

        const data = await response.json();
        if (data.length === 0) break;

        for (const row of data) {
          (await db).runAsync(
            'INSERT INTO data (id, name, additional_column) VALUES (?, ?, ?)',
            [row.id, row.name, row.additional_column]
          );
          console.log(`Donnée insérée pour l'id ${row.id}`);
        }

        page++;
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
