import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [jwt, setJwt] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Vérifiez l'état de connexion
  const checkLoginStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('jwt');
      const storedCompanyName = await AsyncStorage.getItem('entreprise');
      if (token) {
        setJwt(token);
        setCompanyName(storedCompanyName || '');
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'état de connexion :', error);
    }
  };

  // Appeler checkLoginStatus une fois lors du montage du composant
  useEffect(() => {
    checkLoginStatus();
  }, []);

  return {
    jwt,
    setJwt,
    companyName,
    setCompanyName,
    isLoggedIn,
    setIsLoggedIn,
    checkLoginStatus,
  };
};
