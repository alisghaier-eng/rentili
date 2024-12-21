import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  Button,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AccountScreen() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // États pour les champs modifiables
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');

  const [isUpdating, setIsUpdating] = useState(false);
  const [editingField, setEditingField] = useState(null); // Champ en édition

  // Récupération des détails utilisateur
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          setLoading(false);
          Alert.alert('Erreur', 'Vous devez être connecté pour voir ces informations.');
          return;
        }

        const response = await axios.get('http://192.168.9.57:6000/user', {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUser(response.data);
        setEmail(response.data.email);
        setPhoneNumber(response.data.phoneNumber);
        setBirthDate(response.data.birthDate);
        setGender(response.data.gender);
      } catch (err) {
        console.error('Erreur lors de la récupération des données utilisateur:', err);
        Alert.alert('Erreur', 'Impossible de récupérer les données utilisateur.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, []);

  // Mettre à jour les informations
  const updateUserDetails = async () => {
    if (isUpdating) return;
    setIsUpdating(true);

    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.put(
        'http://192.168.9.57:5000/user',
        {role,firstname,lastname,
          email,
          phoneNumber,
          birthDate,
          gender,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert('Succès', 'Informations mises à jour avec succès.');
      setUser(response.data);
      setEditingField(null); // Désactiver le mode édition
    } catch (err) {
      console.error('Erreur lors de la mise à jour des informations:', err);
      Alert.alert('Erreur', 'Impossible de mettre à jour les informations.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Construction de l'URL de l'image (inchangé)
  const imageUrl = user?.profileImage?.startsWith('http')
    ? user.profileImage
    : `http://192.168.9.57:5000${user?.profileImage || ''}`;

  if (loading) {
    return <ActivityIndicator size="large" color="#4a148c" style={styles.loader} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        {user?.profileImage ? (
          <Image source={{ uri: imageUrl }} style={styles.profileImage} />
        ) : (
          <Ionicons name="person-circle" size={100} color="#4a148c" />
        )}
        <Text style={styles.name}>
          {user?.role || 'role non disponible'} 
        </Text>
      </View>

      {/* Formulaire des informations */}
      <View style={styles.infoSection}>
        <Text style={styles.title}>Informations personnelles</Text>

        {/* Email */}
        <View style={styles.infoItem}>
          <Ionicons name="mail" size={22} color="#4a148c" />
          {editingField === 'email' ? (
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
            />
          ) : (
            <Text style={styles.infoText}>Email : {user?.email || 'Non renseigné'}</Text>
          )}
          <TouchableOpacity onPress={() => setEditingField('email')}>
            <Ionicons name="pencil" size={20} color="#4a148c" />
          </TouchableOpacity>
        </View>

        {/* Téléphone */}
        <View style={styles.infoItem}>
          <Ionicons name="call" size={22} color="#4a148c" />
          {editingField === 'phoneNumber' ? (
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
          ) : (
            <Text style={styles.infoText}>Téléphone : {user?.phoneNumber || 'Non renseigné'}</Text>
          )}
          <TouchableOpacity onPress={() => setEditingField('phoneNumber')}>
            <Ionicons name="pencil" size={20} color="#4a148c" />
          </TouchableOpacity>
        </View>

        {/* Date de naissance */}
        <View style={styles.infoItem}>
          <Ionicons name="calendar" size={22} color="#4a148c" />
          {editingField === 'birthDate' ? (
            <TextInput
              style={styles.input}
              value={birthDate}
              onChangeText={setBirthDate}
            />
          ) : (
            <Text style={styles.infoText}>Date de naissance : {user?.birthDate || 'Non renseignée'}</Text>
          )}
          <TouchableOpacity onPress={() => setEditingField('birthDate')}>
            <Ionicons name="pencil" size={20} color="#4a148c" />
          </TouchableOpacity>
        </View>

        {/* Genre */}
        <View style={styles.infoItem}>
          <Ionicons name="person" size={22} color="#4a148c" />
          {editingField === 'gender' ? (
            <TextInput
              style={styles.input}
              value={gender}
              onChangeText={setGender}
            />
          ) : (
            <Text style={styles.infoText}>Genre : {user?.gender || 'Non renseigné'}</Text>
          )}
          <TouchableOpacity onPress={() => setEditingField('gender')}>
            <Ionicons name="pencil" size={20} color="#4a148c" />
          </TouchableOpacity>
        </View>

        {/* Bouton Enregistrer */}
        {editingField && (
          <Button title="Enregistrer" onPress={updateUserDetails} disabled={isUpdating} />
        )}
      </View>
    </ScrollView>
  );
}



const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#f7f8fc', // Arrière-plan clair avec un ton moderne
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  profileImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: 15,
    borderWidth: 4,
    borderColor: '#9c27b0', // Violet moderne
    backgroundColor: '#f2f2f2',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6a1b9a',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: 0.8,
  },
  role: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7b1fa2',
    textAlign: 'center',
    marginTop: 8,
  },
  infoSection: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4a148c',
    marginBottom: 20,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
    borderBottomWidth: 2,
    borderBottomColor: '#e1bee7',
    paddingBottom: 5,
  },
  inputItem: {
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    backgroundColor: '#f7f7f7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    fontSize: 17,
    padding: 12,
    color: '#333',
    borderRadius: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 5,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoIcon: {
    backgroundColor: '#e1bee7',
    padding: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  infoText: {
    fontSize: 17,
    color: '#555',
    fontWeight: '500',
    flex: 1,
  },
  buttonContainer: {
    marginTop: 20,
    backgroundColor: '#7b1fa2',
    borderRadius: 10,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 12,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f2f2f7',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
