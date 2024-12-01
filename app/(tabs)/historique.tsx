import React, { useState, useEffect } from 'react';
import { SafeAreaView,View, Text, FlatList, StyleSheet } from 'react-native';
import { getBarcodes } from '../../utils/database'; // Assure-toi que le chemin est correct
import { useFocusEffect } from '@react-navigation/native';

export default function Historique() {
  const [barcodes, setBarcodes] = useState<string[]>([]); // Stockage des codes-barres

  useFocusEffect(
    React.useCallback(() => {
      const fetchBarcodes = async () => {
        try {
          const codes = await getBarcodes(); // Récupère les codes depuis la base de données
          setBarcodes(codes); // Mettre à jour l'état avec les codes récupérés
        } catch (error) {
          console.error("Erreur lors du chargement des codes-barres :", error);
        }
      };

      fetchBarcodes();
    }, []) // La dépendance vide signifie que l'effet sera appelé à chaque fois que le composant est mis au premier plan
  );

  // Composant d'affichage de chaque code-barre
  const renderItem = ({ item }: { item: string }) => (
    <View style={styles.item}>
      <Text style={styles.codeText}>{item}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Historique des Codes-Barres Scannés</Text>
      <FlatList
        data={barcodes}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  item: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  codeText: {
    fontSize: 18,
  },
});
