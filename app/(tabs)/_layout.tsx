import { Tabs } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, AppState, AppStateStatus } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SettingsScreen from '../settings'; 
import Logo from '../../assets/svg/Logo.svg'; 
import Recherche from '../../assets/svg/Recherche.svg';
import Historique from '../../assets/svg/Historique.svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

export default function TabLayout() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const appStateRef = useRef(appState);
  appStateRef.current = appState;

  const [hasNewData, setHasNewData] = useState(false);

  const checkNewData = async () => {
    try {
      const newDataValue = await AsyncStorage.getItem('newData');
      setHasNewData(newDataValue === 'true');
    } catch (error) {
      console.error('Erreur lors de la récupération de newData :', error);
    }
  };

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        checkNewData();
      }
      setAppState(nextAppState);
      checkNewData();
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    // On check au montage
    checkNewData();

    return () => {
      subscription.remove();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkNewData();
    }, [])
  );

  return (
    <LinearGradient colors={['#3A3FD4', '#7377FD']} style={styles.gradientContainer}>
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            // Inversion des couleurs
            tabBarActiveTintColor: '#98FFBF',     // icône blanche quand l'onglet est actif
            tabBarInactiveTintColor: '#FFF', // icône vert clair quand il est inactif
            tabBarStyle: {
              display: 'flex',
              height: '10%',
              marginTop: 15,
              borderTopWidth: 0,
              backgroundColor: 'transparent',
            },
            headerShown: false,
          }}
        >
          <Tabs.Screen
            name="explore"
            options={{
              title: 'Recherche',
              tabBarIcon: ({ color }) => (
                <View style={styles.indicator}>
                  <Recherche width={30} height={30} fill={color} style={{ color }} />
                </View>
              ),
            }}
          />
          <Tabs.Screen
            name="index"
            options={{
              title: 'Scan',
              tabBarIcon: ({ color }) => (
                <View style={styles.indicator}>
                  <Logo width={35} height={35} fill={color} style={{ color }} />
                </View>
              ),
            }}
          />
          <Tabs.Screen
            name="historique"
            options={{
              title: 'Historique',
              tabBarIcon: ({ color }) => (
                <View style={styles.indicator}>
                  <Historique width={30} height={30} fill={color} style={{ color }} />
                </View>
              ),
            }}
          />
        </Tabs>

        {/* Bouton Paramètres */}
        <TouchableOpacity onPress={() => setIsSettingsOpen(true)} style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={30} color={hasNewData ? 'red' : '#7377FD'} />
        </TouchableOpacity>

        {/* Modale pour Paramètres */}
        <Modal visible={isSettingsOpen} animationType="slide" transparent>
          <SettingsScreen onClose={() => setIsSettingsOpen(false)} />
        </Modal>
      </View>
    </LinearGradient>
  );
}
 
const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
    height: 100,
  },
  settingsButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 10,
    borderRadius: 50,
  },
  indicator: {
    width: 35,
    height: 50,
  },
});
