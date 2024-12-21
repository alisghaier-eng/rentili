import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Historic({ navigation }) {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRentals = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          Alert.alert('Erreur', 'Vous devez être connecté pour voir votre historique.');
          navigation.navigate('LoginScreen');
          return;
        }

        const response = await axios.get(`http://192.168.9.57:6000/rentals/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setRentals(response.data.rentals);
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'historique:', error);
        Alert.alert('Erreur', 'Impossible de charger l\'historique des locations.');
      } finally {
        setLoading(false);
      }
    };

    fetchRentals();
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement de l'historique...</Text>
      </View>
    );
  }

  if (!rentals.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Vous n'avez pas encore loué de voitures.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {rentals.map((rental) => (
        <View key={rental._id} style={styles.rentalCard}>
          <Image
            source={{ uri: rental.car.image }}
            style={styles.carImage}
          />
          <View style={styles.detailsContainer}>
            <Text style={styles.carModel}>{rental.car.model}</Text>
            <Text style={styles.agencyName}>
              Agence: {rental.car.agency?.agencyName || 'Nom indisponible'}
            </Text>
            <Text style={styles.dates}>
              Du {new Date(rental.startDate).toLocaleDateString()} au {new Date(rental.endDate).toLocaleDateString()}
            </Text>
            <Text style={styles.totalCost}>Coût total: {rental.totalPrice} €</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
    container: {
      padding: 20,
      backgroundColor: '#f4f8fb', // Couleur de fond douce et accueillante
    },
    rentalCard: {
      backgroundColor: '#ffffff',
      borderRadius: 15,
      elevation: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      marginBottom: 20,
      overflow: 'hidden',
      flexDirection: 'row',
      borderWidth: 2, // Bordure plus marquée pour les cartes
      borderColor: '#2a9d8f', // Couleur accentuée pour les cadres de voitures
    },
    carImage: {
      width: 130,
      height: 130,
      borderTopLeftRadius: 15,
      borderBottomLeftRadius: 15,
      resizeMode: 'cover', // Ajuste l'image sans distorsion
      borderRightWidth: 1,
      borderRightColor: '#e0e0e0',
    },
    detailsContainer: {
      flex: 1,
      padding: 15,
      justifyContent: 'space-between',
    },
    carModel: {
      fontSize: 20,
      fontWeight: '700',
      color: '#264653', // Couleur sombre pour le texte principal
      marginBottom: 8,
    },
    agencyName: {
      fontSize: 14,
      fontWeight: '500',
      color: '#6d6875', // Couleur secondaire douce
      marginBottom: 8,
    },
    dates: {
      fontSize: 14,
      color: '#6d6875',
      marginBottom: 8,
    },
    totalCost: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#e76f51', // Couleur chaude pour le prix total
      marginTop: 10,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f4f8fb',
    },
    loadingText: {
      fontSize: 16,
      color: '#555',
      fontWeight: '600',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f4f8fb',
    },
    emptyText: {
      fontSize: 18,
      color: '#999',
      fontStyle: 'italic',
      textAlign: 'center',
      paddingHorizontal: 20,
    },
  });
  