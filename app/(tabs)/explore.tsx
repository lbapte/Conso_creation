import React, { useState, useEffect } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  fetchUniqueValuesBySegmentation,
  fetchUniqueValuesForSubFilter,
  fetchUniqueValuesForThirdFilter,
  fetchUniqueValuesForReferences,
  fetchUniqueValuesForReferencesOne,
  fetchUniqueValuesForReferencesTwo,
  fetchUniqueValues,
  fetchColumnsByType,
  segmentation,
  denominationProduit,
  indicateur,
  periode,
  circuit,
  codeEAN,
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
  // États pour les filtres "classiques" (F1, F2, F3)
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

  // États pour la partie "avancée"
  const [advancedIndicateur, setAdvancedIndicateur] = useState('');
  const [advancedSegmentation, setAdvancedSegmentation] = useState('');
  const [advancedOperator, setAdvancedOperator] = useState('');
  const [advancedValue, setAdvancedValue] = useState('');
  const [selectedCircuit, setSelectedCircuit] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');

  // Filtre avancé final appliqué (contient désormais un champ "type")
  const [advancedFilter, setAdvancedFilter] = useState<{
    column: string;
    operator: string;
    value: string;
    type: string;
    circuit?: string;
    period?: string;
  } | null>(null);

  // Options pour circuit et période
  const [circuitOptions, setCircuitOptions] = useState<string[]>([]);
  const [periodeOptions, setPeriodeOptions] = useState<string[]>([]);

  // Modale de référence (clic sur une ref)
  const [selectedEan, setSelectedEan] = useState<string | null>(null);
  const [refModalVisible, setRefModalVisible] = useState(false);

  // Affichage du filtre avancé
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);

  // États pour l'autocomplétion (uniquement si segmentation)
  const [autoCompleteOptions, setAutoCompleteOptions] = useState<any[]>([]);

  // Nouveaux états pour le tri et le "Filtrer via"
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filtrerViaModalVisible, setFiltrerViaModalVisible] = useState(false);
  const [filtrerVia, setFiltrerVia] = useState<string>('Aucun filtre');

  // Nouveaux états pour les modales de sélection de Circuit et Période
  const [circuitModalVisible, setCircuitModalVisible] = useState(false);
  const [periodModalVisible, setPeriodModalVisible] = useState(false);

  const numericOperators = ['=', '>', '<'];
  const textOperators = ['=', '!='];

  // -----------------------------------
  // SHIFT FILTERS & INIT
  // -----------------------------------
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

  const updateFilters = (column: string) => {
    if (currentFilterIndex !== null) {
      const updatedFilters = shiftFilters(currentFilterIndex, column, selectedFilters);
      setSelectedFilters(updatedFilters);
      setExpandedItems({});
      setDynamicData({});
    }
    setModalVisible(false);
  };

  useEffect(() => {
    fetchColumnsByType();
  }, []);

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

  useEffect(() => {
    setActiveFilterCount(selectedFilters.filter(f => f !== 'Aucun filtre').length);
  }, [selectedFilters]);

  // -----------------------------------
  // FONCTIONS D'ACCÈS AUX SOUS-NIVEAUX
  // -----------------------------------
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

  const fetchReferenceItems = async (
    filtrerVia: string,
    sortOrder: 'asc' | 'desc',
    firstValue: string,
    secondValue: string,
    thirdValue: string
  ) => {
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
          selectedCircuit,
          selectedPeriod,
          advancedFilter,
          filtrerVia,
          sortOrder,
        );
        setDynamicData(prev => ({ ...prev, [compositeKey]: data }));
      } catch (error) {
        console.error('Erreur lors de la récupération des références (3 filtres) :', error);
      }
    }
  };

  const fetchReferencesForOneFilter = async (
    filtrerVia: string,
    sortOrder: 'asc' | 'desc',
    firstValue: string
  ) => {
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
          selectedCircuit,
          selectedPeriod,
          advancedFilter,
          filtrerVia,
          sortOrder,
        );
        setDynamicData(prev => ({ ...prev, [key]: data }));
      } catch (error) {
        console.error('Erreur lors de la récupération des références (1 filtre) :', error);
      }
    }
  };

  const fetchReferencesForTwoFilters = async (
    filtrerVia: string,
    sortOrder: 'asc' | 'desc',
    firstValue: string,
    secondValue: string
  ) => {
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
          circuit[0],
          periode[0],
          selectedCircuit,
          selectedPeriod,
          advancedFilter,
          filtrerVia,
          sortOrder,
        );
        setDynamicData(prev => ({ ...prev, [key]: data }));
      } catch (error) {
        console.error('Erreur lors de la récupération des références (2 filtres) :', error);
      }
    }
  };

  // -----------------------------------
  // TOGGLE DES LISTES HIÉRARCHIQUES
  // -----------------------------------
  const toggleExpandReferences1 = (firstValue: string) => {
    const key = `ref1-${selectedFilters[0]}-${firstValue}`;
    setExpandedItems(prev => ({ ...prev, [key]: !prev[key] }));
    fetchReferencesForOneFilter(filtrerVia, sortOrder, firstValue);
  };

  const toggleExpandReferences2 = (firstValue: string, secondValue: string) => {
    const key = `ref2-${selectedFilters[0]}-${firstValue}-${selectedFilters[1]}-${secondValue}`;
    setExpandedItems(prev => ({ ...prev, [key]: !prev[key] }));
    fetchReferencesForTwoFilters(filtrerVia, sortOrder, firstValue, secondValue);
  };

  const toggleExpandReference = (firstValue: string, secondValue: string, thirdValue: string) => {
    const compositeKey = `${selectedFilters[0]}-${firstValue}-${selectedFilters[1]}-${secondValue}-${selectedFilters[2]}-${thirdValue}`;
    setExpandedItems(prev => ({ ...prev, [compositeKey]: !prev[compositeKey] }));
    fetchReferenceItems(filtrerVia, sortOrder, firstValue, secondValue, thirdValue);
  };

  const toggleExpandFirst = (item: string) => {
    setExpandedItems(prev => ({ ...prev, [item]: !prev[item] }));
    fetchSubItems(item);
  };

  const toggleExpandSecond = (firstValue: string, secondValue: string) => {
    const compositeKey = `${selectedFilters[0]}-${firstValue}-${selectedFilters[1]}-${secondValue}`;
    setExpandedItems(prev => ({ ...prev, [compositeKey]: !prev[compositeKey] }));
    fetchThirdItems(firstValue, secondValue);
  };

  // -----------------------------------
  // RECHARGE DU PREMIER NIVEAU
  // -----------------------------------
  useEffect(() => {
    const updateData = async () => {
      const data = await fetchUniqueValuesBySegmentation(selectedFilters[0], advancedFilter);
      setFilteredData(data);
    };
    updateData();
  }, [selectedFilters, advancedFilter]);

  // -----------------------------------
  // LOGIQUE "AVANCÉE" : VALIDER / EFFACER
  // -----------------------------------
  const applyAdvancedFilter = () => {
    setShowAdvancedFilter(prev => !prev);
    const finalOperator =
      advancedOperator !== ''
        ? advancedOperator
        : (advancedSegmentation !== '' ? '=' : '');
    const effectiveColumn = advancedIndicateur !== '' ? advancedIndicateur : advancedSegmentation;

    if (effectiveColumn && finalOperator && advancedValue) {
      const finalType: 'integer' | 'text' =
        advancedIndicateur !== '' ? 'integer' : 'text';

      setAdvancedFilter({
        column: effectiveColumn,
        operator: finalOperator,
        value: advancedValue,
        type: finalType,
        circuit: selectedCircuit,
        period: selectedPeriod,
      });
    } else {
      setAdvancedFilter(null);
    }
    setExpandedItems({});
    setDynamicData({});
  };

  const clearAdvancedFilter = () => {
    setAdvancedFilter(null);
    setAdvancedIndicateur('');
    setAdvancedSegmentation('');
    setAdvancedOperator('');
    setAdvancedValue('');
    setSelectedCircuit('');
    setSelectedPeriod('');
    setAutoCompleteOptions([]);
  };

  // -----------------------------------
  // AUTOCOMPLÉTION
  // -----------------------------------
  useEffect(() => {
    if (advancedSegmentation !== '') {
      if (!advancedValue || advancedValue.trim() === '') {
        setAutoCompleteOptions([]);
        return;
      }

      const loadAutoComplete = async () => {
        try {
          const result = await fetchUniqueValues(advancedSegmentation);
          const typed = advancedValue.toLowerCase();

          const filtered = result.filter((row: any) => {
            const val = row[advancedSegmentation];
            if (!val) return false;
            return val.toString().toLowerCase().includes(typed);
          });

          const top3 = filtered.slice(0, 3);
          setAutoCompleteOptions(top3);
        } catch (error) {
          console.error('Erreur lors du fetchUniqueValues pour autocomplétion :', error);
          setAutoCompleteOptions([]);
        }
      };

      loadAutoComplete();
    } else {
      setAutoCompleteOptions([]);
    }
  }, [advancedValue, advancedSegmentation]);

  // -----------------------------------
  // CLIC SUR UNE RÉFÉRENCE
  // -----------------------------------
  const handleReferenceClick = (ean: string, reference: string) => {
    setSelectedEan(ean);
    setRefModalVisible(true);
    insertHistoriqueEntry(reference, ean, 'recherche');
  };

  const closeRefModal = () => {
    setRefModalVisible(false);
    setSelectedEan(null);
  };

  let operatorsToDisplay: string[] = [];
  if (advancedIndicateur !== '') {
    operatorsToDisplay = numericOperators;
  } else if (advancedSegmentation !== '') {
    operatorsToDisplay = textOperators;
  }

  // -----------------------------------
  // RENDER
  // -----------------------------------
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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

          {/* Boutons pour les actions du filtre */}
          <View style={styles.filterActionsContainer}>
            {/* Bouton avec le picto flèche (5%) */}
            <TouchableOpacity
              style={styles.arrowButton}
              onPress={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
            >
              <View style={{ flexDirection: 'column', alignItems: 'center' }}>
                <FontAwesome
                  name="arrow-up"
                  size={14}
                  color={sortOrder === 'asc' ? "#2B26BF" : "gray"}
                />
                <FontAwesome
                  name="arrow-down"
                  size={14}
                  color={sortOrder === 'desc' ? "#2B26BF" : "gray"}
                />
              </View>
            </TouchableOpacity>

            {/* Bouton "Filtrer via" (25%) */}
            <TouchableOpacity
              style={styles.filterViaButton}
              onPress={() => setFiltrerViaModalVisible(true)}
            >
              <Text style={styles.filterViaText}>Filtrer via</Text>
              <Text style={styles.filterViaSelected}>{filtrerVia}</Text>
            </TouchableOpacity>

            {/* Bouton pour le choix du Circuit (25%) */}
            <TouchableOpacity
              style={styles.circuitButton}
              onPress={() => setCircuitModalVisible(true)}
            >
              <Text style={styles.circuitButtonText}>Circuit</Text>
              <Text style={styles.circuitSelected}>{selectedCircuit || circuit[0]}</Text>
            </TouchableOpacity>

            {/* Bouton pour le choix de la Période (25%) */}
            <TouchableOpacity
              style={styles.periodButton}
              onPress={() => setPeriodModalVisible(true)}
            >
              <Text style={styles.periodButtonText}>Période</Text>
              <Text style={styles.periodSelected}>{selectedPeriod || periode[0]}</Text>
            </TouchableOpacity>
            
          </View>

          <View style={styles.filterActionsContainer}>
          <TouchableOpacity
              style={styles.advancedToggleButton}
              onPress={() => setShowAdvancedFilter(prev => !prev)}
            >
              <Text style={styles.advancedToggleText}>
                {showAdvancedFilter ? 'Masquer le filtre avancé' : 'Afficher le filtre avancé'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* SECTION AVANCÉE : affichage conditionnel */}
          {showAdvancedFilter && (
            <View style={styles.advancedFilterContainer}>
              <Text style={styles.advancedFilterTitle}>Filtre avancé</Text>

              {/* 2 boutons : Indicateur ou Segmentation */}
              <View style={styles.selectionButtonsContainer}>
                <TouchableOpacity
                  style={[styles.selectionButton, advancedIndicateur !== '' && styles.selectedButton]}
                  onPress={() => {
                    // On vide la segmentation
                    setAdvancedSegmentation('');
                    setAutoCompleteOptions([]);
                    // On définit un indicateur par défaut si possible
                    if (indicateur.length > 0) {
                      setAdvancedIndicateur(indicateur[0]);
                    } else {
                      setAdvancedIndicateur('');
                    }
                    // On remet l'opérateur à vide
                    setAdvancedOperator('');
                  }}
                >
                  <Text
                    style={
                      advancedIndicateur !== '' ? styles.selectedButtonText : styles.buttonText
                    }
                  >
                    Indicateur
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.selectionButton, advancedSegmentation !== '' && styles.selectedButton]}
                  onPress={() => {
                    // On vide l'indicateur
                    setAdvancedIndicateur('');
                    setAutoCompleteOptions([]);
                    // On définit une segmentation par défaut si possible
                    if (segmentation.length > 0) {
                      setAdvancedSegmentation(segmentation[0]);
                    } else {
                      setAdvancedSegmentation('');
                    }
                    // On remet l'opérateur à vide (l'utilisateur choisira = ou !=)
                    setAdvancedOperator('');
                  }}
                >
                  <Text
                    style={
                      advancedSegmentation !== '' ? styles.selectedButtonText : styles.buttonText
                    }
                  >
                    Segmentation
                  </Text>
                </TouchableOpacity>
              </View>

              {/* SI INDICATEUR ACTIVÉ => liste des indicateurs */}
              {advancedIndicateur !== '' && (
                <>
                  <Text style={styles.modalSubtitle}>Choix de l'indicateur</Text>
                  <ScrollView
                    horizontal
                    style={styles.dropdown}
                    showsHorizontalScrollIndicator={false}
                  >
                    {indicateur.map((col, i) => {
                      const isSelected = advancedIndicateur === col;
                      return (
                        <TouchableOpacity
                          key={`ind-${i}`}
                          style={[styles.operatorButton, isSelected && styles.selectedOption]}
                          onPress={() => setAdvancedIndicateur(col)}
                        >
                          <Text
                            style={isSelected ? styles.selectedOptionText : styles.operatorText}
                          >
                            {col}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </>
              )}

              {/* SI SEGMENTATION ACTIVÉ => liste des segmentations */}
              {advancedSegmentation !== '' && (
                <>
                  <Text style={styles.modalSubtitle}>Choix de la segmentation</Text>
                  <ScrollView
                    horizontal
                    style={styles.dropdown}
                    showsHorizontalScrollIndicator={false}
                  >
                    {segmentation.map((col, i) => {
                      const isSelected = advancedSegmentation === col;
                      return (
                        <TouchableOpacity
                          key={`seg-${i}`}
                          style={[styles.operatorButton, isSelected && styles.selectedOption]}
                          onPress={() => setAdvancedSegmentation(col)}
                        >
                          <Text
                            style={isSelected ? styles.selectedOptionText : styles.operatorText}
                          >
                            {col}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </>
              )}

              {/* Opérateurs => selon Indicateur ou Segmentation */}
              {operatorsToDisplay.length > 0 && (
                <>
                  <Text style={styles.modalSubtitle}>Opérateur</Text>
                  <ScrollView
                    horizontal
                    style={styles.operatorScrollContainer}
                    contentContainerStyle={{ paddingHorizontal: 10 }}
                    showsHorizontalScrollIndicator={false}
                  >
                    {operatorsToDisplay.map((op, index) => (
                      <TouchableOpacity
                        key={`op-${index}`}
                        style={[
                          styles.operatorButton,
                          advancedOperator === op && styles.selectedOption,
                        ]}
                        onPress={() => setAdvancedOperator(op)}
                      >
                        <Text
                          style={
                            advancedOperator === op
                              ? styles.selectedOptionText
                              : styles.operatorText
                          }
                        >
                          {op}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              {/* Valeur (clavier numeric si Indicateur, default si Segmentation) */}
              <Text style={styles.modalSubtitle}>Valeur</Text>
              <TextInput
                style={styles.input}
                placeholder="Entrez une valeur"
                value={advancedValue}
                onChangeText={text => setAdvancedValue(text)}
                keyboardType={advancedIndicateur ? 'numeric' : 'default'}
              />

              {/* Autocomplétion si segmentation */}
              {advancedSegmentation !== '' && autoCompleteOptions.length > 0 && (
                <View style={styles.autoCompleteContainer}>
                  {autoCompleteOptions.map((row, idx) => {
                    const val = row[advancedSegmentation];
                    return (
                      <TouchableOpacity
                        key={`auto-${idx}`}
                        style={styles.autoCompleteItem}
                        onPress={() => {
                          setAdvancedValue(val);
                          setAutoCompleteOptions([]);
                        }}
                      >
                        <Text style={{ color: '#333' }}>{val}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Circuit + Période => seulement si Indicateur */}
              {advancedIndicateur !== '' && (
                <>
                  <Text style={styles.modalSubtitle}>Circuit</Text>
                  <ScrollView
                    horizontal
                    style={styles.dropdown}
                    showsHorizontalScrollIndicator={false}
                  >
                    {circuitOptions.map((val, index) => (
                      <TouchableOpacity
                        key={`circ-${index}`}
                        style={[
                          styles.operatorButton,
                          selectedCircuit === val && styles.selectedOption,
                        ]}
                        onPress={() => setSelectedCircuit(val)}
                      >
                        <Text
                          style={
                            selectedCircuit === val
                              ? styles.selectedOptionText
                              : styles.operatorText
                          }
                        >
                          {val}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <Text style={styles.modalSubtitle}>Période</Text>
                  <ScrollView
                    horizontal
                    style={styles.dropdown}
                    showsHorizontalScrollIndicator={false}
                  >
                    {periodeOptions.map((val, index) => (
                      <TouchableOpacity
                        key={`peri-${index}`}
                        style={[
                          styles.operatorButton,
                          selectedPeriod === val && styles.selectedOption,
                        ]}
                        onPress={() => setSelectedPeriod(val)}
                      >
                        <Text
                          style={
                            selectedPeriod === val
                              ? styles.selectedOptionText
                              : styles.operatorText
                          }
                        >
                          {val}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              {/* Boutons Effacer / Valider */}
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.clearButton} onPress={clearAdvancedFilter}>
                  <Text style={styles.buttonClearFinal}>Effacer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.applyButton} onPress={applyAdvancedFilter}>
                  <Text style={styles.buttonApplyFinal}>Valider</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* LISTE DES RÉSULTATS (selon F1, F2, F3 + advancedFilter) */}
          {activeFilterCount === 1 && (
            <FlatList
              data={filteredData}
              keyExtractor={(item) => `level1-${item}`}
              renderItem={({ item: firstItem }) => {
                const key = `ref1-${selectedFilters[0]}-${firstItem}`;
                return (
                  <View>
                    <TouchableOpacity
                      style={styles.listItem}
                      onPress={() => toggleExpandReferences1(firstItem)}
                    >
                      <View style={styles.chevronContainer}>
                        <FontAwesome
                          name={expandedItems[key] ? 'chevron-up' : 'chevron-down'}
                          size={14}
                          color="#2B26BF"
                        />
                      </View>
                      <Text style={styles.TextList}>{firstItem}</Text>
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
                              onPress={() =>
                                handleReferenceClick(referenceItem.codeEAN, referenceItem.intitule)
                              }
                            >
                              <Text>{referenceItem.filtrerViaValue}</Text>
                              <Text>{referenceItem.intitule}</Text>
                              <View style={styles.separator} />
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
                      <View style={styles.chevronContainer}>
                        <FontAwesome
                          name={expandedItems[firstItem] ? 'chevron-up' : 'chevron-down'}
                          size={14}
                          color="#2B26BF"
                        />
                      </View>
                      <Text style={styles.TextList}>{firstItem}</Text>
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
                                <TouchableOpacity
                                  style={styles.subListItem}
                                  onPress={() => toggleExpandReferences2(firstItem, secondItem)}
                                >
                                  <View style={styles.chevronContainer}>
                                    <FontAwesome
                                      name={expandedItems[key] ? 'chevron-up' : 'chevron-down'}
                                      size={14}
                                      color="#2B26BF"
                                    />
                                  </View>
                                  <Text style={styles.TextList}>{secondItem}</Text>
                                </TouchableOpacity>
                                {expandedItems[key] &&
                                  dynamicData[key] &&
                                  dynamicData[key].length > 0 && (
                                    <FlatList
                                      data={dynamicData[key]}
                                      keyExtractor={(refItem, index) =>
                                        `ref-${firstItem}-${secondItem}-${index}`
                                      }
                                      renderItem={({ item: referenceItem }) => (
                                        <TouchableOpacity
                                          style={styles.referenceItem}
                                          onPress={() =>
                                            handleReferenceClick(
                                              referenceItem.codeEAN,
                                              referenceItem.intitule
                                            )
                                          }
                                        >
                                          <Text>{referenceItem.intitule}</Text>
                                          <View style={styles.separator} />
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
                    <TouchableOpacity
                      style={styles.listItem}
                      onPress={() => toggleExpandFirst(firstItem)}
                    >
                      <FontAwesome
                        name={expandedItems[firstItem] ? 'chevron-up' : 'chevron-down'}
                        size={14}
                        color="#2B26BF"
                      />
                      <Text style={styles.TextList}>{firstItem}</Text>
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
                                <TouchableOpacity
                                  style={styles.subListItem}
                                  onPress={() => toggleExpandSecond(firstItem, secondItem)}
                                >
                                  <View style={styles.chevronContainer}>
                                    <FontAwesome
                                      name={expandedItems[compositeKey2] ? 'chevron-up' : 'chevron-down'}
                                      size={14}
                                      color="#2B26BF"
                                    />
                                  </View>
                                  <Text style={styles.TextList}>{secondItem}</Text>
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
                                            <TouchableOpacity
                                              style={styles.thirdListItem}
                                              onPress={() =>
                                                toggleExpandReference(firstItem, secondItem, thirdItem)
                                              }
                                            >
                                              <View style={styles.chevronContainer}>
                                                <FontAwesome
                                                  name={
                                                    expandedItems[compositeKeyRef]
                                                      ? 'chevron-up'
                                                      : 'chevron-down'
                                                  }
                                                  size={14}
                                                  color="#2B26BF"
                                                />
                                              </View>
                                              <Text style={styles.TextList}>{thirdItem}</Text>
                                            </TouchableOpacity>
                                            {expandedItems[compositeKeyRef] &&
                                              dynamicData[compositeKeyRef] &&
                                              dynamicData[compositeKeyRef].length > 0 && (
                                                <FlatList
                                                  data={dynamicData[compositeKeyRef]}
                                                  keyExtractor={(item, index) =>
                                                    `ref-${firstItem}-${secondItem}-${thirdItem}-${index}`
                                                  }
                                                  renderItem={({ item: referenceItem }) => (
                                                    <TouchableOpacity
                                                      style={styles.referenceItem}
                                                      onPress={() =>
                                                        handleReferenceClick(
                                                          referenceItem.codeEAN,
                                                          referenceItem.intitule
                                                        )
                                                      }
                                                    >
                                                      <Text>{referenceItem.intitule}</Text>
                                                      <View style={styles.separator} />
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

          {/* Modal de filtre classique (F1, F2, F3) */}
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

          {/* Modal pour Filtrer via */}
          <Modal
            visible={filtrerViaModalVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setFiltrerViaModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Filtrer via</Text>
                <FlatList
                  data={['Aucun filtre', ...indicateur]}
                  keyExtractor={(item, index) => `filtrer-${index}`}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.modalOption,
                        item === filtrerVia && styles.selectedOption,
                      ]}
                      onPress={() => {
                        setFiltrerVia(item);
                        setFiltrerViaModalVisible(false);
                      }}
                    >
                      <Text
                        style={
                          item === filtrerVia ? styles.selectedOptionText : styles.modalOptionText
                        }
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
                <TouchableOpacity style={styles.closeButton} onPress={() => setFiltrerViaModalVisible(false)}>
                  <Text style={styles.closeButtonText}>Fermer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Modal
            visible={circuitModalVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setCircuitModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Choisir un circuit</Text>
                <FlatList
                  data={circuitOptions}
                  keyExtractor={(item, index) => `circuit-${index}`}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.modalOption}
                      onPress={() => {
                        setSelectedCircuit(item);
                        setCircuitModalVisible(false);
                      }}
                    >
                      <Text style={styles.modalOptionText}>{item}</Text>
                    </TouchableOpacity>
                  )}
                />
                <TouchableOpacity style={styles.closeButton} onPress={() => setCircuitModalVisible(false)}>
                  <Text style={styles.closeButtonText}>Fermer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Modale pour le choix de la Période */}
          <Modal
            visible={periodModalVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setPeriodModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Choisir une période</Text>
                <FlatList
                  data={periodeOptions}
                  keyExtractor={(item, index) => `periode-${index}`}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.modalOption}
                      onPress={() => {
                        setSelectedPeriod(item);
                        setPeriodModalVisible(false);
                      }}
                    >
                      <Text style={styles.modalOptionText}>{item}</Text>
                    </TouchableOpacity>
                  )}
                />
                <TouchableOpacity style={styles.closeButton} onPress={() => setPeriodModalVisible(false)}>
                  <Text style={styles.closeButtonText}>Fermer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>


          {/* Modal pour afficher la page résultat lors du clic sur une référence */}
          <Modal
            visible={refModalVisible}
            transparent
            animationType="slide"
            onRequestClose={closeRefModal}
          >
            {selectedEan && <ModalPage barcode={selectedEan} onClose={closeRefModal} />}
          </Modal>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default SegmentationPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#F5F5F5',
    paddingBottom: -50,
  },
  filterContainer: {
    marginBottom: 5,
    paddingVertical: 5,
    maxHeight: 50,
    minHeight: 50,
  },
  filterButton: {
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 5,

  },
  activeFilter: {
    backgroundColor: '#3A3FD4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveFilter: {
    backgroundColor: '#C1C1C1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterText: {
    color: 'white',
    fontWeight: 'bold',
  },
  // --- Conteneur pour les boutons d'actions du filtre ---
  filterActionsContainer: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 10,
    alignItems: 'center',
  },
  // Bouton avec picto flèche : 5% de la largeur, sans bordure
  arrowButton: {
    width: '5%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Bouton "Filtrer via" : 25% de la largeur, avec indication sous le texte
  filterViaButton: {
    width: '25%',
    borderWidth: 1,
    borderColor: '#3A3FD4',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  filterViaText: {
    fontWeight: 'bold',
    color: 'black',
  },
  filterViaSelected: {
    fontSize: 12,
    color: 'gray',
  },
  // Bouton pour le filtre avancé : 70% de la largeur
  advancedToggleButton: {
    width: '70%',
    padding: 10,
    backgroundColor: 'transparent',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3A3FD4',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  advancedToggleText: {
    fontWeight: 'bold',
    color: 'black',
  },
  // --- Section avancée ---
  advancedFilterContainer: {
    backgroundColor: '#7579FF',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  advancedFilterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: 'white',
    alignSelf: 'center',
  },
  selectionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  selectionButton: {
    flex: 1,
    padding: 10,
    backgroundColor: '#989AFF',
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
    borderWidth: 0,
    borderColor: "white",
  },
  selectedButton: {
    backgroundColor: '#3A3FD4',
    borderWidth: 0,
  },
  selectedButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  buttonText: {
    color: 'black',
  },
  selectedButtonTextFinal: {
    color: 'white',
    fontWeight: 'bold',
  },
  buttonApplyFinal: {
    color: 'black',
    fontWeight: 'bold',
  },
  buttonClearFinal: {
    color: 'white',
    fontWeight: 'bold',
  },
  operatorScrollContainer: {
    width: '100%',
    marginBottom: 10,
  },
  operatorButton: {
    padding: 8,
    backgroundColor: "#989AFF",
    borderRadius: 4,
    marginHorizontal: 2,
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  operatorText: {
    color: 'black',
  },
  selectedOption: {
    backgroundColor: '#3A3FD4',
    borderColor: '#3A3FD4',
  },
  selectedOptionText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    color: 'white',
  },
  input: {
    borderWidth: 1,
    borderColor: '#989AFF',
    width: '100%',
    padding: 8,
    borderRadius: 4,
    marginBottom: 10,
    backgroundColor: '#989AFF',
  },
  dropdown: {
    maxHeight: 80,
    width: '100%',
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  applyButton: {
    padding: 10,
    backgroundColor: '#98FFBF',
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  clearButton: {
    padding: 10,
    backgroundColor: '#3A3FD4',
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  // --- Styles pour l'autocomplétion ---
  autoCompleteContainer: {
    backgroundColor: 'white',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 4,
    maxHeight: 150,
    marginBottom: 10,
  },
  autoCompleteItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  // --- Liste hiérarchique ---
  listItem: {
    flexDirection: 'row',
    padding: 10,
    margin: 5,
  },
  subListItem: {
    flexDirection: 'row',
    padding: 10,
    paddingLeft: 20,
    marginLeft: 20,
    borderRadius: 0,
    margin: 5,
  },
  thirdListItem: {
    flexDirection: 'row',
    padding: 10,
    paddingLeft: 40,
    borderRadius: 0,
    marginLeft: 40,
    margin: 5,
  },
  referenceItem: {
    padding: 6,
    marginTop: 5,
    borderRadius: 4,
  },
  TextList: {},
  chevronContainer: {
    width: 15,
    alignItems: 'center',
    marginRight: 5,
  },
  separator: {
    height: 1,
    backgroundColor: '#3A3FD4',
    marginTop: 5,
  },
  // --- Modale "classique" (pour F1, F2, F3) ---
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
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#3A3FD4',
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
  closeButton: {
    padding: 10,
    backgroundColor: '#3A3FD4',
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 60,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 14,
  },
  circuitButton: {
    width: '25%',
    borderWidth: 1,
    borderColor: '#3A3FD4',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  circuitButtonText: {
    fontWeight: 'bold',
    color: 'black',
  },
  circuitSelected: {
    fontSize: 12,
    color: 'gray',
  },
  // Bouton pour le choix de la Période : 25% de la largeur
  periodButton: {
    width: '25%',
    borderWidth: 1,
    borderColor: '#3A3FD4',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  periodButtonText: {
    fontWeight: 'bold',
    color: 'black',
  },
  periodSelected: {
    fontSize: 12,
    color: 'gray',
  },
});
