import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  FlatList,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  CameraView,
  BarcodeScanningResult,
  CameraType,
  useCameraPermissions,
} from "expo-camera";
import {
  fetchDataByDynamicColumns,
  fetchReferences,
  fetchFilteredColumnValue,
  fetchReferencesWithIndicators,
  fetchListingReferencesWithIndicators,
  codeEAN,
  circuit,
  periode,
  indicateur,
  valeurPeriodes,
  valeurcircuit,
  segmentation,
  denominationProduit,
} from "../utils/database";
import { FontAwesome } from "@expo/vector-icons";
import {
  addEanToList,
  getEanList,
  initializeHistoricalEanList,
  removeEanFromList,
} from "../utils/EanDataContext";
import SwipeableItem from "react-native-swipeable-item";
import { GestureHandlerRootView } from "react-native-gesture-handler";

interface ModalPageProps {
  barcode: string; // Code EAN transmis depuis la page Historique
  onClose: () => void; // Fonction pour fermer la modale
}

const AppPage: React.FC<ModalPageProps> = ({ barcode, onClose }) => {
  const valeurPeriodesOptions = valeurPeriodes.map((item) => item[periode[0]]);
  const valeurCircuitOptions = valeurcircuit.map((item) => item[circuit[0]]);
  const [referencesData, setReferencesData] = useState<any[][]>([[], []]);
  const [referencesDataBis, setReferencesDataBis] = useState<any[][]>([[], []]);
  const [sortBy, setSortBy] = useState<string | null>(indicateur[0]); // Valeur sélectionnée pour "Classer par"
  const [order, setOrder] = useState<"Croissant" | "Décroissant">(
    "Décroissant"
  );
  const [filterValue, setFilterValue] = useState<string | null>(
    segmentation[0]
  );
  const [expandedRef, setExpandedRef] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [currentFilter, setCurrentFilter] = useState<string | null>(null);
  const [selectedPeriode, setSelectedPeriode] = useState<string>(
    valeurPeriodesOptions[0]
  );
  const [selectedCircuit, setSelectedCircuit] = useState<string>(
    valeurCircuitOptions[0]
  );
  const [selectedComparisonPeriode, setSelectedComparisonPeriode] =
    useState<string>(valeurPeriodesOptions[1]);
  const [data, setData] = useState<any[]>([]);
  const [ean, setEAN] = useState<string>(barcode);
  const [modalOptions, setModalOptions] = useState<string[]>([]);
  const [filteredColumnValue, setFilteredColumnValue] = useState<string | null>(
    null
  );
  const [indicatorsData, setIndicatorsData] = useState<any[]>([]);
  const [visibleReferences, setVisibleReferences] = useState<number>(20);
  const [scannedRank, setScannedRank] = useState<number>(0);
  const [scannedRankBis, setScannedRankBis] = useState<number>(0);
  const [referenceName, setReferenceName] = useState<string>("Chargement...");
  const [advancedFilter, setAdvancedFilter] = useState<{
    indicator: string;
    operator: string;
    value: string;
  }>({
    indicator: "",
    operator: "",
    value: "",
  });
  const [isAdvancedFilterEnabled, setIsAdvancedFilterEnabled] = useState(false);
  const [advancedFilterModalVisible, setAdvancedFilterModalVisible] =
    useState(false);
  const [comparaison, setComparaison] = useState(false);
  // Pour selectedListing, nous prévoyons trois valeurs : "Liste automatique", "Camera" et "Search"
  const listing: Array<"Liste automatique" | "Ajout manuel"> = [
    "Liste automatique",
    "Ajout manuel",
  ];
  const [selectedListing, setSelectedListing] =
    useState<string>("Liste automatique");
  const selection: Array<"Indicateurs" | "Camera" | "Search"> = [
    "Indicateurs",
    "Camera",
    "Search",
  ];
  const [selectedSelection, setSelectedSelection] =
    useState<string>("Indicateurs");

  const [showDetailedIndicators, setShowDetailedIndicators] = useState(true);
  const baseIndicatorHeight = 80;
  const expandedIndicatorHeight = 140;
  const [eanListe, setEanListe] = useState<string[]>([]);

  const [permission, requestPermission] = useCameraPermissions();
  const [i, setI] = useState<number>(0);

  // Fonction lancée lorsque la vue caméra détecte un code
  const handleCameraScan = (result: BarcodeScanningResult) => {
    const codeUn = barcode ? String(barcode).trim() : "";
    const codeDeux = result.data ? String(result.data).trim() : "";
    addEanToList(codeUn, codeDeux);
    setI((prev) => prev + 1);
    // Vous pouvez ajouter ici d'autres actions, par exemple mettre à jour un état ou déclencher une vibration
  };

  const handleBarcodePress = async (ean: string) => {
    try {
      const referenceCode = barcode ? String(barcode).trim() : "";
      const newBarcode = ean ? String(ean).trim() : "";
      // Ajoute le nouveau code barre dans la liste associée à la référence scannée
      await addEanToList(referenceCode, newBarcode);
      setI((prev) => prev + 1);
      // Vous pouvez ici mettre à jour l'état ou déclencher d'autres actions
    } catch (error) {
      console.error("Erreur lors de l'ajout du code EAN :", error);
    }
  };

  // --- Fonctions existantes ---
  const openAdvancedFilterModal = () => {
    setAdvancedFilterModalVisible(true);
  };

  const handleAdvancedFilterSelect = (type: string, value: string) => {
    setAdvancedFilter((prev) => ({ ...prev, [type]: value }));
  };

  const applyAdvancedFilter = () => {
    setIsAdvancedFilterEnabled(true);
    setAdvancedFilterModalVisible(false);
  };

  const resetAdvancedFilter = () => {
    setAdvancedFilter({ indicator: "", operator: "", value: "" });
    setIsAdvancedFilterEnabled(false);
  };

  const toggleComparaison = (value) => {
    setComparaison(value);
  };

  const openModal = (filterType: string) => {
    setCurrentFilter(filterType);

    if (filterType === "periode") setModalOptions(valeurPeriodesOptions);
    if (filterType === "circuit") setModalOptions(valeurCircuitOptions);
    if (filterType === "comparisonPeriode")
      setModalOptions(valeurPeriodesOptions);
    if (filterType === "classerPar") setModalOptions(indicateur);
    if (filterType === "filtrer") setModalOptions(segmentation);
    if (filterType === "listing") setModalOptions(listing);

    setModalVisible(true);
  };

  const handleSelect = (value: string) => {
    if (currentFilter === "periode") setSelectedPeriode(value);
    if (currentFilter === "circuit") setSelectedCircuit(value);
    if (currentFilter === "comparisonPeriode")
      setSelectedComparisonPeriode(value);
    if (currentFilter === "classerPar") setSortBy(value);
    if (currentFilter === "filtrer") setFilterValue(value);
    if (currentFilter === "listing") setSelectedListing(value);

    setModalVisible(false);
  };

  const toggleOrder = () => {
    setOrder((prevOrder) =>
      prevOrder === "Croissant" ? "Décroissant" : "Croissant"
    );
  };

  const loadData = async () => {
    try {
      const result = await fetchDataByDynamicColumns(
        {
          ean,
          periode: selectedPeriode,
          periodeComparaison: selectedComparisonPeriode,
          circuit: selectedCircuit,
          eanComp: ean,
        },
        { codeEAN, circuit, periode, indicateur }
      );
      setData(result);
    } catch (error) {
      console.error("Erreur lors de la récupération des données :", error);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedPeriode, selectedCircuit, selectedComparisonPeriode]);

  useEffect(() => {
    const loadFilteredColumnValue = async () => {
      if (!filterValue || filterValue === "Aucun filtre") {
        setFilteredColumnValue(null);
        return;
      }

      try {
        const result = await fetchFilteredColumnValue(
          barcode,
          filterValue,
          codeEAN[0]
        );
        setFilteredColumnValue(result);
      } catch (error) {
        console.error(
          "Erreur lors de la récupération de la valeur filtrée :",
          error
        );
        setFilteredColumnValue(null);
      }
    };

    loadFilteredColumnValue();
  }, [filterValue]);

  useEffect(() => {
    const loadReferences = async () => {
      try {
        const result = await fetchReferencesWithIndicators(
          codeEAN[0],
          sortBy,
          order,
          denominationProduit[0],
          circuit[0],
          periode[0],
          selectedCircuit,
          selectedPeriode,
          selectedComparisonPeriode,
          indicateur,
          visibleReferences,
          ean,
          filterValue || undefined,
          advancedFilter.indicator || undefined,
          advancedFilter.operator || undefined,
          advancedFilter.value !== "" ? advancedFilter.value : undefined
        );

        setReferencesData(result.references);
        setScannedRank(result.scannedRank);
      } catch (error) {
        console.error("Erreur lors du chargement des références :", error);
      }
    };

    loadReferences();
  }, [
    sortBy,
    order,
    selectedCircuit,
    selectedPeriode,
    selectedComparisonPeriode,
    visibleReferences,
    advancedFilter,
    filterValue,
  ]);

  //console.log("refdata sans 0",referencesData);

  const fetchIndicatorsForReference = async (
    ean: string,
    eanComp: string,
    periodeComparaison: string
  ) => {
    try {
      const result = await fetchDataByDynamicColumns(
        {
          ean,
          periode: selectedPeriode,
          periodeComparaison,
          circuit: selectedCircuit,
          eanComp,
        },
        { codeEAN, circuit, periode, indicateur }
      );
      setIndicatorsData(result);
    } catch (error) {
      console.error("Erreur lors de la récupération des indicateurs :", error);
    }
  };

  const toggleReference = async (ean: string) => {
    if (expandedRef === ean) {
      setExpandedRef(null);
      setIndicatorsData([]);
    } else {
      setExpandedRef(ean);
      if (comparaison) {
        const eanComp = ean;
        await fetchIndicatorsForReference(
          ean,
          eanComp,
          selectedComparisonPeriode
        );
      } else {
        const eanComp = barcode;
        await fetchIndicatorsForReference(ean, eanComp, selectedPeriode);
      }
    }
  };

  const toggleReferenceWithoutClosing = async (
    ean: string,
    newComparaison: boolean
  ) => {
    setExpandedRef(ean);
    if (newComparaison) {
      await fetchIndicatorsForReference(ean, ean, selectedComparisonPeriode);
    } else {
      await fetchIndicatorsForReference(ean, barcode, selectedPeriode);
    }
  };

  const formatValue = (value: any) => {
    if (value === undefined || value === null || isNaN(Number(value)))
      return "-";
    const num = Number(value);
    return Math.abs(num) < 10 ? num.toFixed(1) : Math.round(num).toString();
  };

  const fetchReferenceName = async () => {
    try {
      const result = await fetchFilteredColumnValue(
        barcode,
        denominationProduit[0],
        codeEAN[0]
      );
      if (result) {
        setReferenceName(result);
      } else {
        setReferenceName("Dénomination inconnue");
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération de la dénomination :",
        error
      );
      setReferenceName("Erreur chargement");
    }
  };

  useEffect(() => {
    fetchReferenceName();
  }, [barcode]);

  const manualListing = async () => {
    try {
      if (selectedListing === "Ajout manuel") {
        const codStr = barcode ? String(barcode).trim() : "";
        const donn = await getEanList(codStr);

        const result = await fetchListingReferencesWithIndicators(
          codeEAN[0],
          sortBy,
          order,
          denominationProduit[0],
          circuit[0],
          periode[0],
          selectedCircuit,
          selectedPeriode,
          selectedComparisonPeriode,
          indicateur,
          visibleReferences,
          ean,
          donn,
          filterValue || undefined,
          advancedFilter.indicator || undefined,
          advancedFilter.operator || undefined,
          advancedFilter.value !== "" ? advancedFilter.value : undefined
        );

        setReferencesDataBis(result.references);
        setScannedRankBis(result.scannedRank);
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération de la dénomination :",
        error
      );
      setReferenceName("Erreur chargement");
    }
  };

  useEffect(() => {
    manualListing();
  }, [
    sortBy,
    order,
    selectedCircuit,
    selectedPeriode,
    selectedComparisonPeriode,
    visibleReferences,
    advancedFilter,
    filterValue,
    selectedListing,
    i,
  ]);

  const [facing, setFacing] = useState<CameraType>("back");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  // État pour stocker la liste unique d'EAN et dénominations récupérée via AsyncStorage
  const [historicalEanList, setHistoricalEanList] = useState<any[]>([]);

  // Initialisation de la liste unique d'EAN lors du montage du composant
  useEffect(() => {
    const loadHistoricalData = async () => {
      const list = await initializeHistoricalEanList();
      setHistoricalEanList(list);
    };
    loadHistoricalData();
  }, []);

  // Fonction pour récupérer les suggestions basées sur searchQuery en utilisant historicalEanList
  const fetchEANSuggestions = async (query: string) => {
    if (!query) return [];
    // Utilise historicalEanList à la place des données factices
    return historicalEanList
      .filter(
        (item) =>
          item.ean.includes(query) ||
          item.name.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 3);
  };

  // Met à jour les suggestions dès que searchQuery change
  useEffect(() => {
    let isActive = true;
    const loadSuggestions = async () => {
      const results = await fetchEANSuggestions(searchQuery);
      if (isActive) setSearchSuggestions(results);
    };
    if (searchQuery.length > 0) {
      loadSuggestions();
    } else {
      setSearchSuggestions([]);
    }
    return () => {
      isActive = false;
    };
  }, [searchQuery, historicalEanList]);

  const handleRemoveEan = async (
    referenceKey: string,
    eanToRemove: string,
    refreshList: () => void
  ) => {
    try {
      await removeEanFromList(referenceKey, eanToRemove);
      console.log(`EAN ${eanToRemove} supprimé`);
      setI((prev) => prev + 1); // Vous pouvez déclencher un rafraîchissement de la liste après suppression
    } catch (error) {
      console.error("Erreur lors de la suppression de l'EAN:", error);
    }
  };

  // Rendu du bouton de suppression, qui apparaîtra lors du swipe vers la gauche
  const renderUnderlayRight = (
    item: any,
    referenceKey: string,
    refreshList: () => void
  ) => (
    <TouchableOpacity
      style={styles.deleteButton}
      onPress={() => handleRemoveEan(referenceKey, item.ean, refreshList)}
    >
      <Text style={styles.deleteText}>Supprimer</Text>
    </TouchableOpacity>
  );

  const formatIndicatorValue = (value: number): string => {
    const absVal = Math.abs(value);
    if (absVal < 1) {
      return value.toFixed(2);
    } else if (absVal < 20) {
      return value.toFixed(1);
    } else {
      return value.toFixed(0);
    }
  };

  return (
    <LinearGradient
      colors={["#454AD8", "#7579FF", "#F5F5F5"]}
      locations={[0, 0.42, 0.42]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.fond}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          {selectedSelection === "Indicateurs" && (
            <>
              {/* En-tête classique */}
              <View style={styles.headerContainer}>
                <TouchableOpacity
                  style={styles.closeButtonTop}
                  onPress={onClose}
                >
                  <Text style={styles.closeButtonTextTop}>Fermer</Text>
                </TouchableOpacity>
                <Text style={styles.referenceTitleWhite}>{referenceName}</Text>
              </View>

              {/* Filtres */}
              <View style={styles.filterContainer}>
                <TouchableOpacity
                  style={[styles.filterButton, { flex: 1 }]}
                  onPress={() => openModal("periode")}
                >
                  <Text style={styles.filterText}>Période</Text>
                  <Text
                    style={styles.filterValue}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {selectedPeriode || "Choisir"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.filterButton, { flex: 1 }]}
                  onPress={() => openModal("circuit")}
                >
                  <Text style={styles.filterText}>Circuit</Text>
                  <Text
                    style={styles.filterValue}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {selectedCircuit || "Choisir"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.filterButton, { flex: 2 }]}
                  onPress={() => openModal("comparisonPeriode")}
                >
                  <Text style={styles.filterText}>Période de comparaison</Text>
                  <Text
                    style={styles.filterValue}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {selectedComparisonPeriode || "Choisir"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Indicateurs */}
              <View style={styles.indicatorsWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {indicateur.map((indicator, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.indicatorBox,
                        {
                          height: showDetailedIndicators
                            ? expandedIndicatorHeight
                            : baseIndicatorHeight,
                        },
                      ]}
                    >
                      <View style={styles.indicatorTopSection}>
                        <Text
                          style={styles.indicatorTitle}
                          numberOfLines={2}
                          ellipsizeMode="tail"
                        >
                          {indicator}
                        </Text>
                        <Text style={styles.indicatorValue}>
                          {data?.[0]?.[0]?.[indicator] !== undefined
                            ? formatIndicatorValue(
                                Number(data[0][0][indicator])
                              )
                            : "-"}
                        </Text>
                      </View>
                      {showDetailedIndicators && (
                        <View style={styles.indicatorMiddleSection}>
                          <Text style={styles.indicatorSubTitle}>Écart</Text>
                          <Text style={styles.indicatorDelta}>
                            {data?.[0]?.[0]?.[indicator] !== undefined &&
                            data?.[1]?.[0]?.[indicator] !== undefined
                              ? formatIndicatorValue(
                                  Number(data[1][0][indicator]) -
                                    Number(data[0][0][indicator])
                                )
                              : "-"}
                          </Text>
                        </View>
                      )}
                      {showDetailedIndicators && (
                        <View style={styles.indicatorBottomSection}>
                          <Text style={styles.indicatorSubTitle}>
                            Évolution
                          </Text>
                          <Text style={styles.indicatorEvolution}>
                            {data?.[0]?.[0]?.[indicator] !== undefined &&
                            data?.[1]?.[0]?.[indicator] !== undefined
                              ? formatIndicatorValue(
                                  ((data[1][0][indicator] -
                                    data[0][0][indicator]) /
                                    data[0][0][indicator]) *
                                    100
                                ) + "%"
                              : "-"}
                          </Text>
                        </View>
                      )}
                    </View>
                  ))}
                </ScrollView>
              </View>
            </>
          )}

          {selectedSelection === "Camera" && (
            <View style={styles.cameraHeaderContainer}>
              {/* Vue caméra dans le header */}
              <CameraView
                style={styles.cameraHeader}
                onBarcodeScanned={handleCameraScan}
                facing={facing}
              />
              <TouchableOpacity
                style={styles.switchButton}
                onPress={() => setSelectedSelection("Indicateurs")}
              >
                <Text style={styles.buttonText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          )}

          {selectedSelection === "Search" && (
            <View style={styles.rechercheHeader}>
              <Text style={styles.referenceTitleWhite}>Ajout manuel</Text>
              {/* Zone de recherche intégrée directement */}
              <View style={styles.containerUn}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Rechercher un code barre..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchSuggestions.length > 0 && (
                  <FlatList
                    data={searchSuggestions}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.suggestionItem}
                        onPress={() => {
                          handleBarcodePress(item.ean);
                          setSearchQuery("");
                          setSearchSuggestions([]);
                        }}
                      >
                        <View style={styles.searchResult}>
                          <Text style={styles.buttonSubListText}>
                            {item.ean}
                          </Text>
                          <Text style={styles.buttonListText}>{item.name}</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                    style={styles.suggestionsContainer}
                  />
                )}
              </View>
              <TouchableOpacity
                style={styles.switchButton}
                onPress={() => setSelectedSelection("Indicateurs")}
              >
                <Text style={styles.buttonText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Zone 2 : Filtres additionnels */}
        {/* Filtres secondaires */}

        <View style={styles.filterScrollContainer}>
          {/* Zone 3 : Liste des références */}
          {/* Ligne avec le niveau de ranking de la ref */}
          <View style={styles.rankingContainer}>
            {selectedListing === "Liste automatique" ? (
              <Text style={styles.rankingText}>
                {scannedRank
                  ? `Classement sur cet indicateur : ${scannedRank}`
                  : "Référence non trouvée dans le classement"}
              </Text>
            ) : (
              <View style={styles.buttonsContainer}>
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => setSelectedSelection("Search")}
                >
                  <Text style={styles.buttonText}>Ajout manuel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => setSelectedSelection("Camera")}
                >
                  <Text style={styles.buttonText}>Ajout scan</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.additionalFilters}>
              {/* Bouton Classer par */}
              <TouchableOpacity
                style={styles.dropdownButtonBis}
                onPress={() => openModal("listing")}
              >
                <Text style={styles.dropdownTextBis}>Liste</Text>
                <Text
                  style={styles.selectedValueBis}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {selectedListing}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => openModal("classerPar")}
              >
                <Text style={styles.dropdownText}>Classer par</Text>
                <Text
                  style={styles.selectedValue}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {sortBy || "Choisir"}
                </Text>
              </TouchableOpacity>

              {/* Bouton Ordre */}
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={toggleOrder}
              >
                <Text style={styles.dropdownText}>Ordre</Text>
                <Text
                  style={styles.selectedValue}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {order}
                </Text>
              </TouchableOpacity>

              {/* Bouton Filtrer */}
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => openModal("filtrer")}
              >
                <Text style={styles.dropdownText}>Filtrer</Text>
                <Text
                  style={styles.selectedValue}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {filterValue || "Choisir"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={openAdvancedFilterModal}
              >
                <Text style={styles.dropdownText}>Filtre Avancé</Text>
                <Text
                  style={styles.selectedValue}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {isAdvancedFilterEnabled
                    ? `${advancedFilter.indicator} ${advancedFilter.operator} ${advancedFilter.value}`
                    : "Aucun"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
                renderItem={({ item }) => {
                  const isSelected =
                    item === sortBy ||
                    item === filterValue ||
                    item === selectedListing;

                  return (
                    <TouchableOpacity
                      style={[
                        styles.modalOption,
                        isSelected && styles.selectedModalOption,
                      ]}
                      onPress={() => handleSelect(item)}
                    >
                      <Text
                        style={[
                          styles.modalOptionText,
                          isSelected && styles.selectedModalOptionText,
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
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

        <Modal
          visible={advancedFilterModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setAdvancedFilterModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContainer}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modalContent}>
                {/* Bouton Fermer en haut à gauche */}
                <TouchableOpacity
                  style={styles.closeButtonTopClearBack}
                  onPress={() => setAdvancedFilterModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>Fermer</Text>
                </TouchableOpacity>

                {/* Sélectionner l'indicateur */}
                <Text style={styles.modalLabel}>Indicateur</Text>
                <FlatList
                  data={indicateur}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.modalOption,
                        advancedFilter.indicator === item &&
                          styles.selectedModalOption,
                      ]}
                      onPress={() =>
                        handleAdvancedFilterSelect("indicator", item)
                      }
                    >
                      <Text
                        style={[
                          styles.modalOptionText,
                          advancedFilter.indicator === item &&
                            styles.selectedModalOptionText,
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  )}
                />

                {/* Sélectionner l'opérateur (en ligne) */}
                <Text style={styles.modalLabel}>Opérateur</Text>
                <View style={styles.operatorsContainer}>
                  {["=", ">=", "<=", ">", "<"].map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.operatorButton,
                        advancedFilter.operator === item &&
                          styles.selectedOperator,
                      ]}
                      onPress={() =>
                        handleAdvancedFilterSelect("operator", item)
                      }
                    >
                      <Text
                        style={[
                          styles.operatorText,
                          advancedFilter.operator === item &&
                            styles.selectedOperatorText,
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Saisie de la valeur */}
                <Text style={styles.modalLabel}>Valeur</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="Entrer une valeur"
                  value={advancedFilter.value}
                  onChangeText={(text) =>
                    handleAdvancedFilterSelect("value", text)
                  }
                />

                {/* Boutons d'action (Appliquer & Réinitialiser bien alignés) */}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.applyButton}
                    onPress={applyAdvancedFilter}
                  >
                    <Text style={styles.applyButtonText}>Appliquer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.resetButton}
                    onPress={resetAdvancedFilter}
                  >
                    <Text style={styles.resetButtonText}>Réinitialiser</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </Modal>

        {/* liste de l'ensemble des refs à ouvrir */}
        {selectedListing === "Liste automatique" && (
          <View style={styles.referencesSection}>
            <FlatList
              data={referencesData[0]}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item, index }) => (
                // Conteneur global de l’item
                <View
                  style={[
                    styles.referenceItemContainer,
                    item.ean === barcode && styles.referenceItemContainerBis, // style spécial si l'item.ean correspond à barcode
                  ]}
                >
                  {/* Ligne principale de la référence */}
                  <TouchableOpacity
                    style={styles.referenceItemHeader}
                    onPress={() => toggleReference(item.ean)}
                  >
                    {/* Conteneur du chevron */}
                    <View style={styles.chevronContainer}>
                      <FontAwesome
                        name={
                          expandedRef === item.ean
                            ? "chevron-up"
                            : "chevron-down"
                        }
                        size={14}
                        color="#2B26BF"
                      />
                    </View>

                    {/* Conteneur de l'indicateur */}
                    <View style={styles.indicatorContainer}>
                      <Text style={styles.referenceIndicator}>
                        {formatValue(item.indicatorValue)}
                      </Text>
                    </View>

                    {/* Conteneur du nom de la référence */}
                    <View style={styles.referenceContainer}>
                      <Text style={styles.referenceTitle}>
                        {item.reference}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Contenu extensible */}
                  {expandedRef === item.ean && (
                    <View style={styles.expandedContent}>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.indicatorsWrapper}
                      >
                        {indicateur.map((indicator, idx) => (
                          <View key={idx} style={styles.indicatorBox}>
                            <View style={styles.indicatorTopSection}>
                              <Text style={styles.indicatorTitle}>
                                {indicator}
                              </Text>
                              <Text style={styles.indicatorValue}>
                                {formatValue(
                                  indicatorsData?.[0]?.[0]?.[indicator]
                                )}
                              </Text>
                            </View>
                            <View style={styles.indicatorMiddleSection}>
                              <Text style={styles.indicatorSubTitle}>
                                Écart
                              </Text>
                              <Text style={styles.indicatorDelta}>
                                {indicatorsData?.[0]?.[0]?.[indicator] !==
                                  undefined &&
                                indicatorsData?.[1]?.[0]?.[indicator] !==
                                  undefined
                                  ? formatValue(
                                      indicatorsData[1][0][indicator] -
                                        indicatorsData[0][0][indicator]
                                    )
                                  : "-"}
                              </Text>
                            </View>
                            <View style={styles.indicatorBottomSection}>
                              <Text style={styles.indicatorSubTitle}>
                                Évolution
                              </Text>
                              <Text style={styles.indicatorEvolution}>
                                {indicatorsData?.[0]?.[0]?.[indicator] !==
                                  undefined &&
                                indicatorsData?.[1]?.[0]?.[indicator] !==
                                  undefined &&
                                indicatorsData[0][0][indicator] !== 0
                                  ? (
                                      ((indicatorsData[1][0][indicator] -
                                        indicatorsData[0][0][indicator]) /
                                        indicatorsData[0][0][indicator]) *
                                      100
                                    ).toFixed(1) + "%"
                                  : "-"}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </ScrollView>

                      {/* Bouton switch pour activer/désactiver la comparaison */}
                      <View style={styles.switchContainer}>
                        <Switch
                          style={{
                            transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
                          }}
                          value={comparaison}
                          onValueChange={(value) => {
                            setComparaison(value);
                            toggleReferenceWithoutClosing(item.ean, value);
                          }}
                          ios_backgroundColor="#d3d3d3"
                          trackColor={{ false: "#e0e0e0", true: "#2B26BF" }}
                          thumbColor={comparaison ? "#ffffff" : "#ffffff"}
                        />
                        <Text style={styles.switchText}>
                          Comparer avec la ref scannée
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              )}
            />
          </View>
        )}

        {selectedListing === "Ajout manuel" && (
          <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={styles.referencesSection}>
              {referencesDataBis[0].length === 0 && (
                <Text style={styles.modalLabel}>La liste est vide</Text>
              )}

              <FlatList
                data={referencesDataBis[0]}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <SwipeableItem
                    item={item}
                    key={item.ean || Math.random().toString()}
                    snapPointsLeft={[100]} // Lorsqu'on glisse vers la gauche, on révèle 80px sur la droite
                    containerStyle={{ overflow: "visible" }} // Pour que l'underlay soit visible
                    renderUnderlayLeft={() => (
                      <View style={styles.underlayContainer}>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={async () => {
                            await removeEanFromList(barcode, item.ean);
                            setI((prev) => prev + 1);
                            // Mettez ici à jour votre état pour rafraîchir la liste, si besoin.
                          }}
                        >
                          <Text style={styles.deleteText}>Supprimer</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  >
                    <View
                      style={[
                        styles.referenceItemContainer,
                        item.ean === barcode &&
                          styles.referenceItemContainerBis, // style spécial si l'item.ean correspond à barcode
                      ]}
                    >
                      {/* Ligne principale de la référence */}
                      <TouchableOpacity
                        style={styles.referenceItemHeader}
                        onPress={() => toggleReference(item.ean)}
                      >
                        {/* Conteneur du chevron */}
                        <View style={styles.chevronContainer}>
                          <FontAwesome
                            name={
                              expandedRef === item.ean
                                ? "chevron-up"
                                : "chevron-down"
                            }
                            size={14}
                            color="#2B26BF"
                          />
                        </View>

                        {/* Conteneur de l'indicateur */}
                        <View style={styles.indicatorContainer}>
                          <Text style={styles.referenceIndicator}>
                            {formatValue(item.indicatorValue)}
                          </Text>
                        </View>

                        {/* Conteneur du nom de la référence */}
                        <View style={styles.referenceContainer}>
                          <Text style={styles.referenceTitle}>
                            {item.reference}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      {/* Contenu extensible */}
                      {expandedRef === item.ean && (
                        <View style={styles.expandedContent}>
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.indicatorsWrapper}
                          >
                            {indicateur.map((indicator, idx) => (
                              <View key={idx} style={styles.indicatorBox}>
                                <View style={styles.indicatorTopSection}>
                                  <Text style={styles.indicatorTitle}>
                                    {indicator}
                                  </Text>
                                  <Text style={styles.indicatorValue}>
                                    {formatValue(
                                      indicatorsData?.[0]?.[0]?.[indicator]
                                    )}
                                  </Text>
                                </View>
                                <View style={styles.indicatorMiddleSection}>
                                  <Text style={styles.indicatorSubTitle}>
                                    Écart
                                  </Text>
                                  <Text style={styles.indicatorDelta}>
                                    {indicatorsData?.[0]?.[0]?.[indicator] !==
                                      undefined &&
                                    indicatorsData?.[1]?.[0]?.[indicator] !==
                                      undefined
                                      ? formatValue(
                                          indicatorsData[1][0][indicator] -
                                            indicatorsData[0][0][indicator]
                                        )
                                      : "-"}
                                  </Text>
                                </View>
                                <View style={styles.indicatorBottomSection}>
                                  <Text style={styles.indicatorSubTitle}>
                                    Évolution
                                  </Text>
                                  <Text style={styles.indicatorEvolution}>
                                    {indicatorsData?.[0]?.[0]?.[indicator] !==
                                      undefined &&
                                    indicatorsData?.[1]?.[0]?.[indicator] !==
                                      undefined &&
                                    indicatorsData[0][0][indicator] !== 0
                                      ? (
                                          ((indicatorsData[1][0][indicator] -
                                            indicatorsData[0][0][indicator]) /
                                            indicatorsData[0][0][indicator]) *
                                          100
                                        ).toFixed(1) + "%"
                                      : "-"}
                                  </Text>
                                </View>
                              </View>
                            ))}
                          </ScrollView>

                          {/* Bouton switch pour activer/désactiver la comparaison */}
                          <View style={styles.switchContainer}>
                            <Switch
                              style={{
                                transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
                              }}
                              value={comparaison}
                              onValueChange={(value) => {
                                setComparaison(value);
                                toggleReferenceWithoutClosing(item.ean, value);
                              }}
                              ios_backgroundColor="#d3d3d3"
                              trackColor={{ false: "#e0e0e0", true: "#2B26BF" }}
                              thumbColor={comparaison ? "#ffffff" : "#ffffff"}
                            />
                            <Text style={styles.switchText}>
                              Comparer avec la ref scannée
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  </SwipeableItem>
                )}
              />
            </View>
          </GestureHandlerRootView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  /****************************
   *  NOUVEAUX STYLES POUR LA VUE CAMÉRA DANS LE HEADER
   ****************************/
  underlayContainer: {
    flex: 1,
    justifyContent: "center",

    alignItems: "flex-end",
    backgroundColor: "transparent",
    //paddingRight: 0,
    margin: 5,
  },
  deleteButton: {
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
    width: 90,
    height: "100%",
    margin: 2,
    padding: 5,
    borderRadius: 10,
  },
  deleteText: {
    color: "white",
    fontWeight: "bold",
  },
  searchResult: {
    display: "flex",
    flexDirection: "column",
  },
  containerUn: {
    margin: 20,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 5,
  },
  suggestionsContainer: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderTopWidth: 0,
    borderRadius: 5,
    marginTop: 2,
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },

  cameraHeaderContainer: {
    height: 250,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
    margin: 10,
    borderRadius: 20,
    overflow: "hidden",
  },
  cameraHeader: {
    width: "100%",
    height: "100%",
  },
  rechercheHeader: {
    height: 250,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    //margin:10,
    //borderRadius:20,
  },
  switchButton: {
    position: "absolute",
    bottom: 10,
    padding: 8,
    backgroundColor: "#3A3FD4",
    borderRadius: 8,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  buttonListText: {
    fontSize: 12,
    color: "black",
    //fontWeight: 'bold',
  },
  buttonSubListText: {
    fontSize: 10,
    color: "grey",
    fontWeight: "bold",
  },
  /****************************
   *  LES AUTRES STYLES EXISTANTS
   ****************************/
  referenceItemContainer: {
    backgroundColor: "#e1e1e1",
    borderRadius: 10,
    marginBottom: 5,
    marginHorizontal: 5,
  },
  referenceItemContainerBis: {
    backgroundColor: "#CFD1FF",
    borderRadius: 10,
    marginBottom: 5,
    marginHorizontal: 5,
  },
  referenceItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 7,
    backgroundColor: "transparent",
  },
  expandedContent: {
    marginTop: 6,
    paddingBottom: 10,
  },
  toggleDetailsButton: {
    paddingHorizontal: 15,
    borderRadius: 8,
    alignSelf: "center",
  },
  toggleDetailsText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  operatorsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginVertical: 10,
  },
  filterScrollContainer: {
    flexDirection: "column",
    paddingVertical: 10,
    backgroundColor: "#F5F5F5",
    borderRadius: 15,
  },
  operatorButton: {
    backgroundColor: "#F5F5F5",
    padding: 10,
    borderRadius: 8,
    width: 50,
    alignItems: "center",
  },
  operatorText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3A3FD4",
  },
  selectedOperator: {
    backgroundColor: "#2B26BF",
  },
  selectedOperatorText: {
    color: "white",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 10,
  },
  applyButton: {
    backgroundColor: "#3A3FD4",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  applyButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  resetButton: {
    backgroundColor: "#FF3B30",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  resetButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  closeButton: {
    backgroundColor: "#3A3FD4",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#3A3FD4",
    borderRadius: 8,
    padding: 10,
    width: "80%",
    textAlign: "center",
    marginBottom: 10,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#3A3FD4",
    marginBottom: 5,
  },
  chevronContainer: {
    width: 15,
    alignItems: "center",
  },
  indicatorContainer: {
    width: 50,
    alignItems: "center",
  },
  referenceContainer: {
    flex: 1,
  },
  referenceIndicator: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2B26BF",
  },
  referenceTitle: {
    fontSize: 12,
    color: "#0C0F40",
    flexShrink: 1,
    fontWeight: "bold",
  },
  referenceTitleWhite: {
    fontSize: 14,
    fontWeight: "bold",
    color: "white",
    flexShrink: 1,
    marginLeft: 10,
  },
  separator: {
    height: 1,
    backgroundColor: "#3A3FD4",
    marginHorizontal: 50,
  },
  indicatorBox: {
    width: 100,
    height: 140,
    marginHorizontal: 4,
    backgroundColor: "#979EFF",
    borderRadius: 8,
    overflow: "hidden",
  },
  indicatorTopSection: {
    flex: 1.5,
    backgroundColor: "transparent",
    borderWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderColor: "white",
    justifyContent: "center",
    alignItems: "center",
    padding: 4,
  },
  indicatorMiddleSection: {
    flex: 1,
    backgroundColor: "#3A3FD4",
    justifyContent: "center",
    alignItems: "center",
  },
  indicatorBottomSection: {
    flex: 1,
    backgroundColor: "#3A3FD4",
    justifyContent: "center",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "white",
  },
  indicatorTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  indicatorSubTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "white",
  },
  indicatorValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  indicatorDelta: {
    fontSize: 14,
    color: "white",
    fontWeight: "bold",
  },
  indicatorEvolution: {
    fontSize: 14,
    color: "white",
    fontWeight: "bold",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },
  headerSection: {
    paddingTop: 10,
    backgroundColor: "transparent",
  },
  fond: {
    flex: 1,
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "stretch",
    marginTop: 5,
  },
  filterButton: {
    backgroundColor: "#3A3FD4",
    marginHorizontal: 4,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  filterText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  filterValue: {
    fontSize: 12,
    color: "white",
  },
  indicatorsWrapper: {
    overflow: "hidden",
    marginTop: 6,
    marginBottom: 8,
    backgroundColor: "transparent",
  },
  indicatorsContainer: {
    flexDirection: "row",
    height: 200,
  },
  additionalFilters: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "transparent",
    padding: 8,
    paddingTop: 10,
  },
  dropdownButton: {
    flex: 1,
    backgroundColor: "transparent",
    borderRadius: 8,
    marginHorizontal: 4,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#3A3FD4",
  },
  dropdownButtonBis: {
    flex: 1,
    backgroundColor: "#3A3FD4",
    borderRadius: 8,
    marginHorizontal: 4,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#3A3FD4",
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#3A3FD4",
  },
  dropdownTextBis: {
    fontSize: 14,
    fontWeight: "bold",
    color: "white",
  },
  referenceData: {
    marginTop: 8,
  },
  referenceVolume: {
    fontSize: 14,
    color: "#3A3FD4",
  },
  referenceDelta: {
    fontSize: 12,
    color: "#FF3B30",
  },
  referenceEvolution: {
    fontSize: 12,
    color: "#34C759",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#3A3FD4",
  },
  modalOption: {
    padding: 10,
    marginBottom: 8,
    width: "100%",
    backgroundColor: "#F5F5F5",
    borderRadius: 4,
    alignItems: "center",
  },
  modalOptionText: {
    fontSize: 14,
    color: "#3A3FD4",
  },
  referencesSection: {
    flex: 1,
    padding: 0,
    backgroundColor: "#f5f5f5",
    marginBottom: -50,
  },
  closeButtonTop: {
    padding: 4,
    paddingLeft: 8,
    paddingRight: 8,
    backgroundColor: "#98FFBF",
    borderRadius: 8,
    alignSelf: "flex-start",
    marginLeft: 8,
  },
  closeButtonTopClearBack: {
    padding: 4,
    paddingLeft: 8,
    paddingRight: 8,
    backgroundColor: "#2B26BF",
    borderRadius: 8,
    alignSelf: "flex-start",
    marginLeft: 8,
  },
  closeButtonTextTop: {
    color: "#0C0F40",
    fontWeight: "bold",
    fontSize: 14,
  },
  selectedValue: {
    fontSize: 12,
    color: "#3A3FD4",
  },
  selectedValueBis: {
    fontSize: 12,
    color: "white",
  },
  referenceText: { fontSize: 14, color: "#3A3FD4" },
  loadMoreContainer: {
    alignItems: "center",
    marginVertical: 10,
  },
  loadMoreButton: {
    backgroundColor: "#3A3FD4",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: 200,
    alignSelf: "center",
    margin: 10,
  },
  loadMoreText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
    alignSelf: "center",
    width: 100,
  },
  rankingContainer: {
    alignItems: "center",
    borderRadius: 8,
    paddingVertical: 5,
  },
  rankingText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3A3FD4",
  },
  selectedModalOption: {
    backgroundColor: "#2B26BF",
  },
  selectedModalOptionText: {
    color: "white",
    fontWeight: "bold",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  text: {
    marginLeft: 10,
    fontSize: 16,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  switchText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#333",
  },
  sectionScan: {
    flex: 1,
    minHeight: 200,
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 0,
    width: "100%",
  },
  button: {
    backgroundColor: "#3A3FD4",
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginHorizontal: 5,
    borderRadius: 8,
  },
});

export default AppPage;
