import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  FlatList, Modal, ScrollView, TextInput 
} from 'react-native';
import { segmentation, denominationProduit, indicateur } from '../../utils/columnConfig';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  fetchUniqueValuesBySegmentation, 
  fetchUniqueValuesForSubFilter,
  fetchUniqueValuesForThirdFilter,
  fetchUniqueValuesForReferences,
  // Les fonctions suivantes seront définies dans le module de base de données
  fetchUniqueValuesForReferencesOne,
  fetchUniqueValuesForReferencesTwo
} from '../../utils/database';

// On utilise par défaut la première colonne de segmentation pour le premier filtre
const defaultFilter = segmentation && segmentation.length > 0 ? segmentation[0] : 'DefaultColumn';

const SegmentationPage = () => {
  // États des filtres classiques
  const [modalVisible, setModalVisible] = useState(false);
  const [currentFilterIndex, setCurrentFilterIndex] = useState<number | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([segmentation[1], 'Aucun filtre', 'Aucun filtre']);
  const [expandedItems, setExpandedItems] = useState<{ [key: string]: boolean }>({});
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  const [dynamicData, setDynamicData] = useState<{ [key: string]: string[] }>({});
  const [filteredData, setFilteredData] = useState<string[]>([]);

  // États pour le filtre avancé
  const [advancedFilter, setAdvancedFilter] = useState<{ column: string; operator: string; value: string } | null>(null);
  const [advancedFilterModalVisible, setAdvancedFilterModalVisible] = useState(false);
  const [advancedIndicateur, setAdvancedIndicateur] = useState('');
  const [advancedSegmentation, setAdvancedSegmentation] = useState('');
  const [advancedOperator, setAdvancedOperator] = useState('');
  const [advancedValue, setAdvancedValue] = useState('');

  // Mise à jour du nombre de filtres actifs
  useEffect(() => {
    setActiveFilterCount(selectedFilters.filter(filter => filter !== 'Aucun filtre').length);
  }, [selectedFilters]);

  // Lorsqu'un filtre classique est modifié, on réinitialise l'affichage
  const updateFilters = (column: string) => {
    if (currentFilterIndex !== null) {
      const updatedFilters = [...selectedFilters];
      updatedFilters[currentFilterIndex] = column;
      const filtered = updatedFilters.filter(filter => filter !== 'Aucun filtre');
      while (filtered.length < updatedFilters.length) {
        filtered.push('Aucun filtre');
      }
      setSelectedFilters(filtered);
      setExpandedItems({});
      setDynamicData({});
    }
    setModalVisible(false);
  };

  // --- Fonctions d'accès aux sous-niveaux en transmettant le filtre avancé (optionnel) ---
  const fetchSubItems = async (parentValue: string) => {
    const compositeKey = `${selectedFilters[0]}-${parentValue}`;
    if (!dynamicData[compositeKey]) {
      if (activeFilterCount >= 2 && selectedFilters[1] !== 'Aucun filtre') {
        try {
          const data = await fetchUniqueValuesForSubFilter(
            selectedFilters[1],
            selectedFilters[0],
            parentValue,
            advancedFilter
          );
          setDynamicData(prev => ({ ...prev, [compositeKey]: data }));
        } catch (error) {
          console.error('Erreur lors du 2ᵉ niveau :', error);
        }
      } else {
        setDynamicData(prev => ({ ...prev, [compositeKey]: [] }));
      }
    }
  };

  const fetchThirdItems = async (firstValue: string, secondValue: string) => {
    const compositeKey = `${selectedFilters[0]}-${firstValue}-${selectedFilters[1]}-${secondValue}`;
    if (!dynamicData[compositeKey]) {
      if (activeFilterCount >= 3 && selectedFilters[2] !== 'Aucun filtre') {
        try {
          const data = await fetchUniqueValuesForThirdFilter(
            selectedFilters[2],
            selectedFilters[0],
            firstValue,
            selectedFilters[1],
            secondValue,
            advancedFilter
          );
          setDynamicData(prev => ({ ...prev, [compositeKey]: data }));
        } catch (error) {
          console.error('Erreur lors du 3ᵉ niveau :', error);
        }
      } else {
        setDynamicData(prev => ({ ...prev, [compositeKey]: [] }));
      }
    }
  };

  const fetchReferenceItems = async (firstValue: string, secondValue: string, thirdValue: string) => {
    const compositeKey = `${selectedFilters[0]}-${firstValue}-${selectedFilters[1]}-${secondValue}-${selectedFilters[2]}-${thirdValue}`;
    if (!dynamicData[compositeKey]) {
      try {
        const data = await fetchUniqueValuesForReferences(
          denominationProduit[0],
          selectedFilters[0],
          firstValue,
          selectedFilters[1],
          secondValue,
          selectedFilters[2],
          thirdValue,
          advancedFilter
        );
        setDynamicData(prev => ({ ...prev, [compositeKey]: data }));
      } catch (error) {
        console.error('Erreur lors de la récupération des références (3 filtres) :', error);
      }
    }
  };

  // --- Nouvelles fonctions pour afficher les références selon le nombre de filtres actifs ---

  // Si un seul filtre actif : références filtrées sur le premier niveau
  const fetchReferencesForOneFilter = async (firstValue: string) => {
    const key = `ref1-${selectedFilters[0]}-${firstValue}`;
    if (!dynamicData[key]) {
      try {
        const data = await fetchUniqueValuesForReferencesOne(
          denominationProduit[0],
          selectedFilters[0],
          firstValue,
          advancedFilter
        );
        setDynamicData(prev => ({ ...prev, [key]: data }));
      } catch (error) {
        console.error('Erreur lors de la récupération des références (1 filtre) :', error);
      }
    }
  };

  const toggleExpandReferences1 = (firstValue: string) => {
    const key = `ref1-${selectedFilters[0]}-${firstValue}`;
    setExpandedItems(prev => ({ ...prev, [key]: !prev[key] }));
    fetchReferencesForOneFilter(firstValue);
  };

  // Si deux filtres actifs : références filtrées sur le premier et le deuxième niveau
  const fetchReferencesForTwoFilters = async (firstValue: string, secondValue: string) => {
    const key = `ref2-${selectedFilters[0]}-${firstValue}-${selectedFilters[1]}-${secondValue}`;
    if (!dynamicData[key]) {
      try {
        const data = await fetchUniqueValuesForReferencesTwo(
          denominationProduit[0],
          selectedFilters[0],
          firstValue,
          selectedFilters[1],
          secondValue,
          advancedFilter
        );
        setDynamicData(prev => ({ ...prev, [key]: data }));
      } catch (error) {
        console.error('Erreur lors de la récupération des références (2 filtres) :', error);
      }
    }
  };

  const toggleExpandReferences2 = (firstValue: string, secondValue: string) => {
    const key = `ref2-${selectedFilters[0]}-${firstValue}-${selectedFilters[1]}-${secondValue}`;
    setExpandedItems(prev => ({ ...prev, [key]: !prev[key] }));
    fetchReferencesForTwoFilters(firstValue, secondValue);
  };

  // Les fonctions toggleExpandFirst/Second/Reference existantes pour le cas à 3 filtres restent inchangées
  const toggleExpandFirst = (item: string) => {
    setExpandedItems(prev => ({ ...prev, [item]: !prev[item] }));
    fetchSubItems(item);
  };

  const toggleExpandSecond = (firstValue: string, secondValue: string) => {
    const compositeKey = `${selectedFilters[0]}-${firstValue}-${selectedFilters[1]}-${secondValue}`;
    setExpandedItems(prev => ({ ...prev, [compositeKey]: !prev[compositeKey] }));
    fetchThirdItems(firstValue, secondValue);
  };

  const toggleExpandReference = (firstValue: string, secondValue: string, thirdValue: string) => {
    const compositeKey = `${selectedFilters[0]}-${firstValue}-${selectedFilters[1]}-${secondValue}-${selectedFilters[2]}-${thirdValue}`;
    setExpandedItems(prev => ({ ...prev, [compositeKey]: !prev[compositeKey] }));
    fetchReferenceItems(firstValue, secondValue, thirdValue);
  };

  // Recharge le premier niveau dès que les filtres classiques ou avancés changent
  useEffect(() => {
    const updateData = async () => {
      const data = await fetchUniqueValuesBySegmentation(selectedFilters[0], advancedFilter);
      setFilteredData(data);
    };
    updateData();
  }, [selectedFilters, advancedFilter]);

  // Application du filtre avancé
  const applyAdvancedFilter = () => {
    const effectiveColumn = advancedIndicateur !== '' ? advancedIndicateur : advancedSegmentation;
    if (effectiveColumn && advancedOperator && advancedValue) {
      setAdvancedFilter({ column: effectiveColumn, operator: advancedOperator, value: advancedValue });
    } else {
      setAdvancedFilter(null);
    }
    setAdvancedIndicateur('');
    setAdvancedSegmentation('');
    setAdvancedOperator('');
    setAdvancedValue('');
    setExpandedItems({});
    setDynamicData({});
    setAdvancedFilterModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Filtres classiques */}
      <ScrollView horizontal style={styles.filterContainer}>
        {selectedFilters.map((filter, index) => (
          <TouchableOpacity
            key={`filter-${index}`}
            style={[styles.filterButton, filter === 'Aucun filtre' ? styles.inactiveFilter : styles.activeFilter]}
            onPress={() => {
              setCurrentFilterIndex(index);
              setModalVisible(true);
            }}
          >
            <Text style={styles.filterText}>{filter}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Text style={styles.filterCountText}>Filtres actifs : {activeFilterCount}</Text>

      {/* Bouton pour accéder au filtre avancé */}
      <TouchableOpacity style={styles.advancedFilterButton} onPress={() => setAdvancedFilterModalVisible(true)}>
        <Text style={styles.advancedFilterButtonText}>
          Filtre avancé {advancedFilter ? `appliqué : ${advancedFilter.column} ${advancedFilter.operator} ${advancedFilter.value}` : ''}
        </Text>
      </TouchableOpacity>

      {/* Affichage conditionnel selon le nombre de filtres actifs */}
      {activeFilterCount === 1 && (
        // Si un seul filtre actif, on affiche les références directement sous le niveau 1
        <FlatList
          data={filteredData}
          keyExtractor={(item) => `level1-${item}`}
          renderItem={({ item: firstItem }) => {
            const key = `ref1-${selectedFilters[0]}-${firstItem}`;
            return (
              <View>
                <TouchableOpacity style={styles.listItem} onPress={() => toggleExpandReferences1(firstItem)}>
                  <Text>{firstItem}</Text>
                </TouchableOpacity>
                {expandedItems[key] &&
                  dynamicData[key] &&
                  dynamicData[key].length > 0 && (
                    <FlatList
                      data={dynamicData[key]}
                      keyExtractor={(refItem) => `ref-${firstItem}-${refItem}`}
                      renderItem={({ item: referenceItem }) => (
                        <TouchableOpacity style={styles.referenceItem} onPress={() => console.log(`Référence cliquée : ${referenceItem}`)}>
                          <Text>{referenceItem}</Text>
                        </TouchableOpacity>
                      )}
                    />
                  )}
              </View>
            );
          }}
        />
      )}

      {activeFilterCount === 2 && (
        // Si deux filtres actifs, on affiche deux niveaux : premier niveau puis, sous chaque item, le deuxième niveau qui donne accès aux références
        <FlatList
          data={filteredData}
          keyExtractor={(item) => `level1-${item}`}
          renderItem={({ item: firstItem }) => {
            const compositeKey1 = `${selectedFilters[0]}-${firstItem}`;
            return (
              <View>
                <TouchableOpacity style={styles.listItem} onPress={() => toggleExpandFirst(firstItem)}>
                  <Text>{firstItem}</Text>
                </TouchableOpacity>
                {expandedItems[firstItem] &&
                  dynamicData[compositeKey1] &&
                  dynamicData[compositeKey1].length > 0 && (
                    <FlatList
                      data={dynamicData[compositeKey1]}
                      keyExtractor={(item) => `level2-${firstItem}-${item}`}
                      renderItem={({ item: secondItem }) => {
                        const key = `ref2-${selectedFilters[0]}-${firstItem}-${selectedFilters[1]}-${secondItem}`;
                        return (
                          <View>
                            <TouchableOpacity style={styles.subListItem} onPress={() => toggleExpandReferences2(firstItem, secondItem)}>
                              <Text>{secondItem}</Text>
                            </TouchableOpacity>
                            {expandedItems[key] &&
                              dynamicData[key] &&
                              dynamicData[key].length > 0 && (
                                <FlatList
                                  data={dynamicData[key]}
                                  keyExtractor={(refItem) => `ref-${firstItem}-${secondItem}-${refItem}`}
                                  renderItem={({ item: referenceItem }) => (
                                    <TouchableOpacity style={styles.referenceItem} onPress={() => console.log(`Référence cliquée : ${referenceItem}`)}>
                                      <Text>{referenceItem}</Text>
                                    </TouchableOpacity>
                                  )}
                                />
                              )}
                          </View>
                        );
                      }}
                    />
                  )}
              </View>
            );
          }}
        />
      )}

      {activeFilterCount >= 3 && (
        // Si trois filtres actifs, on conserve la hiérarchie sur 3 niveaux et la liste des références sous le 3ème niveau
        <FlatList
          data={filteredData}
          keyExtractor={(item) => `level1-${item}`}
          renderItem={({ item: firstItem }) => {
            const compositeKey1 = `${selectedFilters[0]}-${firstItem}`;
            return (
              <View>
                <TouchableOpacity style={styles.listItem} onPress={() => toggleExpandFirst(firstItem)}>
                  <Text>{firstItem}</Text>
                </TouchableOpacity>
                {expandedItems[firstItem] &&
                  dynamicData[compositeKey1] &&
                  dynamicData[compositeKey1].length > 0 && (
                    <FlatList
                      data={dynamicData[compositeKey1]}
                      keyExtractor={(item) => `level2-${firstItem}-${item}`}
                      renderItem={({ item: secondItem }) => {
                        const compositeKey2 = `${selectedFilters[0]}-${firstItem}-${selectedFilters[1]}-${secondItem}`;
                        return (
                          <View>
                            <TouchableOpacity style={styles.subListItem} onPress={() => toggleExpandSecond(firstItem, secondItem)}>
                              <Text>{secondItem}</Text>
                            </TouchableOpacity>
                            {expandedItems[compositeKey2] &&
                              dynamicData[compositeKey2] &&
                              dynamicData[compositeKey2].length > 0 && (
                                <FlatList
                                  data={dynamicData[compositeKey2]}
                                  keyExtractor={(item) => `level3-${firstItem}-${secondItem}-${item}`}
                                  renderItem={({ item: thirdItem }) => {
                                    const compositeKeyRef = `${selectedFilters[0]}-${firstItem}-${selectedFilters[1]}-${secondItem}-${selectedFilters[2]}-${thirdItem}`;
                                    return (
                                      <View>
                                        <TouchableOpacity style={styles.thirdListItem} onPress={() => toggleExpandReference(firstItem, secondItem, thirdItem)}>
                                          <Text>{thirdItem}</Text>
                                        </TouchableOpacity>
                                        {expandedItems[compositeKeyRef] &&
                                          dynamicData[compositeKeyRef] &&
                                          dynamicData[compositeKeyRef].length > 0 && (
                                            <FlatList
                                              data={dynamicData[compositeKeyRef]}
                                              keyExtractor={(item) => `ref-${firstItem}-${secondItem}-${thirdItem}-${item}`}
                                              renderItem={({ item: referenceItem }) => (
                                                <TouchableOpacity style={styles.referenceItem} onPress={() => console.log(`Référence cliquée : ${referenceItem}`)}>
                                                  <Text>{referenceItem}</Text>
                                                </TouchableOpacity>
                                              )}
                                            />
                                          )}
                                      </View>
                                    );
                                  }}
                                />
                              )}
                          </View>
                        );
                      }}
                    />
                  )}
              </View>
            );
          }}
        />
      )}

      {/* Modal de filtre classique */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choisir une colonne</Text>
            <FlatList
              data={[...new Set(['Aucun filtre', ...segmentation])]}
              keyExtractor={(item, index) => `option-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalOption} onPress={() => updateFilters(item)}>
                  <Text style={styles.modalOptionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal du filtre avancé */}
      <Modal visible={advancedFilterModalVisible} transparent animationType="slide" onRequestClose={() => setAdvancedFilterModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Bouton de fermeture en haut à gauche */}
            <TouchableOpacity style={styles.topLeftCloseButton} onPress={() => setAdvancedFilterModalVisible(false)}>
              <Text style={styles.closeButtonText}>X</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitleCentered}>Filtre avancé</Text>
            {/* Sélection de colonne parmi "indicateur" */}
            <Text style={styles.modalSubtitle}>Indicateur</Text>
            <ScrollView style={styles.dropdown}>
              {indicateur.map((col, index) => (
                <TouchableOpacity
                  key={`ind-${index}`}
                  style={[styles.dropdownItem, advancedIndicateur === col && styles.selectedOption]}
                  onPress={() => { setAdvancedIndicateur(col); setAdvancedSegmentation(''); }}
                >
                  <Text style={advancedIndicateur === col ? styles.selectedOptionText : undefined}>{col}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {/* Sélection de colonne parmi "segmentation" */}
            <Text style={styles.modalSubtitle}>Segmentation</Text>
            <ScrollView style={styles.dropdown}>
              {segmentation.map((col, index) => (
                <TouchableOpacity
                  key={`seg-${index}`}
                  style={[styles.dropdownItem, advancedSegmentation === col && styles.selectedOption]}
                  onPress={() => { setAdvancedSegmentation(col); setAdvancedIndicateur(''); }}
                >
                  <Text style={advancedSegmentation === col ? styles.selectedOptionText : undefined}>{col}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {/* Sélection des opérateurs alignés horizontalement */}
            <Text style={styles.modalSubtitle}>Opérateur</Text>
            <View style={styles.operatorContainer}>
              {['=', '>', '<', '>=', '<=', '<>'].map((op, index) => (
                <TouchableOpacity
                  key={`op-${index}`}
                  style={[styles.operatorButton, advancedOperator === op && styles.selectedOption]}
                  onPress={() => setAdvancedOperator(op)}
                >
                  <Text style={advancedOperator === op ? styles.selectedOptionText : undefined}>{op}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* Saisie de la valeur */}
            <Text style={styles.modalSubtitle}>Valeur</Text>
            <TextInput
              style={styles.input}
              placeholder="Entrez une valeur"
              value={advancedValue}
              onChangeText={setAdvancedValue}
            />
            {/* Boutons : Effacer, Appliquer, Fermer */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  setAdvancedFilter(null);
                  setAdvancedIndicateur('');
                  setAdvancedSegmentation('');
                  setAdvancedOperator('');
                  setAdvancedValue('');
                }}
              >
                <Text style={styles.buttonText}>Effacer</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={applyAdvancedFilter}>
                <Text style={styles.buttonText}>Appliquer</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeButton} onPress={() => setAdvancedFilterModalVisible(false)}>
                <Text style={styles.buttonText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#F5F5F5' },
  filterContainer: { flexDirection: 'row', marginBottom: 10, paddingVertical: 5, maxHeight: 60 },
  filterButton: { padding: 10, borderRadius: 8, marginHorizontal: 5 },
  activeFilter: { backgroundColor: '#3A3FD4' },
  inactiveFilter: { backgroundColor: '#E5E5E5' },
  filterText: { color: 'white', fontWeight: 'bold' },
  filterCountText: { fontSize: 16, fontWeight: 'bold', marginVertical: 10, textAlign: 'center' },
  listItem: { padding: 10, backgroundColor: '#E5E5E5', marginVertical: 5, borderRadius: 8 },
  subListItem: { padding: 8, backgroundColor: '#D5D5D5', marginLeft: 20, borderRadius: 6 },
  thirdListItem: { padding: 6, backgroundColor: '#C5C5C5', marginLeft: 40, borderRadius: 4 },
  referenceItem: { padding: 4, backgroundColor: '#B5B5B5', marginLeft: 60, borderRadius: 4 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalContent: { width: '80%', backgroundColor: 'white', borderRadius: 8, padding: 16, alignItems: 'center', position: 'relative' },
  topLeftCloseButton: { position: 'absolute', top: 10, left: 10, padding: 5 },
  modalTitleCentered: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#3A3FD4', width: '100%', textAlign: 'center' },
  modalTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 16, color: '#3A3FD4' },
  modalSubtitle: { fontSize: 14, fontWeight: 'bold', marginTop: 10, alignSelf: 'flex-start' },
  dropdown: { maxHeight: 80, width: '100%', marginBottom: 10 },
  dropdownItem: { padding: 8, borderBottomWidth: 1, borderBottomColor: '#ccc' },
  operatorContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 10 },
  operatorButton: { padding: 8, borderWidth: 1, borderColor: '#ccc', borderRadius: 4, marginHorizontal: 2, flex: 1, alignItems: 'center' },
  selectedOption: { backgroundColor: '#3A3FD4', borderColor: '#3A3FD4' },
  selectedOptionText: { color: 'white' },
  input: { borderWidth: 1, borderColor: '#ccc', width: '100%', padding: 8, borderRadius: 4, marginBottom: 10 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
  applyButton: { padding: 10, backgroundColor: '#3A3FD4', borderRadius: 8, flex: 1, marginHorizontal: 5, alignItems: 'center' },
  clearButton: { padding: 10, backgroundColor: '#FF4444', borderRadius: 8, flex: 1, marginHorizontal: 5, alignItems: 'center' },
  closeButton: { padding: 10, backgroundColor: '#3A3FD4', borderRadius: 8, flex: 1, marginHorizontal: 5, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold' },
  advancedFilterButton: { marginVertical: 10, padding: 10, backgroundColor: '#5A5A5A', borderRadius: 8, alignItems: 'center' },
  advancedFilterButtonText: { color: 'white', fontWeight: 'bold' },
  modalOption: { padding: 10, marginBottom: 8, width: '100%', backgroundColor: '#F5F5F5', borderRadius: 4, alignItems: 'center' },
  modalOptionText: { fontSize: 14, color: '#3A3FD4' },
  closeButtonText: { color: 'white', fontSize: 14 }
});

export default SegmentationPage;
