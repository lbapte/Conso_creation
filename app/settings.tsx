import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { API_URL } from '../utils/apiUrl';
import { 
  fetchDataPage, 
  getRemoteTotalRowCount, 
  cleanTable, 
  loadingData  // Cette fonction doit pouvoir utiliser un callback pour la progression
} from '../utils/database';
import LogoBlanc from '../assets/svg/LogoBlanc.svg';
import io from 'socket.io-client';

export default function SettingsScreen({ onClose }) {
  // États pour l'authentification
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [jwt, setJwt] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // États pour le téléchargement/insertion des données
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0); // en pourcentage
  const [currentPage, setCurrentPage] = useState(0);
  const [phase, setPhase] = useState('download'); // 'download' ou 'insertion'

  // État pour la notification (nouvelles données)
  const [hasNewData, setHasNewData] = useState(false);

  // Calcul de la largeur de la barre de progression (80% de la largeur de l'écran)
  const screenWidth = Dimensions.get('window').width;
  const progressBarTotalWidth = screenWidth * 0.8;

  // Vérifier le statut de connexion au montage du composant
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

  // Établir la connexion Socket.IO dès que l'utilisateur est connecté
  /*useEffect(() => {
    if (isLoggedIn && companyName) {
      const socket = io(API_URL, { transports: ['websocket'] });
      socket.on('connect', () => {
        console.log('Connecté au serveur Socket.IO');
        socket.emit('join_company', { company: companyName });
        console.log('Rejoint la room pour :', companyName);
      });
      socket.on('new_data', (data) => {
        console.log('Notification reçue : ', data);
        if (data.company === companyName && data.submission_date) {
          setHasNewData(true);
          // Mettre à jour la valeur globale dans AsyncStorage
          AsyncStorage.setItem('newData', 'true');
        }
      });
      return () => socket.disconnect();
    }
  }, [isLoggedIn, companyName]);*/

  // Gestion de la connexion
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

  const handleLogout = async () => {
    await AsyncStorage.removeItem('jwt');
    setJwt('');
    setIsLoggedIn(false);
    alert('Déconnexion réussie');
  };

  // Fonction qui gère le téléchargement (phase 1) et l'insertion (phase 2)
  const handleLoadData = async () => {
    setIsLoading(true);
    setProgress(0);
    setCurrentPage(0);
    setPhase('download');
    try {
      // PHASE 1 : Téléchargement des données
      const totalRows = await getRemoteTotalRowCount('TD_oui'); // adapter le nom de la table distante
      const pageSize = 1000;
      let pageNumber = 1;
      let loadedRows = 0;
      let data = [];

      // Nettoyer la table locale
      cleanTable('data');

      do {
        setCurrentPage(pageNumber);
        data = await fetchDataPage('TD_oui', 'data', pageSize, pageNumber);
        loadedRows += data.length;
        let calcProgress = (loadedRows / totalRows) * 100;
        if (calcProgress > 100) calcProgress = 100;
        setProgress(calcProgress);
        pageNumber++;
      } while (data.length === pageSize);

      alert('Téléchargement terminé');
      
      // Après téléchargement, on considère que les données ont été récupérées, on réinitialise le flag
      setHasNewData(false);
      await AsyncStorage.setItem('newData', 'false');

      // Optionnel : Vous pouvez ajouter ici la phase d'insertion si nécessaire (phase 'insertion')
      // Par exemple, si loadingData gère une insertion supplémentaire :
      // setProgress(0);
      // setPhase('insertion');
      // await loadingData((insertionProgress) => {
      //   setProgress(insertionProgress);
      // });
      // alert('Insertion des données réussie');
    } catch (error) {
      console.error('Erreur lors du chargement des données :', error);
      alert('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#454AD8', '#7579FF']} style={styles.gradientBackground}>
      <View style={styles.backgroundContainer}>
        <LogoBlanc style={styles.backgroundLogo} width={400} height={400} />
      </View>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Text style={styles.backButtonText}>{'< Retour'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        {isLoggedIn ? (
          <View style={styles.loggedInContainer}>
            <Text style={styles.welcomeText}>Nom retourné : {companyName}</Text>
            {/* Affichage de la notification : nouvelle donnée détectée */}
            {hasNewData ? (
              <Text style={styles.notificationText}>Nouvelles données à dispo</Text>
            ) : (
              <Text style={styles.notificationText}>Aucune nouvelle donnée reçue.</Text>
            )}
            <Text style={styles.subtitle}>Nouvelles données disponibles :</Text>
            <TouchableOpacity
              style={styles.mainButton}
              onPress={handleLoadData}
              disabled={isLoading}
            >
              <Text style={styles.mainButtonText}>Charger les données</Text>
            </TouchableOpacity>
            {isLoading && (
              <View style={styles.loadingContainer}>
                {phase === 'download' ? (
                  <Text style={styles.loadingText}>
                    Téléchargement en cours... - {progress.toFixed(0)}%
                  </Text>
                ) : (
                  <Text style={styles.loadingText}>
                    Insertion en cours... - {progress.toFixed(0)}%
                  </Text>
                )}
                <View style={[styles.progressBar, { width: progressBarTotalWidth }]}>
                  <View
                    style={[
                      styles.progress,
                      { width: (progressBarTotalWidth * progress) / 100 },
                    ]}
                  />
                </View>
                {phase === 'download' && (
                  <Text style={styles.pageText}>Page {currentPage}</Text>
                )}
              </View>
            )}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutText}>Se déconnecter</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.loginContainer}>
            <Text style={styles.title}>Vous n'êtes pas encore connecté</Text>
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
  gradientBackground: { flex: 1, padding: 20 },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundLogo: {
    position: 'absolute',
    opacity: 0.3,
    transform: [{ rotate: '-20deg' }, { scale: 1.6 }],
  },
  header: { marginTop: 40 },
  backButton: { marginBottom: 20 },
  backButtonText: { color: '#FFFFFF', fontSize: 18 },
  container: { flex: 1, justifyContent: 'center' },
  loggedInContainer: { alignItems: 'center' },
  welcomeText: { color: '#FFFFFF', fontSize: 20, marginBottom: 10 },
  notificationText: { color: '#FFFFFF', fontSize: 16, marginBottom: 10 },
  subtitle: { color: '#FFFFFF', fontSize: 16, marginBottom: 20 },
  mainButton: {
    backgroundColor: '#98FFBF',
    padding: 12,
    borderRadius: 100,
    marginBottom: 20,
    width: '60%',
    alignItems: 'center',
  },
  mainButtonText: { color: '#454AD8', fontSize: 18 },
  logoutButton: { marginTop: 10 },
  logoutText: { color: '#FFFFFF', fontSize: 16 },
  loginContainer: { alignItems: 'center' },
  title: { color: '#FFFFFF', fontSize: 22, marginBottom: 20 },
  inputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 100,
    padding: 12,
    marginBottom: 15,
    width: '80%',
  },
  input: { color: '#FFFFFF', fontSize: 16 },
  loadingContainer: { alignItems: 'center', marginVertical: 10 },
  loadingText: { color: '#FFFFFF', fontSize: 16, marginBottom: 10 },
  progressBar: {
    height: 7,
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progress: { height: '100%', backgroundColor: '#98FFBF' },
  pageText: { color: '#FFFFFF', marginTop: 5 },
});
