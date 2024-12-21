import React from 'react';
import { View, Text, TouchableOpacity, ImageBackground, StyleSheet } from 'react-native';

const WelcomePage = ({ navigation }) => {
  return (
    <ImageBackground
      //source={require('../phto/th')} // Use your car background image
      style={styles.background}
    >
      <View style={styles.overlay}>
        <Text style={styles.title}>Your Ultimate Car Rental Experience</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('HomepageClient')}
        >
          <Text style={styles.buttonText}>Let's get started</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    color: 'white',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#ff6347',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default WelcomePage;
