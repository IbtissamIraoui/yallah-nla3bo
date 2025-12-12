import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,Image, } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../api/client';

export default function LoginScreen({ setIsLoggedIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullname, setFullname] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleAuth = async () => {
    const endpoint = isRegistering ? '/api/register' : '/api/login';
    const payload = isRegistering 
      ? { fullname, email, password }
      : { email, password };

    try {
      const res = await client.post(endpoint, payload);
      if (res.data.success) {
        if (isRegistering) {
          Alert.alert("Succès", "Compte créé ! Connecte-toi maintenant.");
          setIsRegistering(false);
        } else {
          await AsyncStorage.setItem('token', res.data.token);
          setIsLoggedIn(true);
        }
      }
    } catch (err) {
      Alert.alert("Erreur", err.response?.data?.msg || "Problème de connexion");
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/image.jpeg")}
        style={styles.logo}
        resizeMode="contain"
      />
      
      <Text style={styles.subtitle}>{isRegistering ? "Créer un compte" : "Connexion"}</Text>

      {isRegistering && (
        <TextInput placeholder="Nom complet" style={styles.input} value={fullname} onChangeText={setFullname} />
      )}
      <TextInput placeholder="Email" style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" />
      <TextInput placeholder="Mot de passe" style={styles.input} secureTextEntry value={password} onChangeText={setPassword} />

      <TouchableOpacity style={styles.btn} onPress={handleAuth}>
        <Text style={styles.btnText}>{isRegistering ? "S'INSCRIRE" : "SE CONNECTER"}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)}>
        <Text style={styles.link}>
          {isRegistering ? "J'ai déjà un compte" : "Pas de compte ? Créer un compte"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 25,
    backgroundColor: '#e6f4ea', // Fond doux vert clair
  },
  logo: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: 20,
    borderRadius: 60, // Rond
    borderWidth: 2,
    borderColor: '#16a34a',
  },
  subtitle: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 25,
    color: '#16a34a',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  btn: {
    backgroundColor: '#16a34a',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
  link: {
    color: '#2563eb',
    textAlign: 'center',
    marginTop: 20,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
