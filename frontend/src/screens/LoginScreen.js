import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, Image, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import client from '../api/client';

export default function LoginScreen({ setIsLoggedIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [currentMode, setCurrentMode] = useState('player');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (loading) return;
    setLoading(true);

    try {
      if (isRegistering) {
        // ─── Inscription ───
        const res = await client.post('/api/auth/register', {
          name, email, password, currentMode
        });
        if (res.data.success) {
          Alert.alert('✅ Succès', 'Compte créé ! Connecte-toi maintenant.');
          setIsRegistering(false);
          setName('');
        }
      } else {
        // ─── Connexion ───
        const res = await client.post('/api/auth/login', { email, password });
        if (res.data.success) {
          await AsyncStorage.setItem('token', res.data.token);
          await AsyncStorage.setItem('userMode', res.data.user.currentMode);
          await AsyncStorage.setItem('userName', res.data.user.name);
          setIsLoggedIn(true);
        }
      }
    } catch (err) {
      Alert.alert('Erreur', err.response?.data?.msg || 'Problème de connexion au serveur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Image
          source={require('../../assets/image.jpeg')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>KoraTime</Text>
        <Text style={styles.subtitle}>
          {isRegistering ? 'Créer un compte' : 'Connexion'}
        </Text>

        {/* ─── Choix du mode à l'inscription ─── */}
        {isRegistering && (
          <View style={styles.modeContainer}>
            <Text style={styles.modeLabel}>Je suis :</Text>
            <View style={styles.modeRow}>
              <TouchableOpacity
                style={[styles.modeButton, currentMode === 'player' && styles.modeSelected]}
                onPress={() => setCurrentMode('player')}
              >
                <Ionicons
                  name="football-outline"
                  size={24}
                  color={currentMode === 'player' ? '#fff' : '#2ecc71'}
                />
                <Text style={[styles.modeText, currentMode === 'player' && styles.modeTextSelected]}>
                  Je suis joueur
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeButton, currentMode === 'organizer' && styles.modeSelectedOrga]}
                onPress={() => setCurrentMode('organizer')}
              >
                <Ionicons
                  name="clipboard-outline"
                  size={24}
                  color={currentMode === 'organizer' ? '#fff' : '#c0392b'}
                />
                <Text style={[styles.modeText, currentMode === 'organizer' && styles.modeTextSelected]}>
                  J'organise des matchs
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ─── Champs ─── */}
        {isRegistering && (
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#999" style={styles.inputIcon} />
            <TextInput
              placeholder="Nom complet"
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholderTextColor="#aaa"
            />
          </View>
        )}

        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
          <TextInput
            placeholder="Email"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor="#aaa"
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
          <TextInput
            placeholder="Mot de passe (min. 6 caractères)"
            style={styles.input}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholderTextColor="#aaa"
          />
        </View>

        {/* ─── Bouton principal ─── */}
        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleAuth}
          disabled={loading}
        >
          <Text style={styles.btnText}>
            {loading ? 'Chargement...' : isRegistering ? "S'INSCRIRE" : 'SE CONNECTER'}
          </Text>
        </TouchableOpacity>

        {/* ─── Lien bascule ─── */}
        <TouchableOpacity onPress={() => { setIsRegistering(!isRegistering); setName(''); }}>
          <Text style={styles.link}>
            {isRegistering ? "J'ai déjà un compte" : "Pas de compte ? Créer un compte"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 25,
    backgroundColor: '#f0f4f0',
  },
  logo: {
    width: 110,
    height: 110,
    alignSelf: 'center',
    marginBottom: 15,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: '#2ecc71',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    color: '#2c3e50',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 25,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  modeContainer: {
    marginBottom: 20,
  },
  modeLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 10,
    textAlign: 'center',
  },
  modeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modeButton: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#2ecc71',
    alignItems: 'center',
    backgroundColor: '#fff',
    gap: 6,
  },
  modeSelected: {
    backgroundColor: '#2ecc71',
    borderColor: '#2ecc71',
  },
  modeSelectedOrga: {
    backgroundColor: '#c0392b',
    borderColor: '#c0392b',
  },
  modeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2c3e50',
    textAlign: 'center',
  },
  modeTextSelected: {
    color: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  inputIcon: {
    paddingLeft: 14,
  },
  input: {
    flex: 1,
    padding: 15,
    fontSize: 15,
    color: '#2c3e50',
  },
  btn: {
    backgroundColor: '#2ecc71',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#2ecc71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  btnDisabled: {
    backgroundColor: '#95a5a6',
  },
  btnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 17,
    letterSpacing: 0.5,
  },
  link: {
    color: '#3498db',
    textAlign: 'center',
    marginTop: 22,
    fontWeight: '600',
    fontSize: 15,
  },
});
