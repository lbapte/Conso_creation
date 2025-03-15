import React, { useState } from 'react';
import { View, SafeAreaView, Text, FlatList, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getHistoriqueByEanAndType,deleteHistoriqueTable } from '../../utils/baseHistorique';
import ModalPage from '../resultat';
import moment from 'moment';

const mainPoliceSize = 14;

const Historique = () => {
  const [historiqueList, setHistoriqueList] = useState<{ intitule: string; ean: string }[]>([]);
  const [selectedEan, setSelectedEan] = useState<string | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('toutes');

  const getFilterValue = (filter: string) => {
    switch (filter) {
      case 'scannées': return 'scan';
      case 'recherchées': return 'recherche';
      case 'toutes': return '';
      default: return '';
    }
  };

  const formatElapsedTime = (timestamp: string) => {
    const now = moment();
    const referenceTime = moment(timestamp, "YYYY-MM-DD HH:mm:ss");
    const diffInHours = now.diff(referenceTime, 'hours');
    const diffInDays = now.diff(referenceTime, 'days');
  
    if (diffInHours < 24) {
      return `Ajouté à ${referenceTime.format("HH:mm")}`;
    } else if (diffInDays === 1) {
      return "Ajouté hier";
    } else if (diffInDays <= 7) {
      return `Ajouté il y a ${diffInDays} jours`;
    } else {
      return `Ajouté le ${referenceTime.format("DD/MM/YYYY")}`;
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      const loadHistorique = async () => {
        try {
          const historique = await getHistoriqueByEanAndType(getFilterValue(selectedFilter), 20);
          setHistoriqueList(historique);
          //deleteHistoriqueTable();
        } catch (error) {
          console.error("Erreur lors du chargement des données :", error);
        }
      };
      loadHistorique();
    }, [selectedFilter])
  );

  const handleReferenceClick = (ean: string) => {
    setSelectedEan(ean);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedEan(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.Header}>
        <Text style={styles.title}>Historique</Text>
      </View>
      
      <View style={styles.filterContainer}>
        <TouchableOpacity style={styles.filterButton} onPress={() => setFilterModalVisible(true)}>
          <Text style={styles.filterButtonText}>Filtrer ({selectedFilter})</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.Body}>
      <FlatList
        data={historiqueList}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleReferenceClick(item.ean)}>
            <View style={styles.itemContainer}>
              <Text style={styles.itemTitle}>{item.intitule}</Text>
              <Text style={styles.itemDate}>{formatElapsedTime(item.timestamp)}</Text>
            </View>
          </TouchableOpacity>
        )}
      />


        {/* Modal */}
        <Modal visible={isModalVisible} transparent animationType="slide" onRequestClose={closeModal}>
          {selectedEan && <ModalPage barcode={selectedEan} onClose={closeModal} />}
        </Modal>

        {/* Filter Modal */}
        <Modal visible={filterModalVisible} transparent animationType="slide" onRequestClose={() => setFilterModalVisible(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Lister les références</Text>
              {['scannées', 'recherchées', 'toutes'].map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[styles.filterOption, selectedFilter === filter && styles.selectedFilter]}
                  onPress={() => setSelectedFilter(filter)}
                >
                  <Text style={[styles.filterText, selectedFilter === filter && styles.selectedFilterText]}>{filter}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.closeButton} onPress={() => setFilterModalVisible(false)}>
                <Text style={styles.closeButtonText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#7579FF',marginBottom:-40, },
  Header: { justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  filterContainer: { alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  filterButton: { backgroundColor: '#3A3FD4', padding: 10, borderRadius: 5 },
  filterButtonText: { color: 'white', fontWeight: 'bold' },
  Body: { flex: 8, backgroundColor: '#fff',borderRadius:20, },
  itemContainer: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#ccc' },
  itemTitle: { fontSize: mainPoliceSize, fontWeight: 'bold' },
  itemDate: { fontSize: 12, color: '#666', marginTop: 4 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalContent: { width: '80%', backgroundColor: 'white', borderRadius: 8, padding: 16, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#3A3FD4' },
  filterOption: { padding: 10, width: '100%', backgroundColor: '#F5F5F5', borderRadius: 4, alignItems: 'center', marginVertical: 5 },
  selectedFilter: { backgroundColor: '#3A3FD4' },
  selectedFilterText: { color: 'white', fontWeight: 'bold' },
  filterText: { fontSize: 14, color: '#3A3FD4' },
  closeButton: { marginTop: 16, padding: 10, backgroundColor: '#3A3FD4', borderRadius: 8 },
  closeButtonText: { color: 'white', fontSize: 14 },
});

export default Historique;
