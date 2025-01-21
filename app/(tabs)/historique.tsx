import React, { useState, useEffect } from 'react';
import { View,SafeAreaView, Text, FlatList, StyleSheet, Alert, Modal, TouchableOpacity } from 'react-native';
import { fetchTableData } from '../../utils/database'; // Chemin vers votre fichier database.js
import ModalPage from '../resultat';

const Historique = () => {
  const [eanList, setEanList] = useState<string[]>([]);
  const [selectedEan, setSelectedEan] = useState<string | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);

  React.useEffect(() => {
    const loadEans = async () => {
      const eans = await fetchTableData();
      setEanList(eans);
    };

    loadEans();
  }, []);

  const handleEanClick = (ean: string) => {
    setSelectedEan(ean);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedEan(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Liste des EAN</Text>
      <FlatList
        data={eanList}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleEanClick(item)}>
            <Text style={styles.item}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        {selectedEan && <ModalPage barcode={selectedEan} onClose={closeModal} />}
      </Modal>
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
    marginBottom: 16,
  },
  item: {
    fontSize: 16,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
});

export default Historique;