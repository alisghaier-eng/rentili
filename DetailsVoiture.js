import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  Alert, 
  Switch, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Modal 
} from 'react-native';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';


import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';

export default function DetailsVoiture({ route }) {
  const { carId } = route.params;
  const [car, setCar] = useState(null);
  const [rentalDays, setRentalDays] = useState(0);
  const [wantsDriver, setWantsDriver] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDate, setShowStartDate] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);
  const [location, setLocation] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchCarDetails = async () => {
      try {
        const response = await axios.get(`http://192.168.9.57:6000/cars/${carId}`);
        setCar(response.data);
      } catch (err) {
        console.error('Erreur lors de la récupération des détails de la voiture:', err);
        Alert.alert('Erreur', 'Impossible de récupérer les détails de la voiture.');
      }
    };

    fetchCarDetails();
  }, [carId]);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        setIsAuthenticated(!!token);
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'authentification:', error);
      }
    };

    checkAuthentication();
  }, []);

  const calculateRentalDays = (startDate, endDate) => {
    const diffTime = Math.abs(endDate - startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleRentCar = () => {
    if (!car.availability) {
      if (isAuthenticated) {
        Alert.alert('Indisponible', 'Cette voiture est déjà réservée.');
      } else {
        setShowAuthModal(true);
      }
      return;
    }

    if (rentalDays <= 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner une période valide.');
      return;
    }

    if (wantsDriver && !location.trim()) {
      Alert.alert('Erreur', 'Veuillez spécifier une localisation pour le chauffeur.');
      return;
    }

    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    const totalAmount = car.priceperday * rentalDays;
    navigation.navigate('PaymentPage', {
      carId,
      rentalDays,
      totalAmount,
      startDate,
      endDate,
      wantsDriver,
      location,
    });
  };
  const getUserIdFromToken = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return null;
      const decoded = jwtDecode(token);
      return decoded.userId;
    } catch (error) {
      console.error('Erreur lors du décodage du token:', error);
      return null;
    }
  };
  const handleAddToCart = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Erreur', 'Vous devez être connecté pour ajouter une voiture au chariot.');
        return;
      }
    
      const decodedToken = jwtDecode(token);
      const userId = decodedToken.userId;  // Assurez-vous que userId est bien dans le token
      
      const response = await axios.post('http://192.168.9.57:5000/cart', {
        userId,
        carId,
      });
    
      Alert.alert('Succès', 'La voiture a été ajoutée au chariot.');
    } catch (error) {
      console.error('Erreur lors de l\'ajout au chariot:', error.response?.data || error.message);
      Alert.alert('Erreur', error.response?.data?.message || 'Impossible d\'ajouter la voiture au chariot.');
    }
  }  

  const handleAuthentication = async () => {
    await AsyncStorage.setItem('authToken', 'dummy-token');
    setIsAuthenticated(true);
    setShowAuthModal(false);
  };

  const showDatePicker = (type) => {
    if (type === 'start') setShowStartDate(true);
    else if (type === 'end') setShowEndDate(true);
  };

  const onDateChange = (event, selectedDate, type) => {
    if (type === 'start') {
      setStartDate(selectedDate || startDate);
      setRentalDays(calculateRentalDays(selectedDate || startDate, endDate));
      setShowStartDate(false);
    } else if (type === 'end') {
      setEndDate(selectedDate || endDate);
      setRentalDays(calculateRentalDays(startDate, selectedDate || endDate));
      setShowEndDate(false);
    }
  };

  const handleNavigateToLogin = () => {
    setShowAuthModal(false);
    navigation.navigate('LoginScreen', {
      fromPage: 'DetailsVoiture',
      carId,
      rentalDays,
      startDate,
      endDate,
      wantsDriver,
      location,
    });
  };

  if (!car) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement des détails de la voiture...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Image
          source={{ uri: car.image.startsWith('http') ? car.image : `http://192.168.9.57:5000${car.image}` }}
          style={styles.image}
        />
      </View>
      <View style={styles.details}>
        <Text style={styles.name}>{car.model}</Text>
        <Text style={styles.price}>Prix: {car.priceperday}/jour</Text>
        <Text style={styles.info}>Matricule : {car.licensePlate}</Text>
        <Text style={styles.info}>Transmission : {car.transmission}</Text>
        <Text style={styles.info}>Agence : {car.agency?.name || 'N/A'}</Text>
        <Text style={[styles.status, car.availability ? styles.available : styles.unavailable]}>
          {car.availability ? 'Disponible' : 'Non disponible'}
        </Text>
  
        {/* Afficher les champs de location uniquement si la voiture est disponible */}
        {car.availability && (
          <View style={styles.rentalContainer}>
            {/* Sélecteurs de dates */}
            <View style={styles.datePickerContainer}>
              <Text style={styles.inputLabel}>Date de début:</Text>
              <TouchableOpacity onPress={() => showDatePicker('start')}>
                <Text style={styles.dateText}>{startDate.toLocaleDateString()}</Text>
              </TouchableOpacity>
              {showStartDate && (
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display="default"
                  onChange={(e, date) => onDateChange(e, date, 'start')}
                />
              )}
  
              <Text style={styles.inputLabel}>Date de fin:</Text>
              <TouchableOpacity onPress={() => showDatePicker('end')}>
                <Text style={styles.dateText}>{endDate.toLocaleDateString()}</Text>
              </TouchableOpacity>
              {showEndDate && (
                <DateTimePicker
                  value={endDate}
                  mode="date"
                  display="default"
                  onChange={(e, date) => onDateChange(e, date, 'end')}
                />
              )}
            </View>
  
            {/* Chauffeur */}
            <View style={styles.driverContainer}>
              <Text style={styles.inputLabel}>Avec chauffeur ?</Text>
              <Switch
                value={wantsDriver}
                onValueChange={(value) => setWantsDriver(value)}
              />
            </View>
  
            {/* Localisation (si chauffeur sélectionné) */}
            {wantsDriver && (
              <View style={styles.locationInputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Entrez la localisation"
                  value={location}
                  onChangeText={setLocation}
                />
              </View>
            )}
          </View>
        )}
  
        {/* Boutons d'action */}
        {car.availability && (
          <View>
            <TouchableOpacity style={styles.button} onPress={handleAddToCart}>
              <Text style={styles.buttonText}>Ajouter au Chariot</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={handleRentCar}>
              <Text style={styles.buttonText}>Louer Maintenant</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
  
      {/* Modal de connexion */}
      <Modal
        visible={showAuthModal && !isAuthenticated}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowAuthModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Connexion Requise</Text>
            <TouchableOpacity style={styles.modalButton} onPress={handleNavigateToLogin}>
              <Text style={styles.modalButtonText}>Se connecter</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowAuthModal(false)}
            >
              <Text style={styles.modalCancelButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
  
}  




const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#e0f7fa', // Couleur pastel rafraîchissante.
  },
  header: {
    width: '100%',
    height: 400,
    backgroundColor: '#00796b', // Vert sophistiqué et vibrant.
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 70,
    borderBottomRightRadius: 70,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  image: {
    width: '85%',
    height: '85%',
    borderRadius: 40,
    borderWidth: 6,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  details: {
    padding: 40,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 70,
    borderTopRightRadius: 70,
    marginTop: -60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  name: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#004d40',
    textAlign: 'center',
    marginBottom: 30,
    letterSpacing: 1,
  },
  price: {
    fontSize: 30,
    fontWeight: '700',
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.8,
  },
  status: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 32,
  },
  available: {
    color: '#388e3c',
  },
  unavailable: {
    color: '#d32f2f',
  },
  rentalContainer: {
    marginTop: 40,
    padding: 35,
    borderRadius: 35,
    backgroundColor: '#f4f9f9',
    borderColor: '#cfd8dc',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 6,
  },
  datePickerContainer: {
    marginBottom: 28,
    flexDirection: 'column',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 22,
    fontWeight: '500',
    color: '#546e7a',
    marginBottom: 14,
    letterSpacing: 0.5,
  },
  dateText: {
    fontSize: 22,
    color: '#00796b',
    fontWeight: '600',
    marginBottom: 20,
  },
  driverContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  locationInputContainer: {
    marginBottom: 30,
  },
  input: {
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#b0bec5',
    backgroundColor: '#ffffff',
    fontSize: 20,
    color: '#37474f',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  button: {
    backgroundColor: '#00796b',
    paddingVertical: 22,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 35,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  buttonText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.9,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    padding: 40,
    backgroundColor: '#ffffff',
    borderRadius: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 12,
  },
  modalTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00796b',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 0.9,
  },
  modalText: {
    fontSize: 22,
    color: '#546e7a',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 32,
  },
  modalButton: {
    backgroundColor: '#00796b',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  modalButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.7,
  },
  modalCancelButton: {
    backgroundColor: '#d32f2f',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  modalCancelButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.7,
  },
  info: {
    fontSize: 22,
    color: '#546e7a',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 30,
  },
});
