import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { AntDesign } from '@expo/vector-icons';

interface ModalPageProps {
  barcode: string;
  onClose: () => void;
}

const ModalPage: React.FC<ModalPageProps> = ({ barcode, onClose }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Code-barres scanné</Text>
      <Text style={styles.barcode}>{barcode}</Text>
      <Button title="Fermer" onPress={onClose} />
    </View>
    
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white', // Ajoute un effet de fond semi-transparent
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#fff',
  },
  barcode: {
    fontSize: 18,
    marginBottom: 20,
    color: '#fff',
  },
});

export default ModalPage;
