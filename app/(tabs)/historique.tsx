import React, { useState, useEffect } from 'react';
import { View,SafeAreaView, Text, FlatList, StyleSheet } from 'react-native';
import { fetchTableData } from '../../utils/database'; // Chemin vers votre fichier database.js

const Historique = () => {
  const [tableData, setTableData] = useState<string[]>([]); // Tableau pour stocker les données récupérées

  useEffect(() => {
    const loadTableData = async () => {
      const data = await fetchTableData();
      setTableData(data); // Mettre à jour l'état avec les données récupérées
    };

    loadTableData();
  }, []);

  // Rendu de chaque élément
  const renderItem = ({ item }: { item: string }) => (
    <View style={styles.item}>
      <Text style={styles.rowText}>{item}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Historique des Données</Text>
      <FlatList
        data={tableData} // Passer les données récupérées
        renderItem={renderItem} // Fonction de rendu pour chaque élément
        keyExtractor={(item, index) => index.toString()} // Clé unique pour chaque élément
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  item: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  rowText: {
    fontSize: 16,
    lineHeight: 22,
  },
});

export default Historique;
