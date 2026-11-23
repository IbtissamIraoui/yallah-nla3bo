import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, Linking, Platform, Dimensions
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import client from '../api/client';

const { width } = Dimensions.get('window');

export default function MatchDetailScreen({ route, navigation }) {
  const { matchId } = route.params;
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const fetchMatch = useCallback(async () => {
    try {
      const res = await client.get(`/api/matches/${matchId}`);
      if (res.data.success) setMatch(res.data.match);
    } catch (err) {
      Alert.alert('Erreur', err.response?.data?.msg || 'Impossible de charger le match.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => { fetchMatch(); }, [fetchMatch]);

  // ─── Rejoindre ──────────────────────────────────────────────
  const handleJoin = async () => {
    setJoining(true);
    try {
      const res = await client.post(`/api/matches/${matchId}/join`);
      Alert.alert('✅ Super !', res.data.msg);
      fetchMatch();
    } catch (err) {
      Alert.alert('Erreur', err.response?.data?.msg || 'Impossible de rejoindre.');
    } finally {
      setJoining(false);
    }
  };

  // ─── Quitter ────────────────────────────────────────────────
  const handleLeave = async () => {
    Alert.alert('Quitter le match', 'Es-tu sûr de vouloir quitter ce match ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Quitter', style: 'destructive', onPress: async () => {
          setJoining(true);
          try {
            const res = await client.post(`/api/matches/${matchId}/leave`);
            Alert.alert('OK', res.data.msg);
            fetchMatch();
          } catch (err) {
            Alert.alert('Erreur', err.response?.data?.msg || 'Impossible de quitter.');
          } finally {
            setJoining(false);
          }
        }
      }
    ]);
  };

  // ─── Ouvrir itinéraire ──────────────────────────────────────
  const openDirections = () => {
    if (!match?.location?.coordinates) return;
    const [lng, lat] = match.location.coordinates;
    const scheme = Platform.select({
      ios: `maps:0,0?q=${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${encodeURIComponent(match.title)})`
    });
    const url = Platform.select({
      ios: `https://maps.apple.com/?daddr=${lat},${lng}`,
      android: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    });
    Linking.openURL(scheme).catch(() => Linking.openURL(url));
  };

  // ─── Formatage ──────────────────────────────────────────────
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };
  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2ecc71" />
      </View>
    );
  }

  if (!match) return null;

  const spotsLeft = match.spotsLeft ?? (match.playersNeeded - (match.players?.length || 0));
  const filledPercent = ((match.players?.length || 0) / match.playersNeeded) * 100;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ─── Header avec retour ─── */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#2c3e50" />
          </TouchableOpacity>
          <Text style={styles.topBarTitle} numberOfLines={1}>{match.title}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* ─── Mini-carte ─── */}
        {match.location?.coordinates && (
          <TouchableOpacity onPress={openDirections} activeOpacity={0.9}>
            <MapView
              style={styles.miniMap}
              scrollEnabled={false}
              zoomEnabled={false}
              initialRegion={{
                latitude: match.location.coordinates[1],
                longitude: match.location.coordinates[0],
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker
                coordinate={{
                  latitude: match.location.coordinates[1],
                  longitude: match.location.coordinates[0],
                }}
              />
            </MapView>
            <View style={styles.mapDirectionOverlay}>
              <Ionicons name="navigate" size={16} color="#fff" />
              <Text style={styles.mapDirectionText}>Ouvrir l'itinéraire</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* ─── Infos principales ─── */}
        <View style={styles.section}>
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, match.status === 'full' && styles.statusFull]}>
              <Text style={styles.statusText}>
                {match.status === 'open' ? '🟢 Ouvert' : match.status === 'full' ? '🔴 Complet' : match.status}
              </Text>
            </View>
            <View style={styles.priceBadge}>
              <Text style={styles.priceText}>
                {match.price > 0 ? `${match.price} DH` : '🎉 Gratuit'}
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="calendar" size={20} color="#3498db" />
            <Text style={styles.infoText}>{formatDate(match.dateTime)}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="time" size={20} color="#8e44ad" />
            <Text style={styles.infoText}>{formatTime(match.dateTime)} • {match.durationMinutes} min</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="location" size={20} color="#e74c3c" />
            <Text style={styles.infoText}>{match.address || 'Adresse non précisée'}</Text>
          </View>
          {match.level && match.level !== 'tous' && (
            <View style={styles.infoItem}>
              <Ionicons name="trophy" size={20} color="#f39c12" />
              <Text style={styles.infoText}>Niveau : {match.level}</Text>
            </View>
          )}
        </View>

        {/* ─── Description ─── */}
        {match.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{match.description}</Text>
          </View>
        ) : null}

        {/* ─── Jauge de joueurs ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Joueurs</Text>
          <View style={styles.gaugeContainer}>
            <View style={styles.gaugeBar}>
              <View style={[styles.gaugeFill, { width: `${Math.min(filledPercent, 100)}%` },
                filledPercent >= 100 && styles.gaugeFull
              ]} />
            </View>
            <Text style={styles.gaugeText}>
              {match.players?.length || 0}/{match.playersNeeded} joueurs
              {spotsLeft > 0 ? ` (${spotsLeft} place${spotsLeft > 1 ? 's' : ''} restante${spotsLeft > 1 ? 's' : ''})` : ' — COMPLET'}
            </Text>
          </View>
        </View>

        {/* ─── Organisateur ─── */}
        {match.organizerId && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Organisateur</Text>
            <View style={styles.organizerCard}>
              <View style={styles.organizerAvatar}>
                <Ionicons name="person" size={24} color="#fff" />
              </View>
              <View>
                <Text style={styles.organizerName}>{match.organizerId.name || 'Organisateur'}</Text>
                {match.organizerId.phone ? (
                  <TouchableOpacity onPress={() => Linking.openURL(`tel:${match.organizerId.phone}`)}>
                    <Text style={styles.organizerPhone}>📞 {match.organizerId.phone}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          </View>
        )}

        {/* ─── Liste des inscrits ─── */}
        {match.players && match.players.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Joueurs inscrits ({match.players.length})</Text>
            {match.players.map((p, i) => (
              <View key={p._id || i} style={styles.playerRow}>
                <View style={styles.playerIcon}>
                  <Ionicons name="person" size={16} color="#2ecc71" />
                </View>
                <Text style={styles.playerName}>
                  {p.userId?.name || 'Joueur'}
                </Text>
                {p.userId?.level ? (
                  <Text style={styles.playerLevel}>{p.userId.level}</Text>
                ) : null}
              </View>
            ))}
          </View>
        )}

        {/* Espace pour le bouton fixe */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ─── Bouton fixe en bas ─── */}
      <View style={styles.bottomBar}>
        {match.isJoined ? (
          <TouchableOpacity
            style={[styles.actionBtn, styles.leaveBtn]}
            onPress={handleLeave}
            disabled={joining}
          >
            <Ionicons name="exit-outline" size={22} color="#fff" />
            <Text style={styles.actionBtnText}>
              {joining ? 'Chargement...' : 'Quitter le match'}
            </Text>
          </TouchableOpacity>
        ) : match.status === 'open' ? (
          <TouchableOpacity
            style={[styles.actionBtn, styles.joinBtn]}
            onPress={handleJoin}
            disabled={joining}
          >
            <Ionicons name="add-circle-outline" size={22} color="#fff" />
            <Text style={styles.actionBtnText}>
              {joining ? 'Chargement...' : 'Rejoindre le match'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.actionBtn, styles.fullBtn]}>
            <Ionicons name="lock-closed" size={22} color="#fff" />
            <Text style={styles.actionBtnText}>Match complet</Text>
          </View>
        )}

        <TouchableOpacity style={styles.directionBtn} onPress={openDirections}>
          <Ionicons name="navigate" size={22} color="#3498db" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 20 },

  // Top bar
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 55 : 15, paddingBottom: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  topBarTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: '#2c3e50', textAlign: 'center', marginHorizontal: 10 },

  // Mini map
  miniMap: { width: '100%', height: 180 },
  mapDirectionOverlay: {
    position: 'absolute', bottom: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(52,152,219,0.9)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
  },
  mapDirectionText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  // Section
  section: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, padding: 16, borderRadius: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#2c3e50', marginBottom: 12 },

  // Status
  statusRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statusBadge: { backgroundColor: '#e8faf0', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  statusFull: { backgroundColor: '#fde8e8' },
  statusText: { fontWeight: '700', fontSize: 13 },
  priceBadge: { backgroundColor: '#f0fdf4', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  priceText: { fontWeight: '800', fontSize: 14, color: '#2ecc71' },

  // Info items
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  infoText: { fontSize: 15, color: '#2c3e50', flex: 1 },

  description: { fontSize: 14, color: '#7f8c8d', lineHeight: 22 },

  // Gauge
  gaugeContainer: { marginTop: 4 },
  gaugeBar: { height: 10, backgroundColor: '#ecf0f1', borderRadius: 5, overflow: 'hidden' },
  gaugeFill: { height: '100%', backgroundColor: '#2ecc71', borderRadius: 5 },
  gaugeFull: { backgroundColor: '#e74c3c' },
  gaugeText: { marginTop: 8, fontSize: 14, color: '#7f8c8d', fontWeight: '600' },

  // Organizer
  organizerCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  organizerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2ecc71', justifyContent: 'center', alignItems: 'center' },
  organizerName: { fontSize: 16, fontWeight: '700', color: '#2c3e50' },
  organizerPhone: { fontSize: 14, color: '#3498db', marginTop: 3 },

  // Players
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  playerIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#e8faf0', justifyContent: 'center', alignItems: 'center' },
  playerName: { flex: 1, fontSize: 15, color: '#2c3e50', fontWeight: '600' },
  playerLevel: { fontSize: 12, color: '#95a5a6', fontStyle: 'italic' },

  // Bottom bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 16, paddingVertical: 14, paddingBottom: Platform.OS === 'ios' ? 34 : 14,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee',
    elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1, shadowRadius: 5,
  },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 15, borderRadius: 14,
  },
  joinBtn: { backgroundColor: '#2ecc71' },
  leaveBtn: { backgroundColor: '#e74c3c' },
  fullBtn: { backgroundColor: '#95a5a6' },
  actionBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  directionBtn: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: '#ebf5fb', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#3498db',
  },
});
