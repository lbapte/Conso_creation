import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Modal, Animated, Easing } from 'react-native';
import { CameraView, BarcodeScanningResult } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg from 'react-native-svg';
import HD from '../../assets/svg/haut_droit.svg';
import HG from '../../assets/svg/haut-gauche.svg';
import BG from '../../assets/svg/bas_gauche.svg';
import BD from '../../assets/svg/bas_droit.svg';
import ResultModal from '../resultat';
import * as Haptics from 'expo-haptics';
import {insertHistoriqueEntry} from '../../utils/baseHistorique';
import {getIntitule,getData,checkForNewData,codeEAN,denominationProduit} from '../../utils/database';

export default function Scanner() {
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  // "progress" incrémente toutes les 100ms et va de 0 à THRESHOLD (7 = 0,7 s)
  const [progress, setProgress] = useState(0);
  // La couleur passe au vert dès qu'on est en phase de chargement
  const svgColor = "#3A3FD4";

  // Animated.Value pour l'effet d'étirement (ici, l'animation se fait de 0 à 1)
  const spreadAnim = useRef(new Animated.Value(0)).current;
  const prevProgressRef = useRef(0);

  // Références pour gérer l'intervalle de progression et le timeout de réinitialisation
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Pour s'assurer que la vibration du milieu ne se déclenche qu'une seule fois
  const midHapticTriggeredRef = useRef(false);


  const THRESHOLD = 7; // 7 x 100ms = 0,7 s

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    };
  }, []);

  // Animation du "stretch" avec effet élastique lors du relâchement
  useEffect(() => {
    if (progress === 0 && prevProgressRef.current > 0) {
      // Au relâchement, on revient à 0 avec un effet spring (élastique)
      Animated.spring(spreadAnim, {
        toValue: 0,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      // Pendant l'incrémentation, une interpolation fluide (durée 150 ms, easing doux)
      Animated.timing(spreadAnim, {
        toValue: progress / THRESHOLD,
        duration: 150,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }).start();
    }
    prevProgressRef.current = progress;
  }, [progress, spreadAnim]);

  const handleBarCodeScanned = useCallback(
    ({ data }: BarcodeScanningResult) => {
      if (modalVisible) return; // Ne rien faire si la modale est ouverte
      
      setScannedCode(data);
      

      // Vibration légère dès le début du chargement
      if (progress === 0) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        midHapticTriggeredRef.current = false;
      }

      // Démarrer l'incrémentation si ce n'est pas déjà lancé
      if (!progressIntervalRef.current) {
        progressIntervalRef.current = setInterval(() => {
          setProgress((prev) => {
            const newProgress = prev + 1;
            // Vibration intermédiaire (vers 0,4 s)
            if (newProgress >= 4 && !midHapticTriggeredRef.current && newProgress < THRESHOLD) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              midHapticTriggeredRef.current = true;
            }
            // Lorsque le chargement est complet (0,7 s)
            if (newProgress >= THRESHOLD) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              (async () => {
                const intitule = await getIntitule(data, codeEAN[0], denominationProduit[0]);
                insertHistoriqueEntry(intitule,data, 'scan');
              })();
              setModalVisible(true);
              if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = null;
              }
              return 0;
            }
            return newProgress;
          });
        }, 100);
      }

      // Si aucune nouvelle détection n'intervient pendant 200 ms, réinitialisation (retour elastic)
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
      resetTimeoutRef.current = setTimeout(() => {
        setProgress(0);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      }, 200);
    },
    [modalVisible, progress]
  );

  const handleModalClose = () => {
    setModalVisible(false);
    setScannedCode(null);
    setProgress(0);
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
    midHapticTriggeredRef.current = false;
  };

  return (
    <SafeAreaView style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={modalVisible ? undefined : handleBarCodeScanned}
      />

      {/* Indicateurs (crochets) affichés aux positions par défaut
          et animés par translation (aucune rotation) */}
      <SafeAreaView style={styles.containerTwo}>
        <Animated.View
          style={[
            styles.indicator,
            {
              transform: [
                {
                  translateX: spreadAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 20], // HG se déplace vers la droite
                  }),
                },
                {
                  translateY: spreadAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 20], // et vers le bas
                  }),
                },
              ],
            },
          ]}
        >
          <HG fill={svgColor} width={'40'} height={'40'} />
        </Animated.View>
        <Animated.View
          style={[
            styles.indicator2,
            {
              transform: [
                {
                  translateX: spreadAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -20], // HD se déplace vers la gauche
                  }),
                },
                {
                  translateY: spreadAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 20], // et vers le bas
                  }),
                },
              ],
            },
          ]}
        >
          <HD fill={svgColor} width={'40'} height={'40'} />
        </Animated.View>
        <Animated.View
          style={[
            styles.indicator3,
            {
              transform: [
                {
                  translateX: spreadAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 20], // BG se déplace vers la droite
                  }),
                },
                {
                  translateY: spreadAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -20], // et vers le haut
                  }),
                },
              ],
            },
          ]}
        >
          <BG fill={svgColor} width={'40'} height={'40'} />
        </Animated.View>
        <Animated.View
          style={[
            styles.indicator4,
            {
              transform: [
                {
                  translateX: spreadAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -20], // BD se déplace vers la gauche
                  }),
                },
                {
                  translateY: spreadAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -20], // et vers le haut
                  }),
                },
              ],
            },
          ]}
        >
          <BD fill={svgColor} width={'40'} height={'40'} />
        </Animated.View>
      </SafeAreaView>

      {/* Modale affichant le résultat du scan */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <ResultModal barcode={scannedCode} onClose={handleModalClose} />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  containerTwo: {
    position: 'absolute',
    justifyContent: 'space-between',
    flexDirection: 'row',
    padding: '20%',
    width: '100%',
    height: '100%',
  },
  indicator: {
    opacity: 0.8,
    position: 'absolute',
    left: '7%',
    top: '30%',
    width: 40,
    height: 40,
  },
  indicator2: {
    opacity: 0.8,
    position: 'absolute',
    right: '7%',
    top: '30%',
    width: 40,
    height: 40,
  },
  indicator3: {
    opacity: 0.8,
    position: 'absolute',
    left: '7%',
    bottom: '20%',
    width: 40,
    height: 40,
  },
  indicator4: {
    opacity: 0.8,
    position: 'absolute',
    right: '7%',
    bottom: '20%',
    width: 40,
    height: 40,
  },
});
