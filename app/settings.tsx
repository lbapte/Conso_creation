import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import {API_URL} from '../utils/apiUrl';
import { handleDownloadData,loadingData } from '../utils/database';

// Importation du logo (en .svg, utilisé comme composant si tu as bien configuré 'react-native-svg')
import LogoBlanc from '../assets/svg/LogoBlanc.svg';

export default function SettingsScreen({ onClose }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [jwt, setJwt] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [companyName, setCompanyName] = useState('');

  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);


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

      const data = await response.json();
      if (data.token) {
        setJwt(data.token);
        setCompanyName(data.entreprise);
        setIsLoggedIn(true);
        await AsyncStorage.setItem('jwt', data.token);
        await AsyncStorage.setItem('entreprise', data.entreprise);
        alert('Connexion réussie');
      } else {
        alert('Échec de la connexion');
      }
    } catch (error) {
      alert('Impossible de se connecter au serveur');
    }
  };

  console.log('jwt : ',jwt,' entreprise : ',companyName)

  const handleLogout = async () => {
    await AsyncStorage.removeItem('jwt');
    setJwt('');
    setIsLoggedIn(false);
    alert('Déconnexion réussie');
  };

  return (
    <LinearGradient
      colors={['#454AD8', '#7579FF']}
      style={styles.gradientBackground}
    >
      {/* Logo en fond, derrière tous les éléments */}
      <View style={styles.backgroundContainer}>
        <LogoBlanc style={styles.backgroundLogo} width={400} height={400} />
      </View>

      {/* Zone du bouton retour */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Text style={styles.backButtonText}>{'< Retour'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        {isLoggedIn ? (
          <View style={styles.loggedInContainer}>
            <Text style={styles.welcomeText}>
              Nom retourné : {companyName}
            </Text>
            <Text style={styles.subtitle}>
              Nouvelles données disponibles :
            </Text>
            <TouchableOpacity
              style={styles.mainButton}
              onPress={loadingData}
            >
              <Text style={styles.mainButtonText}>Charger les données</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutText}>Se déconnecter</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.loginContainer}>
            <Text style={styles.title}>
              Vous n'êtes pas encore connecté
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder={usernameFocused ? '' : 'Identifiant'}
                placeholderTextColor="#FFFFFF"
                value={username}
                onChangeText={setUsername}
                onFocus={() => setUsernameFocused(true)}
                onBlur={() => setUsernameFocused(false)}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder={passwordFocused ? '' : 'Mot de passe'}
                placeholderTextColor="#FFFFFF"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
            </View>

            <TouchableOpacity style={styles.mainButton} onPress={handleLogin}>
              <Text style={styles.mainButtonText}>S'authentifier</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  // Conteneur absolu pour le logo en fond
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // On le centre
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Logo en filigrane
  backgroundLogo: {
    transform: [{ rotate: '-20deg' },{scale:1.6}],
    opacity: 0.3,
  },
  header: {
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  backButton: {},
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    flex: 1,
    // Pour centrer verticalement et horizontalement le contenu
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loginContainer: {
    width: '100%',
    alignItems: 'center',
  },
  loggedInContainer: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    height: 50,
    borderColor: '#FFFFFF',
    borderWidth: 2,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  input: {
    width: '90%',
    height: '100%',
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  mainButton: {
    backgroundColor: '#98FFBF',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginTop: 15,
  },
  mainButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  welcomeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 20,
  },
  logoutButton: {
    marginTop: 20,
  },
  logoutText: {
    color: '#FFFFFF',
    textDecorationLine: 'underline',
    fontSize: 14,
  },
});
