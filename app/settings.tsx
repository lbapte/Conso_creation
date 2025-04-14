import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Auth } from 'aws-amplify';
import LogoBlanc from '../assets/svg/LogoBlanc.svg';

type SettingsScreenProps = {
  onClose: () => void;
};

export default function SettingsScreen({ onClose }: SettingsScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [email, setEmail] = useState(''); // Add state for email during sign-up
  const [isSignUp, setIsSignUp] = useState(false); // Add state to toggle between sign-in and sign-up


  // Check for existing session on component mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const user = await Auth.currentAuthenticatedUser();
        if (user) {
          setIsLoggedIn(true);
          //  Get company name from user attributes.  Cognito stores user attributes.
          const storedCompanyName = await AsyncStorage.getItem('entreprise');
          setCompanyName(storedCompanyName || ''); //  Use stored value or empty string
        }
      } catch (error) {
        //  Not signed in
        setIsLoggedIn(false);
      }
    };
    checkSession();
  }, []);

  const handleLogin = async () => {
    try {
      if (isSignUp) {
        // Handle Sign Up
        const { user } = await Auth.signUp({
          username,
          password,
          attributes: {
            email,       //  Make sure to collect email
            'custom:companyName': companyName,  //  If you have this as a custom attribute
          },
        });
        console.log('Sign up successful:', user);
        Alert.alert('Success', 'Account created! Please confirm your email.');
        setIsSignUp(false); // Switch to sign in after successful sign up
      } else {
        // Handle Sign In
        const user = await Auth.signIn(username, password);
        console.log('Sign in successful:', user);

        // Get the company name.  This is in the user.attributes
        const companyNameFromCognito = user.attributes['custom:companyName'] || '';
        setCompanyName(companyNameFromCognito);

        // Store JWT and company name in AsyncStorage
        await AsyncStorage.setItem('jwt', user.signInUserSession.accessToken.jwtToken);
        await AsyncStorage.setItem('entreprise', companyNameFromCognito);
        setIsLoggedIn(true);
        Alert.alert('Success', 'Login successful');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Error', error.message || 'Failed to login');
    }
  };

  const handleLogout = async () => {
    try {
      await Auth.signOut();
      await AsyncStorage.removeItem('jwt');
      await AsyncStorage.removeItem('entreprise');
      setIsLoggedIn(false);
      setCompanyName('');
      Alert.alert('Success', 'Logged out');
    } catch (error: any) {
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
            <Text style={styles.title}>{isSignUp ? 'Créer un compte' : "Vous n'êtes pas encore connecté"}</Text>
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
            {isSignUp && ( //  Show email field only during sign-up
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#FFFFFF"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            )}
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
             {isSignUp && (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Company Name"
                  placeholderTextColor="#FFFFFF"
                  value={companyName}
                  onChangeText={setCompanyName}
                />
              </View>
            )}
            <TouchableOpacity style={styles.mainButton} onPress={handleLogin}>
              <Text style={styles.mainButtonText}>{isSignUp ? 'S\'inscrire' : 'Se connecter'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
              <Text style={styles.toggleButtonText}>
                {isSignUp ? 'Déjà un compte? Se connecter' : 'Créer un compte'}
              </Text>
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
  toggleButtonText: { color: '#FFFFFF', fontSize: 16, textDecorationLine: 'underline', marginTop: 10 },
});
