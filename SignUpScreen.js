import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { TextInput, Button, RadioButton } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import axios from 'axios';
import { Linking } from 'react-native';
import DateTimePickerModal from "react-native-modal-datetime-picker";
export default function SignUpScreen({ navigation }) {
  const [userType, setUserType] = useState('client');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [image, setImage] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);  // Initialise avec un tableau vide

  // Champs pour le client
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [address, setAddress] = useState('');
  const [driverLicenseImage, setDriverLicenseImage] = useState(null);
  const [firstname, setfirstname] = useState('');

  const [lastname, setlastname] = useState('');


  // Champs pour l'agence
  const [agencyId, setAgencyId] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [location, setLocation] = useState(null);
  const [mapImage, setMapImage] = useState(null);

  const openMap = (latitude, longitude) => {
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    Linking.openURL(url).catch(err => {
      console.error("Erreur lors de l'ouverture de la carte :", err);
      Alert.alert('Erreur', 'Impossible d\'ouvrir la carte.');
    });
  }
  const handleImagePick = async (setImage) => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        alert("Permission d'accès à la galerie est nécessaire !");
        return;
      }
  
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });
  
      if (!result.canceled && result.assets?.length > 0) {
        const selectedImageUri = result.assets[0].uri;
        setImage(selectedImageUri); // Assurez-vous d'utiliser setImage pour mettre à jour l'état
      }
    } catch (error) {
      console.error("Erreur lors de la sélection de l'image :", error);
      alert("Une erreur est survenue lors de la sélection de l'image.");
    }
  };
  
  
  
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const handleConfirm = (date) => {
    setBirthDate(date.toISOString().split('T')[0]); // Formatte la date
    setDatePickerVisibility(false);
  };
  const handleLocationFetch = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission refusée", "L'accès à la localisation est nécessaire.");
        return;
      }

      const userLocation = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = userLocation.coords;
      setLocation({ latitude, longitude });

      // Générer une URL de carte statique
      const mapUrl = `https://static-maps.yandex.ru/1.x/?ll=${longitude},${latitude}&size=600,300&z=15&l=map&pt=${longitude},${latitude},pm2rdm`;
      setMapImage(mapUrl);
    } catch (error) {
      console.error("Erreur lors de la récupération de la localisation :", error);
      Alert.alert("Erreur", "Impossible d'obtenir votre localisation.");
    }
  };

  const handleSignUp = async () => {
    if (!email.trim() || !password || !confirmPassword || !phoneNumber.trim()) {
      Alert.alert("Erreur", "Tous les champs obligatoires doivent être remplis.");
      return;
    }
  
    if (password !== confirmPassword) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas.");
      return;
    }
  
    if (userType === 'client' && (!birthDate || !gender || !address || !profileImage)) {
      Alert.alert("Erreur", "Tous les champs du client doivent être remplis.");
      return;
    }
  
    const user = {
      role: userType,
      email,
      password,
      phoneNumber,
      ...(userType === 'client' && { birthDate, gender, address, profileImage ,firstname,lastname}),
      ...(userType === 'agence' && { agencyId, agencyName, latitude: location.latitude, longitude: location.longitude }),
    };
  
    try {
    
      
  
      const formData = new FormData();
      formData.append("firstname", firstname);
      formData.append("lastname", lastname);

      formData.append("email", email);
      formData.append("password", password);
      formData.append("phoneNumber", phoneNumber);
      formData.append("role", userType);
      formData.append("birthDate", birthDate);
      formData.append("gender", gender);
      formData.append("address", address);
      formData.append("profileImage", {
        uri: profileImage,
        name: "profile_image.jpg",
        type: "image/jpeg",
      });
  
      const response = await axios.post(
        "http://192.168.217.57:6000/signUp", // Assurez-vous que l'URL est correcte
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
  
      Alert.alert("Succès", "Inscription réussie ! Vous pouvez maintenant vous connecter.");
      navigation.navigate('Login');
    } catch (error) {
      console.error("Erreur lors de l'inscription :", error.response?.data || error.message);
      Alert.alert("Erreur", "Problème lors de l'inscription.");
    }
  };
  
  

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Créez votre compte</Text>
      <Text style={styles.subtitle}>Rejoignez-nous pour louer une voiture facilement</Text>

      {/* Sélection du type d'utilisateur */}
      <Text style={styles.label}>Vous êtes :</Text>
      <RadioButton.Group onValueChange={setUserType} value={userType}>
        <View style={styles.radioButtonContainer}>
          <RadioButton value="client" />
          <Text style={styles.radioLabel}>Client</Text>
        </View>
        <View style={styles.radioButtonContainer}>
          <RadioButton value="agence" />
          <Text style={styles.radioLabel}>Agence</Text>
        </View>
      </RadioButton.Group>

      {/* Formulaire commun */}
      <TextInput label="FirstName" value={firstname} onChangeText={setfirstname} style={styles.input} mode="outlined" autoCapitalize="none"  />
      <TextInput label="LastName" value={lastname} onChangeText={setlastname} style={styles.input} mode="outlined" autoCapitalize="none"  />
      <TextInput label="Email" value={email} onChangeText={setEmail} style={styles.input} mode="outlined" autoCapitalize="none" keyboardType="email-address" />
      <TextInput label="Mot de passe" value={password} onChangeText={setPassword} style={styles.input} mode="outlined" secureTextEntry />
      <TextInput label="Confirmer le mot de passe" value={confirmPassword} onChangeText={setConfirmPassword} style={styles.input} mode="outlined" secureTextEntry />
      <TextInput label="Numéro de téléphone" value={phoneNumber} onChangeText={setPhoneNumber} style={styles.input} mode="outlined" keyboardType="phone-pad" />

      {/* Champs spécifiques */}
      {userType === 'client' && (
        <>
   <Button mode="outlined" onPress={() => setDatePickerVisibility(true)}>Sélectionner la date</Button>
<DateTimePickerModal
  isVisible={isDatePickerVisible}
  mode="date"
  onConfirm={handleConfirm}
  onCancel={() => setDatePickerVisibility(false)}
/>
<TextInput
  label="Date de naissance"
  value={birthDate}
  editable={false} // Ne pas éditer directement
  style={styles.input}
/>

          <TextInput label="Adresse" value={address} onChangeText={setAddress} style={styles.input} mode="outlined" />
          <Text style={styles.label}>Genre :</Text>
  
  <RadioButton.Group onValueChange={setGender} value={gender}>
  <View style={styles.radioButtonContainer}>
    <RadioButton value="Homme" />
    <Text>Homme</Text>
  </View>
  <View style={styles.radioButtonContainer}>
    <RadioButton value="Femme" />
    <Text>Femme</Text>
  </View>
</RadioButton.Group>

<Button 
  mode="outlined" 
  onPress={() => handleImagePick(setProfileImage)} 
  style={styles.imagePickerButton}
>
  {profileImage ? "Modifier la photo" : "Ajouter une photo"}
</Button>
{profileImage && <Text style={styles.imageSelected}>Photo sélectionnée</Text>}




        </>
      )}

      {userType === 'agence' && (
        <>
          <TextInput label="Identifiant Agence" value={agencyId} onChangeText={setAgencyId} style={styles.input} mode="outlined" />
          <TextInput label="Nom Agence" value={agencyName} onChangeText={setAgencyName} style={styles.input} mode="outlined" />
          <Button mode="contained" onPress={handleLocationFetch}>Préciser ma localisation</Button>
          {location && <Text>Localisation : {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}</Text>}
          {mapImage && (
            <TouchableOpacity onPress={() => openMap(location.latitude, location.longitude)}>
              <Image source={{ uri: mapImage }} style={styles.mapImage} />
            </TouchableOpacity>
          )}
        </>
      )}

      <Button mode="contained" onPress={handleSignUp} style={styles.button}>S'inscrire</Button>
      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.link}>
        <Text style={styles.linkText}>Déjà un compte ? Connectez-vous</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#e8eaf6',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
    color: '#4a148c',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
    color: '#555',
  },
  input: {
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  button: {
    marginTop: 20,
    borderRadius: 12,
    backgroundColor: '#6200ea',
  },
  link: {
    marginTop: 15,
    alignItems: 'center',
  },
  linkText: {
    color: '#4a148c',
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
    color: '#4a148c',
    fontWeight: 'bold',
  },
  radioButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  radioLabel: {
    fontSize: 16,
    color: '#555',
  },
  imagePickerButton: {
    marginBottom: 10,
  },
  imageSelected: {
    fontSize: 14,
    color: '#4a148c',
    marginTop: 5,
  },
  locationButton: {
    marginBottom: 10,
  },
  coordinates: {
    fontSize: 14,
    color: '#555',
    marginTop: 5,
  },
  mapImage: {
    width: '100%',
    height: 200,
    marginTop: 10,
    borderRadius: 12,
  },
});
