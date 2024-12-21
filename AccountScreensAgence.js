import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Button,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as Location from 'expo-location'; // Importation de expo-location
import MapView, { Marker } from 'react-native-maps'; // Importation de MapView et Marker
import { Linking } from 'react-native'; // Importation de Linking

export default function AccountScreensAgence({ route, navigation }) {
  const [agency, setAgency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationPermission, setLocationPermission] = useState(false);
  const [isMapInteractive, setIsMapInteractive] = useState(false); // Contrôler si la carte est interactive
  const [isOverlayVisible, setIsOverlayVisible] = useState(true); // Contrôler si la couche est visible

  const { agencyId } = route.params; // Récupération de l'ID de l'agence

  // Récupération des détails de l'agence
  useEffect(() => {
    const fetchAgencyDetails = async () => {
      try {
        const response = await axios.get(`http://192.168.9.57:6000/agencies/${agencyId}`);
        setAgency(response.data.agency); // Mise à jour avec la propriété agency du JSON
      } catch (err) {
        console.error('Erreur lors de la récupération des données de l\'agence:', err);
        Alert.alert('Erreur', 'Impossible de récupérer les informations de l\'agence.');
      } finally {
        setLoading(false);
      }
    };

    fetchAgencyDetails();
    getLocationPermission(); // Demander l'autorisation pour accéder à la localisation
  }, [agencyId]);

  // Demander l'autorisation d'accéder à la localisation de l'utilisateur
  const getLocationPermission = async () => {
    const { status } = await Location.requestPermissionsAsync();
    setLocationPermission(status === 'granted');
  };

  // Fonction pour ouvrir Google Maps et démarrer un itinéraire
  const openInGoogleMaps = () => {
    if (agency?.latitude && agency?.longitude) {
      // Utilisation de "https://www.google.com/maps" pour afficher la localisation et démarrer l'itinéraire
      const url = `https://www.google.com/maps?q=${agency.latitude},${agency.longitude}`;
      Linking.openURL(url).catch(() => {
        Alert.alert('Erreur', 'Impossible d\'ouvrir Google Maps.');
      });
    } else {
      Alert.alert('Erreur', 'Coordonnées de l\'agence manquantes.');
    }
  };

  // Fonction pour appeler l'agence
  const makePhoneCall = (phoneNumber) => {
    Linking.openURL(`tel:${phoneNumber}`).catch((err) => Alert.alert('Erreur', 'Impossible de passer l\'appel.'));
  };

  // Fonction pour envoyer un email
  const sendEmail = (email) => {
    Linking.openURL(`mailto:${email}`).catch((err) => Alert.alert('Erreur', 'Impossible d\'ouvrir l\'email.'));
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#4a148c" style={styles.loader} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* En-tête avec l'icône d'établissement au-dessus du nom */}
      <View style={styles.header}>
        <Ionicons name="business" size={100} color="#fff" />
        <Text style={styles.name}>{agency?.agencyName || 'Nom de l\'agence non disponible'}</Text>
      </View>

      {/* Informations de l'agence */}
      <View style={styles.infoSection}>
        <Text style={styles.title}>Informations de l'agence</Text>
        <InfoItem icon="business" label="Nom" value={agency?.agencyName} />
        
        {/* Téléphone cliquable pour démarrer un appel */}
        <TouchableOpacity onPress={() => makePhoneCall(agency?.phoneNumber)}>
          <InfoItem icon="call" label="Téléphone" value={agency?.phoneNumber} />
        </TouchableOpacity>

        {/* Email cliquable pour envoyer un email */}
        <TouchableOpacity onPress={() => sendEmail(agency?.email)}>
          <InfoItem icon="mail" label="Email" value={agency?.email} />
        </TouchableOpacity>
      </View>

      {/* Affichage de la carte avec l'agence */}
      <View style={styles.mapContainer}>
        {agency?.latitude && agency?.longitude ? (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: agency.latitude,
              longitude: agency.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            scrollEnabled={isMapInteractive} // Désactiver le défilement par défaut
            zoomEnabled={isMapInteractive} // Désactiver le zoom par défaut
            pitchEnabled={isMapInteractive} // Désactiver le pitch par défaut
            rotateEnabled={isMapInteractive} // Désactiver la rotation par défaut
          >
            <Marker
              coordinate={{
                latitude: agency.latitude,
                longitude: agency.longitude,
              }}
              title={agency.agencyName}
              description="Localisation de l'agence"
              onCalloutPress={openInGoogleMaps} // Ouvre Google Maps lors du clic sur le marqueur
            />
          </MapView>
        ) : (
          <Text>Aucune localisation disponible pour cette agence.</Text>
        )}

        {/* Superposition transparente sur la carte */}
        {isOverlayVisible && (
          <View style={styles.overlay}>
            <Button
              title="Voir la carte"
              onPress={() => {
                setIsMapInteractive(true); // Permet de rendre la carte interactive
                setIsOverlayVisible(false); // Cacher la superposition après avoir cliqué sur le bouton
              }}
              color="#FF7F50" // Couleur du bouton en orangé
              style={styles.viewButton}
            />
          </View>
        )}
      </View>

      {/* Boutons pour naviguer */}
      <View style={styles.buttonContainer}>
        <Button
          title="Liste de voitures de l'agence"
          onPress={() => navigation.navigate('Listevoitureagence', { agencyId })}
          color="#4a148c"
        />
      </View>
    </ScrollView>
  );
}

// Composant réutilisable pour les informations
function InfoItem({ icon, label, value }) {
  return (
    <View style={styles.infoItem}>
      <Ionicons name={icon} size={22} color="#4a148c" />
      <Text style={styles.infoText}>
        {label} : {value || 'Non renseigné'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f7f7f7',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#4a148c',
    paddingVertical: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: 10,
  },
  infoSection: {
    marginTop: 20,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 12,
    color: '#4a148c',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#444',
    lineHeight: 24,
  },
  mapContainer: {
    marginVertical: 25,
    height: 300, // Taille de la carte
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
    backgroundColor: '#ffffff', // Fond blanc autour de la carte
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 69, 0, 0.6)', // Couleur de la couche transparente (ici orange)
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    borderRadius: 12,
  },
  buttonContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  viewButton: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#FF7F50', // Couleur orangé pour le bouton
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
