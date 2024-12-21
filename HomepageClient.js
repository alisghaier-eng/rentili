import React, { useState, useEffect } from 'react';
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
} from 'react-native';
import { Text as PaperText, Card, Button, Menu, Appbar, IconButton } from 'react-native-paper';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FilterBar from '../components/FilterBar';
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function HomepageClient({ navigation }) {
  const [cars, setCars] = useState([]); 
  const [minBudget, setMinBudget] = useState('');
const [maxBudget, setMaxBudget] = useState('');
const [transmission, setTransmission] = useState('manuel');
const [availability, setAvailability] = useState('disponible');

  const [filteredCars, setFilteredCars] = useState([]); 
  const [selectedCategory, setSelectedCategory] = useState('Tous'); 
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null); 
  const [refreshing, setRefreshing] = useState(false); 
  const [isAuthenticated, setIsAuthenticated] = useState(false); 
  const [menuVisible, setMenuVisible] = useState(false); 
  const [agencies, setAgencies] = useState([]); 
  const [filteredAgencies, setFilteredAgencies] = useState([]); 
  const [isAgencyListVisible, setIsAgencyListVisible] = useState(false); 
  const applyFilters = (cars) => {
    return cars.filter(car => {
      const minBudgetCondition = minBudget ? car.priceperday >= parseInt(minBudget) : true;
      const maxBudgetCondition = maxBudget ? car.priceperday <= parseInt(maxBudget) : true;
      const transmissionCondition = car.transmission === transmission || transmission === 'all';
      const availabilityCondition = car.availability === availability || availability === 'all';
  
      return minBudgetCondition && maxBudgetCondition && transmissionCondition && availabilityCondition;
    });
  };
  const fetchfiltredCars = async () => {
    setRefreshing(true);
    try {
      const response = await axios.get('http://192.168.9.57:6000/cars');
      const filtered = applyFilters(response.data);
      setCars(response.data);
      setFilteredCars(filtered);
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors de la récupération des voitures :', err);
      setError('Impossible de charger les voitures. Réessayez plus tard.');
      setLoading(false);
    } finally {
      setRefreshing(false);
    }
  };
  const handleFilterChange = ({ minBudget, maxBudget, transmission, availability }) => {
    setMinBudget(minBudget);
    setMaxBudget(maxBudget);
    setTransmission(transmission);
    setAvailability(availability);
  
    // Appliquez les filtres après le changement
    setFilteredCars(applyFilters(cars));
  };
  
  const fetchAgencies = async () => {
    try {
      const response = await axios.get('http://192.168.9.57:6000/agencies');
      setAgencies(response.data.agencies);
      setFilteredAgencies(response.data.agencies);
    } catch (err) {
      console.error('Erreur lors de la récupération des agences :', err);
    }
  };

  useEffect(() => {
    fetchAgencies();
  }, []);

  const toggleAgencyList = () => {
    setIsAgencyListVisible(!isAgencyListVisible);
  };

  const handleSearchToggle = (text) => {
    const filtered = agencies.filter((agency) =>
      agency.agencyName.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredAgencies(filtered);
  };

  const renderAgencyItem = ({ item }) => (
    <TouchableOpacity
      style={styles.agencyItem}
      onPress={() => navigation.navigate('AccountScreensAgence', { agencyId: item._id })}
    >
      <Text style={styles.agencyName}>{item.agencyName}</Text>
    </TouchableOpacity>
  );

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      setIsAuthenticated(!!token);
    } catch (error) {
      console.error("Erreur lors de la vérification de l'authentification :", error);
    }
  };

  const fetchCars = async () => {
    setRefreshing(true);
    try {
      const response = await axios.get('http://192.168.9.57:6000/cars');
      const filtered = applyFilters(response.data);
      setCars(response.data);
      setFilteredCars(filtered);
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors de la récupération des voitures :', err);
      setError('Impossible de charger les voitures. Réessayez plus tard.');
      setLoading(false);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCars();
    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (selectedCategory === 'Tous') {
      setFilteredCars(cars);
    } else {
      setFilteredCars(cars.filter((car) => car.category === selectedCategory));
    }
  }, [selectedCategory, cars]);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      setIsAuthenticated(false);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (error) {
      console.error('Erreur lors de la déconnexion :', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la déconnexion.');
    }
  };

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const renderCarItem = ({ item }) => {
    const imageUrl = item.image.startsWith('http')
      ? item.image
      : `http://192.168.9.57:6000${item.image}`;

    return (
      <Animatable.View
        animation="fadeInUp"
        duration={800}
        delay={200}
        style={styles.cardContainer}
      >
        <TouchableOpacity
          style={styles.cardContainer}
          onPress={() => navigation.navigate('DetailsVoiture', { carId: item._id })}
        >
          <Card style={styles.card}>
            <Image source={{ uri: imageUrl }} style={styles.image} />
            <Card.Content style={styles.cardContent}>
              <PaperText style={styles.name}>{item.model}</PaperText>
              <PaperText style={styles.price}>dt{item.priceperday}/jour</PaperText>
              <PaperText style={styles.agency}>
                Agency: {item.agency?.email || 'Non spécifié'}
              </PaperText>
            </Card.Content>
            <Card.Actions style={styles.cardActions}>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('DetailsVoiture', { carId: item._id })}
                labelStyle={styles.buttonText}
                style={styles.button}
              >
                Détails
              </Button>
            </Card.Actions>
          </Card>
        </TouchableOpacity>
      </Animatable.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ea" />
        <PaperText style={styles.loadingText}>Chargement des voitures...</PaperText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <PaperText style={styles.errorText}>{error}</PaperText>
        <Button mode="contained" onPress={fetchCars} style={styles.retryButton}>
          Réessayer
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header style={{ backgroundColor: '#007aff' }}>
        <Appbar.Content title="Accueil" titleStyle={{ color: '#ffffff' }} />

        {/* Menu pour les utilisateurs authentifiés */}
        {isAuthenticated && (
          <Menu
            visible={menuVisible}
            onDismiss={closeMenu}
            anchor={<Appbar.Action icon="menu" color="#ffffff" onPress={openMenu} />}
          >
            <Menu.Item
              onPress={() => {
                closeMenu();
                navigation.navigate('Historic');
              }}
              title="Historique"
            />
            <Menu.Item onPress={handleLogout} title="Se déconnecter" />
          </Menu>
        )}

        {/* Bouton Liste des agences */}
        <Button
          mode="contained"
          onPress={toggleAgencyList}
          style={{ marginRight: 10, backgroundColor: '#ffffff' }}
          labelStyle={{ color: '#007aff' }}
        >
          Liste des agences
        </Button>
      </Appbar.Header>

      {/* Liste des agences */}
      {isAgencyListVisible && (
        <View>
          <FlatList
            data={filteredAgencies}
            keyExtractor={(item) => item._id}
            renderItem={renderAgencyItem}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={<Text style={styles.emptyText}>Aucune agence trouvée.</Text>}
          />
        </View>
      )}

      {/* Section des voitures */}
      <FilterBar
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      <FlatList
        data={filteredCars}
        keyExtractor={(item) => item._id}
        renderItem={renderCarItem}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={fetchCars}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f9ff', // Arrière-plan légèrement plus moderne.
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cardContainer: {
    flex: 1,
    marginVertical: 14,
    marginHorizontal: 10,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8, // Ombre subtile pour Android.
    borderWidth: 1,
    borderColor: '#dce3eb',
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: '#e0e0e0',
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textShadowColor: '#000000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cardContent: {
    padding: 16,
    backgroundColor: '#f7faff',
  },
  price: {
    fontSize: 16,
    color: '#28a745',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  agency: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
  cardActions: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#007aff',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#007aff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f9ff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#007aff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff5f5',
    padding: 16,
    borderRadius: 10,
    margin: 16,
    borderWidth: 1,
    borderColor: '#f1c5c5',
  },
  errorText: {
    fontSize: 17,
    color: '#e74c3c',
    fontWeight: '600',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 18,
    backgroundColor: '#007aff',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
