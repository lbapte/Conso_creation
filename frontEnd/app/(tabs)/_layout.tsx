import { Tabs, usePathname } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, StyleSheet, TouchableOpacity, Modal, AppState, AppStateStatus, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import SettingsScreen from '../settings';
import Logo from '../../assets/svg/Logo.svg';
import Recherche from '../../assets/svg/Recherche.svg';
import Historique from '../../assets/svg/Historique.svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';
import { API_URL } from '../../utils/apiUrl';

import explore from './explore';
import historique from './historique';
import index from './index';

const Tab = createBottomTabNavigator();

export default function TabLayout() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hasNewData, setHasNewData] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const pathname = usePathname();

  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = await AsyncStorage.getItem('jwt');
      const storedCompanyName = await AsyncStorage.getItem('entreprise');
      if (token && storedCompanyName) {
        setCompanyName(storedCompanyName);
        setIsLoggedIn(true);
      }
    };
    checkLoginStatus();
  }, []);

  useEffect(() => {
    if (isLoggedIn && companyName) {
      const socket = io(API_URL, { transports: ['websocket'] });
      socket.on('connect', () => {
        console.log('Connecté au serveur Socket.IO');
        socket.emit('join_company', { company: companyName });
        console.log('Rejoint la room pour :', companyName);
      });
      socket.on('new_data', (data) => {
        console.log('Notification reçue :', data);
        if (data.company === companyName && data.submission_date) {
          setHasNewData(true);
          AsyncStorage.setItem('newData', 'true');
        }
      });
      return () => {
        socket.disconnect();
      };
    }
  }, [isLoggedIn, companyName]);

  useEffect(() => {
    const checkNewData = async () => {
      try {
        const newDataValue = await AsyncStorage.getItem('newData');
        setHasNewData(newDataValue === 'true');
      } catch (error) {
        console.error('Erreur lors de la récupération de newData :', error);
      }
    };
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkNewData();
      }
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    checkNewData();
    const interval = setInterval(() => {
      checkNewData();
    }, 2000);
    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, []);

  const showSettingsIcon = pathname === '/index' || pathname === '/';

  return (
    <View style={styles.contentContainer}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#98FFBF',
          tabBarInactiveTintColor: '#FFF',
          tabBarStyle: {
            position: 'absolute',
            marginLeft: '12.5%',
            bottom: 25,
            alignSelf: 'center',
            height: 60, // Change to a number
            width: '75%',
            marginBottom: 0,
            borderTopWidth: 0,
            backgroundColor: 'rgba(16,23,255,0.5)',
            borderRadius: 1000,
            overflow: 'hidden',
          },
          tabBarBackground: () => (
            <BlurView tint="light" intensity={50} style={StyleSheet.absoluteFill} />
          ),
          tabBarLabelStyle: {
            marginTop: 5,
            padding: 0,
            display: 'none',
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
                <Recherche width={30} height={30} fill={color} />
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
                <Logo width={35} height={35} fill={color} />
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
                <Historique width={30} height={30} fill={color} />
              </View>
            ),
          }}
        />
      </Tabs>

      {showSettingsIcon && (
        <>
          <TouchableOpacity onPress={() => setIsSettingsOpen(true)} style={styles.settingsButton}>
            <Ionicons
              name={hasNewData ? 'settings' : 'settings-outline'}
              size={30}
              color={hasNewData ? '#98FFBF' : '#7377FD'}
            />
          </TouchableOpacity>
          <Modal visible={isSettingsOpen} animationType="slide" transparent>
            <SettingsScreen onClose={() => setIsSettingsOpen(false)} />
          </Modal>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  absoluteFill: {
    borderRadius: 30,
  },
  footerSafeArea: {
    backgroundColor: 'transparent',
    width: 0,
  },
  indicator: {
    top: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 10,
    borderRadius: 50,
  },
});
