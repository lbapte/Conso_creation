import React, { useState, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { initializeApp } from "firebase/app";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Firebase configuration (replace with your actual config)
const firebaseConfig = {
  apiKey: "AIzaSyCpBrRXFkTcfLPSXSW4RAnEjHfEeUOpsig",
  authDomain: "hooksapp-47eaa.firebaseapp.com",
  projectId: "hooksapp-47eaa",
  storageBucket: "hooksapp-47eaa.firebasestorage.app",
  messagingSenderId: "582662927861",
  appId: "1:582662927861:web:3ac301da48d16ac2a35cbc",
  measurementId: "G-Y1CSM7980N",
};

// Initialize Firebase (only once)
try {
  initializeApp(firebaseConfig);
} catch (error) {
  // Ignore "already initialized" error
  if (error.code !== "app/duplicate-app") {
    console.error("Firebase initialization error:", error);
  }
}

type SettingsScreenProps = {
  onClose: () => void;
};

export default function SettingsScreen({ onClose }: SettingsScreenProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [email, setEmail] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoggedIn(true);
        AsyncStorage.getItem("entreprise").then((storedCompanyName) => {
          setCompanyName(storedCompanyName || "");
        });
      } else {
        setIsLoggedIn(false);
        setCompanyName("");
      }
    });

    return () => unsubscribe();
  }, [auth]);

  const handleLogin = async () => {
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;
        console.log("Sign up successful:", user);
        Alert.alert("Success", "Account Created!");
        await AsyncStorage.setItem("entreprise", companyName);
        setIsSignUp(false);
      } else {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          username,
          password
        );
        const user = userCredential.user;
        console.log("Sign in successful:", user);
        const storedCompanyName = await AsyncStorage.getItem("entreprise");
        setCompanyName(storedCompanyName || "");
        setIsLoggedIn(true);
        Alert.alert("Login Successful!");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      Alert.alert("Error", error.message || "Failed to login");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem("entreprise");
      setIsLoggedIn(false);
      setCompanyName("");
      Alert.alert("Logged out");
    } catch (error: any) {
      console.error("Logout error:", error);
      Alert.alert("Error", "Logout Failed");
    }
  };

  return (
    <LinearGradient
      colors={["#454AD8", "#7579FF"]}
      style={styles.gradientBackground}
    >
      <View style={styles.backgroundContainer}>
        {/* Remplacer par une image React Native, ou un composant SVG si vous avez une librairie pour */}
        {/* <img
          src="/path/to/your/LogoBlanc.svg"
          alt="Logo"
          style={styles.backgroundLogo}
          width={400}
          height={400}
        /> */}
        {/* Exemple avec un Text, à adapter selon votre asset LogoBlanc */}
        <Text style={styles.backgroundLogo}>Logo</Text>
      </View>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Text style={styles.backButtonText}>{"< Retour"}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        {isLoggedIn ? (
          <View style={styles.loggedInContainer}>
            <Text style={styles.welcomeText}>Nom retourné : {companyName}</Text>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutText}>Se déconnecter</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.loginContainer}>
            <Text style={styles.title}>
              {isSignUp ? "Créer un compte" : "Vous n'êtes pas encore connecté"}
            </Text>
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder={usernameFocused ? "" : "Identifiant (Email)"}
                  placeholderTextColor="#FFFFFF"
                  value={username}
                  onChangeText={(e) => setUsername(e)} //  Simplifié
                  onFocus={() => setUsernameFocused(true)}
                  onBlur={() => setUsernameFocused(false)}
                />
              </View>
              {isSignUp && (
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#FFFFFF"
                    value={email}
                    onChangeText={(e) => setEmail(e)} // Simplifié
                  />
                </View>
              )}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  type="password"
                  placeholder={passwordFocused ? "" : "Mot de passe"}
                  placeholderTextColor="#FFFFFF"
                  value={password}
                  onChangeText={(e) => setPassword(e)} // Simplifié
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
                    onChangeText={(e) => setCompanyName(e)} // Simplifié
                  />
                </View>
              )}
              <TouchableOpacity style={styles.mainButton} onPress={handleLogin}>
                <Text style={styles.mainButtonText}>
                  {isSignUp ? "S'inscrire" : "Se connecter"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
                <Text style={styles.toggleButtonText}>
                  {isSignUp
                    ? "Déjà un compte? Se connecter"
                    : "Créer un compte"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBackground: { flex: 1, padding: 20 },
  backgroundContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  backgroundLogo: {
    position: "absolute",
    opacity: 0.3,
    transform: [{ rotate: "-20deg" }, { scale: 1.6 }],
    // width: 400,  // Ces propriétés ne sont pas directement utilisables dans un StyleSheet React Native
    // height: 400,
    color: "#FFFFFF", // Couleur du texte pour le Text de remplacement
    fontSize: 24,
    fontWeight: "bold",
  },
  header: { marginTop: 40 },
  backButton: { marginBottom: 20 },
  backButtonText: { color: "#FFFFFF", fontSize: 18 },
  container: { flex: 1, justifyContent: "center" },
  loggedInContainer: { alignItems: "center" },
  welcomeText: { color: "#FFFFFF", fontSize: 20, marginBottom: 10 },
  logoutButton: { marginTop: 10 },
  logoutText: { color: "#FFFFFF", fontSize: 16 },
  loginContainer: { alignItems: "center" },
  title: { color: "#FFFFFF", fontSize: 22, marginBottom: 20 },
  inputContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 100,
    padding: 12,
    marginBottom: 15,
    width: "80%",
  },
  input: { color: "#FFFFFF", fontSize: 16 },
  mainButton: {
    backgroundColor: "#98FFBF",
    padding: 12,
    borderRadius: 100,
    marginBottom: 20,
    width: "60%",
    alignItems: "center",
  },
  mainButtonText: { color: "#454AD8", fontSize: 18 },
  toggleButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    textDecorationLine: "underline",
    marginTop: 10,
  },
  form: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
});
