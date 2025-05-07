// src/components/LoadingAnimation.tsx
import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
// Ajustez le chemin si nécessaire : ici on part du principe que votre
// Logo.tsx est dans le même dossier que LoadingAnimation.tsx
import Logo from '../assets/svg/LB';

export default function LoadingAnimation(): JSX.Element {
  return (
    <LinearGradient
      colors={['#3A3FC8', '#6B6FF0']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.background}
    >
      {/* Passez les props d’opacité si vous voulez piloter chaque crochet */}
      <Logo
        width={200}
        height={200}
        Opacity1={1}
        Opacity2={1}
        Opacity3={1}
        Opacity4={1}
        Opacity5={1}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
