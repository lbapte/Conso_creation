import { Tabs } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SettingsScreen from '../settings'; // Vérifiez que ce chemin est bon
import Logo from '../../assets/svg/Logo.svg'; // Votre SVG doit utiliser "currentColor" pour les fills
import Recherche from '../../assets/svg/Recherche.svg';
import Historique from '../../assets/svg/Historique.svg';

export default function TabLayout() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <LinearGradient colors={['#3A3FD4', '#7377FD']} style={styles.gradientContainer}>
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: '#98FFBF',
            tabBarInactiveTintColor: 'white',
            tabBarStyle: {
              display: 'flex',
              height: '10%',
              marginTop: 15,
              borderTopWidth: 0,
              backgroundColor: 'transparent',
            },
            headerShown: false, // Supprime le header blanc
          }}
        >
            <Tabs.Screen
            name="explore"
            options={{
              title: 'Recherche',
              tabBarIcon: ({ color, focused }) => (
                <View style={styles.indicator}>
                {/* On passe la couleur à la fois via la prop `fill` et via le style */}
                <Recherche width="30" height="30" fill={color} style={{ color: color }} />
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
                  {/* On passe la couleur à la fois via la prop `fill` et via le style */}
                  <Logo width="35" height="35" fill={color} style={{ color: color }} />
                </View>
              ),
            }}
          />
          <Tabs.Screen
            name="historique"
            options={{
              title: 'Historique',
              tabBarIcon: ({ color, focused }) => (
                <View style={styles.indicator}>
                {/* On passe la couleur à la fois via la prop `fill` et via le style */}
                <Historique width="30" height="30" fill={color} style={{ color: color }} />
              </View>
              ),
            }}
          />
        </Tabs>

        {/* Bouton Paramètres */}
        <TouchableOpacity onPress={() => setIsSettingsOpen(true)} style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={30} color="#7377FD" />
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
