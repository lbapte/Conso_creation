import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import { handleDownloadData,caca } from '../utils/database';
import { useAuth } from '../utils/connect';

export default function SettingsScreen({  }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  /*const [jwt, setJwt] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [companyName, setCompanyName] = useState('');*/

  const API_URL = 'http:localhost:5000'; // Remplacez par l'URL de votre serveur

  const { jwt,setJwt,companyName,setCompanyName,isLoggedIn,setIsLoggedIn,checkLoginStatus } = useAuth();

  useEffect(() => {
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
        console.log(jwt);
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
    setJwt('');
    setIsLoggedIn(false);
    Alert.alert('Déconnexion', 'Vous avez été déconnecté');
  };
  

  return (
    <View style={styles.container}>
      {isLoggedIn ? (
        <View>
          <Text style={styles.welcomeText}>Bienvenue, {companyName} !</Text>
          <Button title="Charger les données" onPress={handleDownloadData} />
          <Button title="Se déconnecter" onPress={handleLogout} />
          <Button title="Voir données" onPress={caca} />
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
