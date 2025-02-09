// SegmentationPage.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  segmentation,
  denominationProduit,
  indicateur,
  periode,
  circuit,
  codeEAN,
} from '../../utils/columnConfig';
import {
  fetchUniqueValuesBySegmentation,
  fetchUniqueValuesForSubFilter,
  fetchUniqueValuesForThirdFilter,
  fetchUniqueValuesForReferences,
  fetchUniqueValuesForReferencesOne,
  fetchUniqueValuesForReferencesTwo,
  fetchUniqueValues,
} from '../../utils/database';
import {
  insertHistoriqueEntry,
  createHistoriqueTable
} from '../../utils/baseHistorique';
import ModalPage from '../resultat';

// Par défaut, on utilise la deuxième valeur de segmentation pour le filtre principal.
const defaultFilter =
  segmentation && segmentation.length > 1 ? segmentation[1] : 'DefaultColumn';

const SegmentationPage = () => {
  // États pour les filtres classiques
  const [modalVisible, setModalVisible] = useState(false);
  const [currentFilterIndex, setCurrentFilterIndex] = useState<number | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([
    segmentation[1],
    'Aucun filtre',
    'Aucun filtre',
  ]);
  const [expandedItems, setExpandedItems] = useState<{ [key: string]: boolean }>({});
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  const [dynamicData, setDynamicData] = useState<{ [key: string]: any[] }>({});
  const [filteredData, setFilteredData] = useState<string[]>([]);

  // États pour le filtre avancé
  const [advancedFilter, setAdvancedFilter] = useState<{
    column: string;
    operator: string;
    value: string;
    circuit?: string;
    period?: string;
  } | null>(null);
  const [advancedFilterModalVisible, setAdvancedFilterModalVisible] = useState(false);
  const [advancedIndicateur, setAdvancedIndicateur] = useState('');
  const [advancedSegmentation, setAdvancedSegmentation] = useState('');
  const [advancedOperator, setAdvancedOperator] = useState('');
  const [advancedValue, setAdvancedValue] = useState('');
  // États pour les sélections de circuit et période
  const [selectedCircuit, setSelectedCircuit] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [circuitOptions, setCircuitOptions] = useState<string[]>([]);
  const [periodeOptions, setPeriodeOptions] = useState<string[]>([]);

  // États pour la modale de référence (lors du clic sur une ref)
  const [selectedEan, setSelectedEan] = useState<string | null>(null);
  const [refModalVisible, setRefModalVisible] = useState(false);

  // Fonction d'alignement/décalage des filtres
  // Selon vos règles :
  // - Si on sélectionne une valeur non "Aucun filtre" dans F2 ou F3 et que le filtre précédent est "Aucun filtre",
  //   la valeur se déplace vers la gauche.
  // - Si F3 est sélectionné alors que F2 est "Aucun filtre", la valeur passe en F2 et F3 devient "Aucun filtre".
  // - Si on sélectionne "Aucun filtre" dans F1 ou F2, on décale vers la gauche pour que les valeurs non vides se suivent.
  const shiftFilters = (index: number, newValue: string, filters: string[]): string[] => {
    let [F1, F2, F3] = filters;
    if (newValue !== 'Aucun filtre') {
      if (index === 0) {
        F1 = newValue;
      } else if (index === 1) {
        if (F1 === 'Aucun filtre') {
          F1 = newValue;
        } else {
          F2 = newValue;
        }
      } else if (index === 2) {
        if (F1 === 'Aucun filtre') {
          F1 = newValue;
        } else if (F2 === 'Aucun filtre') {
          F2 = newValue;
          F3 = 'Aucun filtre';
        } else {
          F3 = newValue;
        }
      }
    } else {
      // Si "Aucun filtre" est sélectionné, on décale vers la gauche
      if (index === 0) {
        F1 = F2;
        F2 = F3;
        F3 = 'Aucun filtre';
      } else if (index === 1) {
        F2 = F3;
        F3 = 'Aucun filtre';
      } else if (index === 2) {
        F3 = 'Aucun filtre';
      }
    }
    return [F1, F2, F3];
  };

  // Mise à jour classique des filtres en appliquant shiftFilters
  const updateFilters = (column: string) => {
    if (currentFilterIndex !== null) {
      const updatedFilters = shiftFilters(currentFilterIndex, column, selectedFilters);
      setSelectedFilters(updatedFilters);
      setExpandedItems({});
      setDynamicData({});
    }
    setModalVisible(false);
  };

  // Récupération des options pour circuit et période dès le montage
  useEffect(() => {
    createHistoriqueTable();
    const fetchOptions = async () => {
      try {
        const circuitRes = await fetchUniqueValues(circuit[0]);
        const periodeRes = await fetchUniqueValues(periode[0]);
        setCircuitOptions(circuitRes.map((row: any) => row[circuit[0]]));
        setPeriodeOptions(periodeRes.map((row: any) => row[periode[0]]));
      } catch (error) {
        console.error('Erreur lors de la récupération des options de circuit et période :', error);
      }
    };
    fetchOptions();
  }, []);

  // Mise à jour du nombre de filtres actifs
  useEffect(() => {
    setActiveFilterCount(selectedFilters.filter(f => f !== 'Aucun filtre').length);
  }, [selectedFilters]);

  // --- Fonctions d'accès aux sous-niveaux (inchangées) ---
  const fetchSubItems = async (parentValue: string) => {
    const compositeKey = `${selectedFilters[0]}-${parentValue}`;
    if (!dynamicData[compositeKey]) {
      if (activeFilterCount >= 2 && selectedFilters[1] !== 'Aucun filtre') {
        try {
          const data = await fetchUniqueValuesForSubFilter(
            selectedFilters[1],
            selectedFilters[0],
            parentValue,
            circuit[0],
            periode[0],
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
            circuit[0],
            periode[0],
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
          codeEAN[0],
          selectedFilters[0],
          firstValue,
          selectedFilters[1],
          secondValue,
          selectedFilters[2],
          thirdValue,
          circuit[0],
          periode[0],
          advancedFilter
        );
        // On stocke ici le tableau d'objets { intitule, codeEAN }
        setDynamicData(prev => ({ ...prev, [compositeKey]: data }));
      } catch (error) {
        console.error('Erreur lors de la récupération des références (3 filtres) :', error);
      }
    }
  };

  // Fonctions pour cas de 1 ou 2 filtres actifs
  const fetchReferencesForOneFilter = async (firstValue: string) => {
    const key = `ref1-${selectedFilters[0]}-${firstValue}`;
    if (!dynamicData[key]) {
      try {
        const data = await fetchUniqueValuesForReferencesOne(
          denominationProduit[0],
          codeEAN[0],
          selectedFilters[0],
          firstValue,
          circuit[0],
          periode[0],
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

  const fetchReferencesForTwoFilters = async (firstValue: string, secondValue: string) => {
    const key = `ref2-${selectedFilters[0]}-${firstValue}-${selectedFilters[1]}-${secondValue}`;
    if (!dynamicData[key]) {
      try {
        const data = await fetchUniqueValuesForReferencesTwo(
          denominationProduit[0],
          codeEAN[0],
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

  // Fonctions de dépliage pour la hiérarchie complète (cas de 3 filtres actifs)
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

  // Recharge le premier niveau dès que les filtres changent
  useEffect(() => {
    const updateData = async () => {
      const data = await fetchUniqueValuesBySegmentation(selectedFilters[0], advancedFilter);
      setFilteredData(data);
    };
    updateData();
  }, [selectedFilters, advancedFilter]);

  // Application du filtre avancé.
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

  // Fonction de gestion du clic sur une référence pour ouvrir la modale et afficher le codeEAN
  const handleReferenceClick = (ean: string, reference:string,) => {
    setSelectedEan(ean);
    setRefModalVisible(true);
    insertHistoriqueEntry(reference,ean,'recherche');
  };

  const closeRefModal = () => {
    setRefModalVisible(false);
    setSelectedEan(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Filtres classiques */}
      <ScrollView horizontal style={styles.filterContainer}>
        {selectedFilters.map((filter, index) => (
          <TouchableOpacity
            key={`filter-${index}`}
            style={[
              styles.filterButton,
              filter === 'Aucun filtre' ? styles.inactiveFilter : styles.activeFilter,
            ]}
            onPress={() => {
              setCurrentFilterIndex(index);
              setModalVisible(true);
            }}
          >
            <Text style={styles.filterText}>{filter}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bouton pour accéder au filtre avancé */}
      <TouchableOpacity
        style={styles.advancedFilterButton}
        onPress={() => setAdvancedFilterModalVisible(true)}
      >
        <Text style={styles.advancedFilterButtonText}>
          Filtre avancé{' '}
          {advancedFilter
            ? `appliqué : ${advancedFilter.column} ${advancedFilter.operator} ${advancedFilter.value}`
            : ''}
        </Text>
      </TouchableOpacity>

      {/* Affichage conditionnel selon le nombre de filtres actifs */}
      {activeFilterCount === 1 && (
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
                      keyExtractor={(refItem, index) => `ref-${firstItem}-${index}`}
                      renderItem={({ item: referenceItem }) => (
                        <TouchableOpacity
                          style={styles.referenceItem}
                          onPress={() => handleReferenceClick(referenceItem.codeEAN,referenceItem.intitule)}
                        >
                          <Text>{referenceItem.intitule}</Text>
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
                      keyExtractor={(item, index) => `level2-${firstItem}-${index}`}
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
                                  keyExtractor={(refItem, index) => `ref-${firstItem}-${secondItem}-${index}`}
                                  renderItem={({ item: referenceItem }) => (
                                    <TouchableOpacity
                                      style={styles.referenceItem}
                                      onPress={() => handleReferenceClick(referenceItem.codeEAN,referenceItem.intitule)}
                                    >
                                      <Text>{referenceItem.intitule}</Text>
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
                      keyExtractor={(item, index) => `level2-${firstItem}-${index}`}
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
                                  keyExtractor={(item, index) => `level3-${firstItem}-${secondItem}-${index}`}
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
                                              keyExtractor={(item, index) => `ref-${firstItem}-${secondItem}-${thirdItem}-${index}`}
                                              renderItem={({ item: referenceItem }) => (
                                                <TouchableOpacity
                                                  style={styles.referenceItem}
                                                  onPress={() => handleReferenceClick(referenceItem.codeEAN,referenceItem.intitule)}
                                                >
                                                  <Text>{referenceItem.intitule}</Text>
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
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choisir une colonne</Text>
            <FlatList
              data={[...new Set(['Aucun filtre', ...segmentation])]}
              keyExtractor={(item, index) => `option-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    currentFilterIndex !== null &&
                      item === selectedFilters[currentFilterIndex] &&
                      styles.selectedOption,
                  ]}
                  onPress={() => updateFilters(item)}
                >
                  <Text
                    style={
                      currentFilterIndex !== null &&
                      item === selectedFilters[currentFilterIndex]
                        ? styles.selectedOptionText
                        : styles.modalOptionText
                    }
                  >
                    {item}
                  </Text>
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
      <Modal
        visible={advancedFilterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAdvancedFilterModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Bouton de fermeture en haut à gauche */}
            <TouchableOpacity
              style={styles.topLeftCloseButton}
              onPress={() => setAdvancedFilterModalVisible(false)}
            >
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
                  <Text style={advancedIndicateur === col ? styles.selectedOptionText : styles.modalOptionText}>{col}</Text>
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
                  <Text style={advancedSegmentation === col ? styles.selectedOptionText : styles.modalOptionText}>{col}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {/* Sélection des opérateurs en ScrollView horizontal */}
            <Text style={styles.modalSubtitle}>Opérateur</Text>
            <ScrollView
              horizontal
              style={styles.operatorScrollContainer}
              contentContainerStyle={{ paddingHorizontal: 10 }}
              showsHorizontalScrollIndicator={false}
            >
              {['=', '>', '<', '>=', '<=', '<>'].map((op, index) => (
                <TouchableOpacity
                  key={`op-${index}`}
                  style={[styles.operatorButton, advancedOperator === op && styles.selectedOption]}
                  onPress={() => setAdvancedOperator(op)}
                >
                  <Text style={advancedOperator === op ? styles.selectedOptionText : styles.operatorText}>
                    {op}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {/* Saisie de la valeur */}
            <Text style={styles.modalSubtitle}>Valeur</Text>
            <TextInput
              style={styles.input}
              placeholder="Entrez une valeur"
              value={advancedValue}
              onChangeText={setAdvancedValue}
            />
            {/* Si la colonne choisie est un indicateur, afficher les options pour Circuit et Période */}
            {advancedIndicateur !== '' && (
              <>
                <Text style={styles.modalSubtitle}>Circuit</Text>
                <ScrollView horizontal style={styles.dropdown}>
                  {circuitOptions.map((val, index) => (
                    <TouchableOpacity
                      key={`circ-${index}`}
                      style={[styles.operatorButton, selectedCircuit === val && styles.selectedOption]}
                      onPress={() => setSelectedCircuit(val)}
                    >
                      <Text style={selectedCircuit === val ? styles.selectedOptionText : styles.operatorText}>
                        {val}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <Text style={styles.modalSubtitle}>Période</Text>
                <ScrollView horizontal style={styles.dropdown}>
                  {periodeOptions.map((val, index) => (
                    <TouchableOpacity
                      key={`peri-${index}`}
                      style={[styles.operatorButton, selectedPeriod === val && styles.selectedOption]}
                      onPress={() => setSelectedPeriod(val)}
                    >
                      <Text style={selectedPeriod === val ? styles.selectedOptionText : styles.operatorText}>
                        {val}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}
            {/* Boutons : Effacer, Valider, Fermer */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  setAdvancedFilter(null);
                  setAdvancedIndicateur('');
                  setAdvancedSegmentation('');
                  setAdvancedOperator('');
                  setAdvancedValue('');
                  setSelectedCircuit('');
                  setSelectedPeriod('');
                }}
              >
                <Text style={styles.buttonText}>Effacer</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={applyAdvancedFilter}>
                <Text style={styles.buttonText}>Valider</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeButton} onPress={() => setAdvancedFilterModalVisible(false)}>
                <Text style={styles.buttonText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal pour afficher la page résultat lorsque l'on clique sur une référence */}
      <Modal
        visible={refModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeRefModal}
      >
        {selectedEan && <ModalPage barcode={selectedEan} onClose={closeRefModal} />}
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  operatorScrollContainer: {
    width: '100%',
    marginBottom: 10,
  },
  operatorButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    marginHorizontal: 2,
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedOption: {
    backgroundColor: '#3A3FD4',
    borderColor: '#3A3FD4',
  },
  selectedOptionText: {
    color: 'white',
    fontWeight: 'bold',
  },
  operatorText: {
    color: 'black',
  },
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#F5F5F5',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingVertical: 5,
    maxHeight: 60,
  },
  filterButton: {
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  activeFilter: {
    backgroundColor: '#3A3FD4',
  },
  inactiveFilter: {
    backgroundColor: '#E5E5E5',
  },
  filterText: {
    color: 'white',
    fontWeight: 'bold',
  },
  filterCountText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 10,
    textAlign: 'center',
  },
  listItem: {
    padding: 10,
    backgroundColor: '#E5E5E5',
    marginVertical: 5,
    borderRadius: 8,
  },
  subListItem: {
    padding: 8,
    backgroundColor: '#D5D5D5',
    marginLeft: 20,
    borderRadius: 6,
  },
  thirdListItem: {
    padding: 6,
    backgroundColor: '#C5C5C5',
    marginLeft: 40,
    borderRadius: 4,
  },
  referenceItem: {
    padding: 4,
    backgroundColor: '#B5B5B5',
    marginLeft: 60,
    borderRadius: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
  },
  topLeftCloseButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3A3FD4',
    borderRadius: 8,
    zIndex: 10,
  },
  modalTitleCentered: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#3A3FD4',
    width: '100%',
    textAlign: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#3A3FD4',
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  dropdown: {
    maxHeight: 80,
    width: '100%',
    marginBottom: 10,
  },
  dropdownItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    width: '100%',
    padding: 8,
    borderRadius: 4,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  applyButton: {
    padding: 10,
    backgroundColor: '#3A3FD4',
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  clearButton: {
    padding: 10,
    backgroundColor: '#FF4444',
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  closeButton: {
    padding: 10,
    backgroundColor: '#3A3FD4',
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 60,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  advancedFilterButton: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: '#5A5A5A',
    borderRadius: 8,
    alignItems: 'center',
  },
  advancedFilterButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalOption: {
    padding: 10,
    marginBottom: 8,
    width: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    alignItems: 'center',
  },
  modalOptionText: {
    fontSize: 14,
    color: '#3A3FD4',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 14,
  },
});

export default SegmentationPage;
