import { Tabs } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function TabLayout() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={['#3A3FD4', '#7377FD']}
      style={styles.gradientContainer}
    >
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: '#98FFBF',
            tabBarInactiveTintColor: 'white',
            tabBarStyle: {
              display: "flex",
              marginTop: 5,
              borderTopWidth: 0,
              backgroundColor: "transparent",
            },
            headerShown: true, // Affiche un en-tête sur toutes les pages
            headerTransparent: true,
            headerTitle: '', // Pas de titre affiché dans l'en-tête
            headerRight: () => (
              <TouchableOpacity
                onPress={() => router.push('../settings')}
                style={styles.settingsButton}
              >
                <Ionicons name="settings-outline" size={24} color="#7377FD" />
              </TouchableOpacity>
            ),
          }}
        >
          <Tabs.Screen
            name="explore"
            options={{
              title: 'Explore',
              tabBarIcon: ({ color, focused }) => (
                <TabBarIcon name={focused ? 'search' : 'search-outline'} color={color} size={35} />
              ),
            }}
          />
          <Tabs.Screen
            name="index"
            options={{
              title: 'Scan',
              tabBarIcon: ({ color, focused }) => (
                <TabBarIcon name={focused ? 'scan' : 'scan-outline'} color={color} size={40} />
              ),
            }}
          />
          <Tabs.Screen
            name="historique"
            options={{
              title: 'Historique',
              tabBarIcon: ({ color, focused }) => (
                <TabBarIcon name={focused ? 'timer' : 'timer-outline'} color={color} size={35} />
              ),
            }}
          />
        </Tabs>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: { flex: 1 },
  settingsButton: { marginRight: 15 },
});
