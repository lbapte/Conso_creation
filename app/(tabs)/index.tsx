import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CameraView, CameraType, BarcodeScanningResult } from 'expo-camera';
import {setupDatabase, insertBarcode, getBarcodes} from '../../utils/database';
import { useNavigation } from '@react-navigation/native';
import Svg, { Circle, Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';


//import ScanIndicator from "../assets/svg/HG.svgx";

setupDatabase();

export default function Scanner() {
  const [scanned, setScanned] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null); // État pour le code scanné

  const navigation = useNavigation();

  const handleBarCodeScanned = ({ data }: BarcodeScanningResult) => {
    setScanned(true);
    setScannedCode(data); // Mettre à jour avec le code scanné
    insertBarcode(data);
    setTimeout(() => setScanned(false), 2000); // Mettre en pause le scan au bout de 2 secondes
    //navigation.navigate("historique");
  };

  return (
    <SafeAreaView style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />      
      {scannedCode && (
        <Text style={styles.codeText}>Code scanné : {scannedCode}</Text>
      )}
      <SafeAreaView style={styles.containerTwo}>
        <View style={styles.indicator}>
          <Circle cx="10" cy="10" r="10" fill={scanned ? "green" : "red"} />
        </View>
        <Svg style={styles.indicator2}>
          <Circle cx="10" cy="10" r="10" fill={scanned ? "green" : "red"} />
        </Svg>
        <Svg style={styles.indicator3}>
          <Circle cx="10" cy="10" r="10" fill={scanned ? "green" : "red"} />
        </Svg>
        <Svg style={styles.indicator4}>
          <Circle cx="10" cy="10" r="10" fill={scanned ? "green" : "red"} />
        </Svg>
      </SafeAreaView>

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
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'space-between',
    padding: 20,
  },
  codeText: {
    position: 'absolute',
    bottom: 50,
    fontSize: 18,
    color: 'black',
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 4,
  },
  // Styles pour positionner les SVG dans les coins
  scanIndicators: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'space-between',
    padding: 20,
  },
  indicator: {
    width: 50,
    height: 50,
    left:10,
  },
  indicator2: {
    width: 20,
    height: 100,
    right:10,
  },
  indicator3: {
    width: 300,
    height: 20,
    bottom:20,
  },
  indicator4: {
    width: 20,
    height: 20,
    right:10,
  },
});

