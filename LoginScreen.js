import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, BackHandler } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleLogin = async () => {
    setEmailError(false);
    setPasswordError(false);

    if (!email || !validateEmail(email)) {
      setEmailError(true);
      Alert.alert('Erreur', "L'adresse email est invalide.");
      return;
    }

    if (!password) {
      setPasswordError(true);
      Alert.alert('Erreur', 'Le mot de passe est requis.');
      return;
    }

    try {
      setLoading(true);

      // Supprimer les anciennes données utilisateur
      await AsyncStorage.clear();

      const response = await axios.post('http://192.168.9.57:6000/login', {
        email: email.trim(),
        password: password.trim(),
      });

      const { token, role, agencyId } = response.data;

      if (!role) {
        throw new Error('Rôle utilisateur non fourni.');
      }

      if (role === 'agence' && !agencyId) {
        throw new Error('agencyId manquant pour le rôle agence.');
      }

      // Stocker les informations dans AsyncStorage
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('userRole', role);

      if (role === 'agence') {
        await AsyncStorage.setItem('agencyId', agencyId);
      }

      // Navigation basée sur le rôle
      if (role === 'client') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home', params: { screen: 'HomepageClient' } }],
        });
      } else if (role === 'agence') {
        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'Home',
              params: { screen: 'HomepageAgence', params: { agencyId } },
            },
          ],
        });
      } else {
        throw new Error('Rôle utilisateur non reconnu.');
      }
    } catch (err) {
      console.error("Erreur lors de la connexion :", err);
      const errorMessage =
        err.response?.data?.message || err.message || 'Une erreur est survenue.';
      Alert.alert('Erreur', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => true; // Bloquer le retour
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [])
  );
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Connectez-vous</Text>
      <Text style={styles.subtitle}>Accédez à votre compte pour louer une voiture</Text>

      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        style={[styles.input, emailError && styles.errorInput]}
        mode="outlined"
        autoCapitalize="none"
        keyboardType="email-address"
        left={<TextInput.Icon name="email" />}
        theme={{ colors: { primary: '#6200ea' } }}
        error={emailError}
      />

      <TextInput
        label="Mot de passe"
        value={password}
        onChangeText={setPassword}
        style={[styles.input, passwordError && styles.errorInput]}
        mode="outlined"
        secureTextEntry
        left={<TextInput.Icon name="lock" />}
        theme={{ colors: { primary: '#6200ea' } }}
        error={passwordError}
      />

      <Button
        mode="contained"
        onPress={handleLogin}
        loading={loading}
        disabled={loading}
        style={styles.button}
      >
        {loading ? 'Connexion en cours...' : 'Se connecter'}
      </Button>

      <TouchableOpacity onPress={() => navigation.navigate('SignUp')} style={styles.link}>
        <Text style={styles.linkText}>Pas de compte ? Inscrivez-vous</Text>
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
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  button: {
    marginTop: 20,
    borderRadius: 12,
    paddingVertical: 12,
    backgroundColor: '#6200ea',
    elevation: 5,
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
});