import React, { useState, useEffect } from 'react';
import {View,Text,StyleSheet,TouchableOpacity,SafeAreaView,ScrollView,FlatList,Modal} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { codeEAN, circuit, periode, indicateur, valeurPeriodes, valeurcircuit,segmentation,denominationProduit } from '../utils/columnConfig';
import { fetchDataByDynamicColumns,fetchReferences, fetchFilteredColumnValue,fetchReferencesWithIndicators } from '../utils/database';
import { FontAwesome } from '@expo/vector-icons';

interface ModalPageProps {
  barcode: string; // Code EAN transmis depuis la page Historique
  onClose: () => void; // Fonction pour fermer la modale
}

const AppPage : React.FC<ModalPageProps> = ({ barcode, onClose }) => {

  //console.log(indicateur,segmentation);

  const valeurPeriodesOptions = valeurPeriodes.map((item) => item[periode[0]]);
  const valeurCircuitOptions = valeurcircuit.map((item) => item[circuit[0]]);
  //console.log(valeurPeriodesOptions,valeurCircuitOptions);
  const [referencesData, setReferencesData] = useState<any[][]>([[], []]);
  const [sortBy, setSortBy] = useState<string | null>(indicateur[0]); // Valeur sélectionnée pour "Classer par"
  const [order, setOrder] = useState<'Croissant' | 'Décroissant'>('Décroissant'); // Valeur pour l'ordre
  const [filterValue, setFilterValue] = useState<string | null>(segmentation[0]); // Valeur sélectionnée pour "Filtrer"
  const [expandedRef, setExpandedRef] = useState<number | null>(null); // État pour gérer la référence ouverte
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [currentFilter, setCurrentFilter] = useState<string | null>(null);
  const [selectedPeriode, setSelectedPeriode] = useState<string>(valeurPeriodesOptions[0]);
  const [selectedCircuit, setSelectedCircuit] = useState<string>(valeurCircuitOptions[0]);
  const [selectedComparisonPeriode, setSelectedComparisonPeriode] = useState<string>(valeurPeriodesOptions[1]);
  const [data, setData] = useState<any[]>([]); // Données récupérées
  const [ean, setEAN] = useState<string>(barcode); // Exemple de code EAN
  const [modalOptions, setModalOptions] = useState<string[]>([]);
  const [filteredColumnValue, setFilteredColumnValue] = useState<string | null>(null); // Valeur de la colonne filtrée pour la référence scannée
  const [indicatorsData, setIndicatorsData] = useState<any[]>([]); 
  const [visibleReferences, setVisibleReferences] = useState<number>(20); // Commence avec 20 références
  
  const [scannedRank, setScannedRank] = useState<number>(0); // Commence avec 20 références
  


  const openModal = (filterType: string) => {
    setCurrentFilter(filterType);

    if (filterType === 'periode') setModalOptions(valeurPeriodesOptions);
    if (filterType === 'circuit') setModalOptions(valeurCircuitOptions);
    if (filterType === 'comparisonPeriode') setModalOptions(valeurPeriodesOptions);
    if (filterType === 'classerPar') setModalOptions(indicateur);
    if (filterType === 'filtrer') setModalOptions(segmentation);

    setModalVisible(true);
  };

  // Sélectionner une valeur
  const handleSelect = (value: string) => {
    if (currentFilter === 'periode') setSelectedPeriode(value);
    if (currentFilter === 'circuit') setSelectedCircuit(value);
    if (currentFilter === 'comparisonPeriode') setSelectedComparisonPeriode(value);
    if (currentFilter === 'classerPar') setSortBy(value);
    if (currentFilter === 'filtrer') setFilterValue(value);

    setModalVisible(false);
  };

    // Fonction pour basculer l'ordre entre "Croissant" et "Décroissant"
    const toggleOrder = () => {
      setOrder((prevOrder) => (prevOrder === 'Croissant' ? 'Décroissant' : 'Croissant'));
    };

  const loadData = async () => {
    try {
      const result = await fetchDataByDynamicColumns(
        { ean, periode: selectedPeriode, periodeComparaison :selectedComparisonPeriode, circuit: selectedCircuit },
        { codeEAN, circuit, periode, indicateur }
      );
      setData(result); // Met à jour les données
    } catch (error) {
      console.error('Erreur lors de la récupération des données :', error);
    }
  };

  useEffect(() => {
    loadData(); // Appeler la fonction au chargement ou lors de modifications
  }, [selectedPeriode, selectedCircuit, selectedComparisonPeriode]); // Dépendances pertinentes

  useEffect(() => {
    const loadFilteredColumnValue = async () => {
      if (!filterValue) return;
      const result = await fetchFilteredColumnValue(barcode, filterValue,codeEAN[0]);
      setFilteredColumnValue(result);
    };
    loadFilteredColumnValue();
  }, [filterValue]);

  //console.log(circuit[0],periode,selectedCircuit,selectedPeriode,);

  useEffect(() => {
    const loadReferences = async () => {
      try {
        const result = await fetchReferencesWithIndicators(
          codeEAN[0], // Colonne contenant les codes EAN
          sortBy, // Indicateur utilisé pour le tri
          order, // Ordre de tri
          denominationProduit[0], // Colonne contenant l'intitulé des références
          circuit[0], // Colonne contenant les circuits
          periode[0], // Colonne contenant les périodes
          selectedCircuit, // Circuit sélectionné
          selectedPeriode, // Période sélectionnée
          selectedComparisonPeriode, // Période de comparaison
          indicateur, // Liste des indicateurs
          visibleReferences, // Nombre de références à afficher
          ean // Code EAN scanné
        );
  
        setReferencesData(result.references);
        setScannedRank(result.scannedRank); // Stocke la position de la référence
      } catch (error) {
        console.error('Erreur lors du chargement des références :', error);
      }
    };
  
    loadReferences();
  }, [sortBy, order, selectedCircuit, selectedPeriode, selectedComparisonPeriode, visibleReferences]);
  

  const fetchIndicatorsForReference = async (ean: string) => {
    try {
      const result = await fetchDataByDynamicColumns(
        {
          ean,
          periode: selectedPeriode,
          periodeComparaison: selectedComparisonPeriode,
          circuit: selectedCircuit,
        },
        { codeEAN, circuit, periode, indicateur }
      );

      setIndicatorsData(result);
    } catch (error) {
      console.error('Erreur lors de la récupération des indicateurs :', error);
    }
  };

  const toggleReference = async (ean: string) => {
    if (expandedRef === ean) {
      setExpandedRef(null);
      setIndicatorsData([]);
    } else {
      setExpandedRef(ean);
      await fetchIndicatorsForReference(ean);
    }
  };

  const formatValue = (value: any) => {
    if (value === undefined || value === null || isNaN(Number(value))) return '-'; // Gestion des valeurs non numériques
    const num = Number(value); // Convertir en nombre pour éviter les erreurs
    return Math.abs(num) < 10 ? num.toFixed(1) : Math.round(num).toString();
  };

  return (
     <LinearGradient
     colors={['#454AD8', '#7579FF', '#F5F5F5']}
     locations={[0, 0.42, 0.42]} // 40% dégradé, reste F5F5F5
     start={{ x: 0, y: 0 }}
     end={{ x: 0, y: 1 }}
    style={styles.fond}
    >
    <SafeAreaView style={styles.safeArea}>
      {/* Zone 1 : Informations sur la référence scannée */}
      {/* Bouton Fermer */}
     
      <View style={styles.headerSection}>
      <TouchableOpacity style={styles.closeButtonTop} onPress={onClose}>
            <Text style={styles.closeButtonTextTop}>Fermer</Text>
      </TouchableOpacity>
       
        <Text style={styles.referenceTitle}>Dénomination produit Marque + EAN</Text>

        {/* Filtres (Période, Circuit, Période de comparaison) côte à côte */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, { flex: 1 }]} // 25% pour Période
            onPress={() => openModal('periode')}
          >
            <Text style={styles.filterText}>Période</Text>
            <Text style={styles.filterValue}>{selectedPeriode || 'Choisir'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, { flex: 1 }]} // 25% pour Circuit
            onPress={() => openModal('circuit')}
          >
            <Text style={styles.filterText}>Circuit</Text>
            <Text style={styles.filterValue}>{selectedCircuit || 'Choisir'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, { flex: 2 }]} // 50% pour Période de comparaison
            onPress={() => openModal('comparisonPeriode')}
          >
            <Text style={styles.filterText}>Période de comparaison</Text>
            <Text style={styles.filterValue}>
              {selectedComparisonPeriode || 'Choisir'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Modale */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Sélectionnez une valeur</Text>
              <FlatList
                data={modalOptions}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={() => handleSelect(item)}
                  >
                    <Text style={styles.modalOptionText}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Indicateurs */}
        <View style={styles.indicatorsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.indicatorsWrapper}>
          {indicateur.map((indicator, index) => (
            <View key={index} style={styles.indicatorBox}>
              <View style={styles.indicatorTopSection}>
                <Text style={styles.indicatorTitle}>{indicator}</Text>
                <Text style={styles.indicatorValue}>
                  {data.length > 0 ? data[0][0][indicator] || '-' : '-'}
                </Text>
              </View>
              <View style={styles.indicatorMiddleSection}>
                <Text style={styles.indicatorSubTitle}>Écart</Text>
                <Text style={styles.indicatorDelta}>
                  {data?.[0]?.[0]?.[indicator] !== undefined && data?.[1]?.[0]?.[indicator] !== undefined
                  ? (data[1][0][indicator] - data[0][0][indicator]).toFixed(0).toString()
                  : '-'}
                </Text>
              </View>
              <View style={styles.indicatorBottomSection}>
                <Text style={styles.indicatorSubTitle}>Évolution</Text>
                <Text style={styles.indicatorEvolution}>
                {data?.[0]?.[0]?.[indicator] !== undefined && data?.[1]?.[0]?.[indicator] !== undefined
                  ? ((data[1][0][indicator] - data[0][0][indicator])/data[0][0][indicator]*100).toFixed(1) + `%`
                  : '-'}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
        </View>
      </View>

      {/* Zone 2 : Filtres additionnels */}
      {/* Filtres secondaires */}
      <View style={styles.additionalFilters}>
        {/* Bouton Classer par */}
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => openModal('classerPar')}
        >
          <Text style={styles.dropdownText}>Classer par</Text>
          <Text style={styles.selectedValue}>{sortBy || 'Choisir'}</Text>
        </TouchableOpacity>

        {/* Bouton Ordre */}
        <TouchableOpacity style={styles.dropdownButton} onPress={toggleOrder}>
          <Text style={styles.dropdownText}>Ordre</Text>
          <Text style={styles.selectedValue}>{order}</Text>
        </TouchableOpacity>

        {/* Bouton Filtrer */}
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => openModal('filtrer')}
        >
          <Text style={styles.dropdownText}>Filtrer</Text>
          <Text style={styles.selectedValue}>{filterValue || 'Choisir'}</Text>
        </TouchableOpacity>
      </View>

      {/* Modale */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sélectionnez une valeur</Text>
            <FlatList
              data={modalOptions}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={styles.modalOptionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Zone 3 : Liste des références */}
         {/* Ligne avec le niveau de ranking de la ref */}
      <View style={styles.rankingContainer}>
        <Text style={styles.rankingText}>
          {scannedRank 
            ? `Classement sur cet indicateur : ${scannedRank}`
            : "Référence non trouvée dans le classement"}
        </Text>
      </View>
          {/* liste de l'ensemble des refs à ouvrir */}
      <View style={styles.referencesSection}>
  
      <FlatList
  data={referencesData[0]} // Affiche les références de la période actuelle
  keyExtractor={(item, index) => index.toString()}
  renderItem={({ item, index }) => (
    <View>
      {/* Ligne principale de la référence */}
      <TouchableOpacity
        style={styles.referenceItem}
        onPress={() => toggleReference(item.ean)}
      >
        {/* Conteneur du chevron */}
        <View style={styles.chevronContainer}>
          <FontAwesome
            name={expandedRef === item.ean ? 'chevron-up' : 'chevron-down'}
            size={14}
            color="#2B26BF"
          />
        </View>

        {/* Conteneur de l'indicateur */}
        <View style={styles.indicatorContainer}>
          <Text style={styles.referenceIndicator}>{formatValue(item.indicatorValue)}</Text>
        </View>

        {/* Conteneur du nom de la référence */}
        <View style={styles.referenceContainer}>
          <Text style={styles.referenceTitle}>{item.reference}</Text>
        </View>
      </TouchableOpacity>

      {/* Ligne de séparation */}
      <View style={styles.separator} />

      {/* Section extensible des indicateurs (avec la structure en 3 parties) */}
      {expandedRef === item.ean && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.indicatorsWrapper}>
          {indicateur.map((indicator, idx) => (
            <View key={idx} style={styles.indicatorBox}>
              <View style={styles.indicatorTopSection}>
                <Text style={styles.indicatorTitle}>{indicator}</Text>
                <Text style={styles.indicatorValue}>
                  {formatValue(indicatorsData?.[0]?.[0]?.[indicator])}
                </Text>
              </View>
              <View style={styles.indicatorMiddleSection}>
                <Text style={styles.indicatorSubTitle}>Écart</Text>
                <Text style={styles.indicatorDelta}>
                  {indicatorsData?.[0]?.[0]?.[indicator] !== undefined &&
                  indicatorsData?.[1]?.[0]?.[indicator] !== undefined
                    ? formatValue(indicatorsData[1][0][indicator] - indicatorsData[0][0][indicator])
                    : '-'}
                </Text>
              </View>
              <View style={styles.indicatorBottomSection}>
                <Text style={styles.indicatorSubTitle}>Évolution</Text>
                <Text style={styles.indicatorEvolution}>
                  {indicatorsData?.[0]?.[0]?.[indicator] !== undefined &&
                  indicatorsData?.[1]?.[0]?.[indicator] !== undefined &&
                  indicatorsData[0][0][indicator] !== 0
                    ? (
                        ((indicatorsData[1][0][indicator] - indicatorsData[0][0][indicator]) /
                          indicatorsData[0][0][indicator]) *
                        100
                      ).toFixed(1) + '%'
                    : '-'}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  )}

                /* ✅ Vérification que la fonction s'exécute */
          ListFooterComponent={() => (
            <TouchableOpacity
              style={styles.loadMoreButton}
              onPress={() => {
                console.log("Chargement de 20 références supplémentaires...");
                setVisibleReferences(prev => prev + 20);
              }}
            >
              <Text style={styles.loadMoreText}>Charger plus de références</Text>
            </TouchableOpacity>
          )}
        />

      </View>

    </SafeAreaView>
    </LinearGradient>
    
  );
};

const styles = StyleSheet.create({
  chevronContainer: {
    width: 15, // Largeur fixe pour ne pas bouger
    alignItems: 'center',
  },
  indicatorContainer: {
    width: 50, // Largeur fixe pour les indicateurs
    alignItems: 'center',
  },
  referenceContainer: {
    flex: 1, // Utilise l'espace restant
  },
  referenceItem: {
    flexDirection: 'row', // Alignement horizontal
    justifyContent: 'space-between', // Espacement entre les éléments
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 12, // Réduit l’espacement
    paddingHorizontal: 20,
  },
  referenceIndicator: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2B26BF',
  },
  referenceTitle: {
    fontSize: 12,
    //fontWeight: 'bold',
    color: '#000',
    flexShrink: 1, // Garde le texte sur une seule ligne
  },
  separator: {
    height: 1,
    backgroundColor: '#3A3FD4',
    marginHorizontal: 50,
  },
  indicatorBox: {
    width: 100,
    height: 140,
    marginHorizontal: 4,
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
  },
  indicatorTopSection: {
    flex: 1.5,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  indicatorMiddleSection: {
    flex: 1,
    backgroundColor: '#3A3FD4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicatorBottomSection: {
    flex: 1,
    backgroundColor: '#3A3FD4',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'white',

  },
  indicatorTitle: {
    fontSize: 12,
    fontWeight: 'medium',
    color: '#000',
    textAlign: 'center',
  },
  indicatorSubTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  indicatorValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2B26BF',
  },
  indicatorDelta: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
  },
  indicatorEvolution: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
  },



  
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  headerSection: {
    flex: 0.7,
    paddingTop: 10,
    backgroundColor: 'transparent',
  },
  fond: {
   flex:1,
  },
  
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    marginBottom: 4,
    marginLeft: 10,
    marginRight: 10,
    height: 50,
  },
  filterButton: {
    backgroundColor: 'transparent',
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth:1,
    borderColor:'#98FFBF',
    paddingVertical: 10,
    paddingHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  filterValue: {
    fontSize: 12,
    color: 'white',
    
  },
  indicatorsWrapper: {
    height: 200,
    overflow: 'hidden',
    marginTop: 8,
    
  },
  indicatorsContainer: {
    flexDirection: 'row',
    height:200,
  },
  additionalFilters: {
  
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 8,
  },
  dropdownButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 8,
    marginHorizontal: 4,
    padding: 10,
    alignItems: 'center',
    borderWidth:1,
    borderColor:'#3A3FD4',
  },
  dropdownText: {
    fontSize: 14,
    fontWeight:'bold',
    color: '#3A3FD4',
  },
  
  
  referenceData: {
    marginTop: 8,
  },
  referenceVolume: {
    fontSize: 14,
    color: '#3A3FD4',
  },
  referenceDelta: {
    fontSize: 12,
    color: '#FF3B30',
  },
  referenceEvolution: {
    fontSize: 12,
    color: '#34C759',
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
    marginTop: 16,
    padding: 10,
    backgroundColor: '#3A3FD4',
    borderRadius: 8,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 14,
  },
  referencesSection: {
    flex: 1,
    padding: 1,
    backgroundColor: '#F5F5F5',
  },
  closeButtonTop: {
    padding: 4,
    paddingLeft:8,
    paddingRight:8,
    backgroundColor: '#98FFBF',
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginLeft: 8,
  },
  closeButtonTextTop: {
    color: '#0C0F40',
    fontWeight: 'bold',
    fontSize: 14,
  },
  selectedValue: {
    fontSize: 12,
    color: '#3A3FD4',
  },
  referenceText: { fontSize: 14, color: '#3A3FD4' },
  loadMoreContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  loadMoreButton: {
    backgroundColor: '#3A3FD4',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  loadMoreText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  rankingContainer: {
    alignItems: 'center',
    borderRadius: 8,
  },
  rankingText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3A3FD4',
  },
});


export default AppPage;
