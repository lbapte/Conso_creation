import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CameraView, CameraType, BarcodeScanningResult } from 'expo-camera';
import {setupDatabase, insertBarcode, getBarcodes} from '../../utils/database';
import { useNavigation } from '@react-navigation/native';
import Svg, { Circle, Path } from 'react-native-svg';
import HD from '../../assets/svg/haut_droit.svg';
import HG from '../../assets/svg/haut-gauche.svg';
import BG from '../../assets/svg/bas_gauche.svg';
import BD from '../../assets/svg/bas_droit.svg';
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
          <HG fill={scanned ? "green" : "red"} width={'40'} height={'40'} />
        </View>
        <Svg style={styles.indicator2}>
          <HD fill={scanned ? "green" : "red"} width={'40'} height={'40'}/>
        </Svg>
        <Svg style={styles.indicator3}>
          <BG fill={scanned ? "green" : "red"} width={'40'} height={'40'}/>
        </Svg>
        <Svg style={styles.indicator4}>
          <BD fill={scanned ? "green" : "red"} width={'40'} height={'40'}/>
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
    //...StyleSheet.absoluteFillObject,
    position:'absolute',
    justifyContent: 'space-between',
    flexDirection: 'row',
    padding :'20%',
    //alignContent: 'space-between',
    //backgroundColor:'red',
    width:'100%',
    height:'100%',
  },
  codeText: {
    position: 'absolute',
    //bottom: 50,
    fontSize: 18,
    color: 'black',
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 4,
  },
  // Styles pour positionner les SVG dans les coins
  
  indicator: {
    opacity:0.8,
    position: 'absolute',
    left: '7%',
    top: '15%',
    width: 40,
    height: 40,
  },
  indicator2: {
    opacity:0.8,
    right: '7%',
    top: '15%',
    position: 'absolute',
    width: 40,
    height: 40,
  },
  indicator3: {
    opacity:0.8,
    position: 'absolute',
    left: '7%',
    bottom: '2%',
    width: 40,
    height: 40,
  
  },
  indicator4: {
    opacity:0.8,
    position: 'absolute',
    right: '7%',
    bottom: '2%',
    width: 40,
    height: 40,
  },
});