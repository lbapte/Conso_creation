import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  Alert,
  GestureResponderEvent,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import LogoBlanc from '../assets/svg/LogoBlanc.svg';

// Define the type for the onClose prop
type SettingsScreenProps = {
  onClose: () => void;
};

export default function SettingsScreen({ onClose }: SettingsScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [jwt, setJwt] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleLogin = async () => {
    try {
      const response = await axios.post('http://192.168.129.9:3000/auth/login', {
        username,
        password,
      });

      const data = response.data;
      if (data.token) {
        setJwt(data.token);
        setCompanyName(data.entreprise);
        setIsLoggedIn(true);
        await AsyncStorage.setItem('jwt', data.token);
        await AsyncStorage.setItem('entreprise', data.entreprise);
        Alert.alert('Success', 'Login successful');
      } else {
        Alert.alert('Error', 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Failed to connect to the server');
    }
  };

  const handleLogout = async (event: GestureResponderEvent) => {
    try {
      // Clear the JWT and company name from AsyncStorage
      await AsyncStorage.removeItem('jwt');
      await AsyncStorage.removeItem('entreprise');

      // Reset the state variables
      setJwt('');
      setCompanyName('');
      setIsLoggedIn(false);

      // Optionally, show a success message
      Alert.alert('Success', 'Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout');
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
  mainButton: {
    backgroundColor: '#98FFBF',
    padding: 12,
    borderRadius: 100,
    marginBottom: 20,
    width: '60%',
    alignItems: 'center',
  },
  mainButtonText: { color: '#454AD8', fontSize: 18 },
});
