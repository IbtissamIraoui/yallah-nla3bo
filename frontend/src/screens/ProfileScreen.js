import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ScrollView, Platform, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import client from '../api/client';

export default function ProfileScreen({ setIsLoggedIn, onModeChanged }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await client.get('/api/auth/me');
      if (res.data.success) setUser(res.data.user);
    } catch (err) {
      console.log('Erreur profil:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  // ─── Changer de mode ─────────────────────────────────────────
  const handleSwitchMode = async () => {
    const newMode = user.currentMode === 'player' ? 'organisateur' : 'joueur';
    Alert.alert(
      'Changer de mode',
      `Voulez-vous passer en mode ${newMode} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            setSwitching(true);
            try {
              const res = await client.post('/api/auth/switch-mode');
              if (res.data.success) {
                await AsyncStorage.setItem('token', res.data.token);
                await AsyncStorage.setItem('userMode', res.data.user.currentMode);
                setUser(res.data.user);
                Alert.alert('✅ Mode changé', res.data.msg);
                if (onModeChanged) onModeChanged(res.data.user.currentMode);
              }
            } catch (err) {
              Alert.alert('Erreur', err.response?.data?.msg || 'Impossible de changer de mode.');
            } finally {
              setSwitching(false);
            }
          }
        }
      ]
    );
  };

  // ─── Déconnexion ──────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion', style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove(['token', 'userMode', 'userName']);
          setIsLoggedIn(false);
        }
      }
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2ecc71" />
      </View>
    );
  }

  if (!user) return null;

  const isPlayer = user.currentMode === 'player';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ─── Avatar + Nom ─── */}
      <View style={styles.avatarSection}>
        <View style={[styles.avatar, { backgroundColor: isPlayer ? '#2ecc71' : '#c0392b' }]}>
          <Ionicons name={isPlayer ? 'football' : 'clipboard'} size={40} color="#fff" />
        </View>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
        <View style={[styles.modeBadge, { backgroundColor: isPlayer ? '#e8faf0' : '#fde8e8' }]}>
          <Text style={[styles.modeBadgeText, { color: isPlayer ? '#2ecc71' : '#c0392b' }]}>
            {isPlayer ? '⚽ Mode Joueur' : '📋 Mode Organisateur'}
          </Text>
        </View>
      </View>

      {/* ─── Infos ─── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations</Text>
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={20} color="#7f8c8d" />
          <Text style={styles.infoLabel}>Nom</Text>
          <Text style={styles.infoValue}>{user.name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={20} color="#7f8c8d" />
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{user.email}</Text>
        </View>
        {user.phone ? (
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={20} color="#7f8c8d" />
            <Text style={styles.infoLabel}>Téléphone</Text>
            <Text style={styles.infoValue}>{user.phone}</Text>
          </View>
        ) : null}
        {user.level ? (
          <View style={styles.infoRow}>
            <Ionicons name="trophy-outline" size={20} color="#7f8c8d" />
            <Text style={styles.infoLabel}>Niveau</Text>
            <Text style={styles.infoValue}>{user.level}</Text>
          </View>
        ) : null}
      </View>

      {/* ─── Bouton changer de mode ─── */}
      <TouchableOpacity
        style={[styles.switchBtn, { backgroundColor: isPlayer ? '#c0392b' : '#2ecc71' }]}
        onPress={handleSwitchMode}
        disabled={switching}
      >
        <Ionicons name="swap-horizontal" size={22} color="#fff" />
        <Text style={styles.switchBtnText}>
          {switching ? 'Chargement...' : `Passer en mode ${isPlayer ? 'Organisateur' : 'Joueur'}`}
        </Text>
      </TouchableOpacity>

      {/* ─── Déconnexion ─── */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color="#e74c3c" />
        <Text style={styles.logoutText}>Déconnexion</Text>
      </TouchableOpacity>

      <Text style={styles.version}>KoraTime v2.0 — Marketplace de matchs</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  content: { paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Avatar
  avatarSection: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 65 : 30,
    paddingBottom: 25,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 5, elevation: 3,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 5,
  },
  userName: { fontSize: 22, fontWeight: '800', color: '#2c3e50' },
  userEmail: { fontSize: 14, color: '#95a5a6', marginTop: 4 },
  modeBadge: { marginTop: 10, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  modeBadgeText: { fontWeight: '700', fontSize: 14 },

  // Section
  section: {
    backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 16,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#2c3e50', marginBottom: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  infoLabel: { fontSize: 14, color: '#95a5a6', width: 80 },
  infoValue: { fontSize: 15, color: '#2c3e50', fontWeight: '600', flex: 1 },

  // Switch
  switchBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    marginHorizontal: 16, marginTop: 20, paddingVertical: 16, borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 4,
  },
  switchBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  // Logout
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 16, marginTop: 14, paddingVertical: 14, borderRadius: 16,
    backgroundColor: '#fff', borderWidth: 2, borderColor: '#e74c3c',
  },
  logoutText: { color: '#e74c3c', fontWeight: '700', fontSize: 16 },

  version: { textAlign: 'center', color: '#bdc3c7', fontSize: 12, marginTop: 25 },
});
