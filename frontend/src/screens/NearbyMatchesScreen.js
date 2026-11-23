import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl,
  ActivityIndicator, Alert, TextInput, Dimensions, Platform
} from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import client from '../api/client';

const { width } = Dimensions.get('window');
const RADIUS_OPTIONS = [5, 10, 25];

export default function NearbyMatchesScreen({ navigation }) {
  const [viewMode, setViewMode] = useState('list');     // 'map' | 'list'
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [radiusKm, setRadiusKm] = useState(10);
  const [userLocation, setUserLocation] = useState(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [manualCity, setManualCity] = useState('');
  const mapRef = useRef(null);

  // ─── Demander la localisation ───────────────────────────────
  const getLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationDenied(true);
        setLoading(false);
        return null;
      }
      setLocationDenied(false);
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setUserLocation(coords);
      return coords;
    } catch (err) {
      console.log('Erreur localisation:', err);
      setLocationDenied(true);
      setLoading(false);
      return null;
    }
  }, []);

  // ─── Géocodage ville manuelle ───────────────────────────────
  const geocodeCity = async () => {
    if (!manualCity.trim()) return;
    try {
      setLoading(true);
      const results = await Location.geocodeAsync(manualCity.trim());
      if (results.length > 0) {
        const coords = { latitude: results[0].latitude, longitude: results[0].longitude };
        setUserLocation(coords);
        setLocationDenied(false);
        fetchMatches(coords, radiusKm);
      } else {
        Alert.alert('Erreur', 'Ville introuvable. Essayez un autre nom.');
        setLoading(false);
      }
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de trouver cette ville.');
      setLoading(false);
    }
  };

  // ─── Charger les matchs proches ─────────────────────────────
  const fetchMatches = useCallback(async (coords, radius) => {
    if (!coords) return;
    try {
      const res = await client.get('/api/matches/nearby', {
        params: { lat: coords.latitude, lng: coords.longitude, radiusKm: radius }
      });
      if (res.data.success) {
        setMatches(res.data.matches);
      }
    } catch (err) {
      console.log('Erreur chargement matchs:', err.response?.data || err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ─── Init ───────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const coords = await getLocation();
      if (coords) fetchMatches(coords, radiusKm);
    })();
  }, []);

  // ─── Rafraîchir ─────────────────────────────────────────────
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (userLocation) {
      fetchMatches(userLocation, radiusKm);
    } else {
      setRefreshing(false);
    }
  }, [userLocation, radiusKm, fetchMatches]);

  // ─── Changer le rayon ───────────────────────────────────────
  const changeRadius = (r) => {
    setRadiusKm(r);
    setLoading(true);
    if (userLocation) fetchMatches(userLocation, r);
  };

  // ─── Formatage date ─────────────────────────────────────────
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  };
  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  // ─── Carte ──────────────────────────────────────────────────
  const renderMap = () => {
    if (!userLocation) return null;
    return (
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          ...userLocation,
          latitudeDelta: radiusKm * 0.025,
          longitudeDelta: radiusKm * 0.025,
        }}
        showsUserLocation
        showsMyLocationButton
      >
        <Circle
          center={userLocation}
          radius={radiusKm * 1000}
          strokeColor="rgba(46,204,113,0.5)"
          fillColor="rgba(46,204,113,0.08)"
          strokeWidth={1}
        />
        {matches.map((match) => (
          <Marker
            key={match._id}
            coordinate={{
              latitude: match.location.coordinates[1],
              longitude: match.location.coordinates[0],
            }}
            title={match.title}
            description={`${match.playersNeeded - (match.players?.length || 0)} places • ${match.price || 0} DH`}
            onCalloutPress={() => navigation.navigate('MatchDetail', { matchId: match._id })}
            pinColor={match.spotsLeft <= 2 ? '#e74c3c' : '#2ecc71'}
          />
        ))}
      </MapView>
    );
  };

  // ─── Item liste ─────────────────────────────────────────────
  const renderMatchItem = ({ item }) => {
    const spotsLeft = item.spotsLeft ?? (item.playersNeeded - (item.players?.length || 0));
    const isCritical = spotsLeft <= 2;

    return (
      <TouchableOpacity
        style={styles.matchCard}
        onPress={() => navigation.navigate('MatchDetail', { matchId: item._id })}
        activeOpacity={0.7}
      >
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.matchTitle} numberOfLines={1}>{item.title}</Text>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={14} color="#7f8c8d" />
              <Text style={styles.infoText} numberOfLines={1}>{item.address || 'Adresse non précisée'}</Text>
            </View>
            {item.distanceKm !== undefined && (
              <View style={styles.infoRow}>
                <Ionicons name="navigate-outline" size={14} color="#3498db" />
                <Text style={[styles.infoText, { color: '#3498db', fontWeight: '700' }]}>
                  {item.distanceKm < 1 ? `${Math.round(item.distanceKm * 1000)} m` : `${item.distanceKm} km`}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.priceTag}>
            <Text style={styles.priceText}>
              {item.price > 0 ? `${item.price} DH` : 'Gratuit'}
            </Text>
          </View>
        </View>

        <View style={styles.cardBottom}>
          <View style={styles.dateChip}>
            <Ionicons name="calendar-outline" size={14} color="#fff" />
            <Text style={styles.chipText}>{formatDate(item.dateTime)}</Text>
          </View>
          <View style={styles.timeChip}>
            <Ionicons name="time-outline" size={14} color="#fff" />
            <Text style={styles.chipText}>{formatTime(item.dateTime)}</Text>
          </View>
          <View style={[styles.spotsChip, isCritical && styles.spotsChipCritical]}>
            <Ionicons name="people" size={14} color="#fff" />
            <Text style={styles.chipText}>
              {item.playersNeeded - spotsLeft}/{item.playersNeeded}
            </Text>
          </View>
        </View>

        {item.organizerName && (
          <Text style={styles.organizer}>
            Organisé par {item.organizerName}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  // ─── Écran localisation refusée ─────────────────────────────
  if (locationDenied) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="location-outline" size={60} color="#c0392b" />
        <Text style={styles.deniedTitle}>Localisation non disponible</Text>
        <Text style={styles.deniedText}>
          Autorisez la localisation ou saisissez une ville pour voir les matchs autour de vous.
        </Text>
        <View style={styles.manualInputRow}>
          <TextInput
            style={styles.manualInput}
            placeholder="Ex: Casablanca"
            value={manualCity}
            onChangeText={setManualCity}
            onSubmitEditing={geocodeCity}
            placeholderTextColor="#aaa"
          />
          <TouchableOpacity style={styles.manualBtn} onPress={geocodeCity}>
            <Ionicons name="search" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.retryBtn} onPress={getLocation}>
          <Ionicons name="refresh" size={18} color="#2ecc71" />
          <Text style={styles.retryText}>Réessayer la localisation</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Chargement initial ─────────────────────────────────────
  if (loading && matches.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2ecc71" />
        <Text style={styles.loadingText}>Recherche des matchs...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚽ Matchs près de moi</Text>

        {/* Sélecteur de rayon */}
        <View style={styles.radiusRow}>
          {RADIUS_OPTIONS.map(r => (
            <TouchableOpacity
              key={r}
              style={[styles.radiusChip, radiusKm === r && styles.radiusChipActive]}
              onPress={() => changeRadius(r)}
            >
              <Text style={[styles.radiusText, radiusKm === r && styles.radiusTextActive]}>
                {r} km
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bascule Carte / Liste */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'list' && styles.toggleActive]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons name="list" size={18} color={viewMode === 'list' ? '#fff' : '#2c3e50'} />
            <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>Liste</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'map' && styles.toggleActive]}
            onPress={() => setViewMode('map')}
          >
            <Ionicons name="map" size={18} color={viewMode === 'map' ? '#fff' : '#2c3e50'} />
            <Text style={[styles.toggleText, viewMode === 'map' && styles.toggleTextActive]}>Carte</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Contenu ─── */}
      {viewMode === 'map' ? (
        <View style={{ flex: 1 }}>
          {renderMap()}
          {/* Compteur en overlay */}
          <View style={styles.mapOverlay}>
            <Text style={styles.mapOverlayText}>
              {matches.length} match{matches.length > 1 ? 's' : ''} trouvé{matches.length > 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item._id}
          renderItem={renderMatchItem}
          contentContainerStyle={matches.length > 0 ? styles.listContent : styles.emptyContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2ecc71']} tintColor="#2ecc71" />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="football-outline" size={60} color="#ccc" />
              <Text style={styles.emptyTitle}>Aucun match trouvé</Text>
              <Text style={styles.emptyText}>
                Aucun match disponible dans un rayon de {radiusKm} km.{'\n'}Essayez d'augmenter le rayon ou tirez vers le bas pour rafraîchir.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: '#f5f7fa' },
  loadingText: { marginTop: 15, color: '#7f8c8d', fontSize: 16 },

  // Header
  header: { backgroundColor: '#fff', paddingTop: Platform.OS === 'ios' ? 55 : 15, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#2c3e50', marginBottom: 10 },

  // Rayon
  radiusRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  radiusChip: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: '#ecf0f1', borderWidth: 1, borderColor: '#ddd' },
  radiusChipActive: { backgroundColor: '#2ecc71', borderColor: '#2ecc71' },
  radiusText: { fontSize: 13, fontWeight: '700', color: '#7f8c8d' },
  radiusTextActive: { color: '#fff' },

  // Toggle
  toggleRow: { flexDirection: 'row', backgroundColor: '#ecf0f1', borderRadius: 12, overflow: 'hidden' },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 9, gap: 6 },
  toggleActive: { backgroundColor: '#2c3e50' },
  toggleText: { fontSize: 14, fontWeight: '700', color: '#2c3e50' },
  toggleTextActive: { color: '#fff' },

  // Map
  map: { flex: 1 },
  mapOverlay: { position: 'absolute', bottom: 20, alignSelf: 'center', backgroundColor: 'rgba(44,62,80,0.9)', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
  mapOverlayText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // List
  listContent: { padding: 16, paddingBottom: 30 },
  emptyContent: { flexGrow: 1, justifyContent: 'center', padding: 30 },

  // Match card
  matchCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
  },
  cardTop: { flexDirection: 'row', marginBottom: 12 },
  matchTitle: { fontSize: 17, fontWeight: '800', color: '#2c3e50', marginBottom: 6 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 },
  infoText: { fontSize: 13, color: '#7f8c8d', flex: 1 },
  priceTag: { backgroundColor: '#f0fdf4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, justifyContent: 'center', marginLeft: 10 },
  priceText: { fontSize: 14, fontWeight: '800', color: '#2ecc71' },

  cardBottom: { flexDirection: 'row', gap: 8 },
  dateChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#3498db', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  timeChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#8e44ad', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  spotsChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#2ecc71', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  spotsChipCritical: { backgroundColor: '#e74c3c' },
  chipText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  organizer: { marginTop: 8, fontSize: 12, color: '#95a5a6', fontStyle: 'italic' },

  // Empty
  emptyContainer: { alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#bdc3c7', marginTop: 15 },
  emptyText: { fontSize: 14, color: '#95a5a6', textAlign: 'center', marginTop: 8, lineHeight: 22 },

  // Location denied
  deniedTitle: { fontSize: 20, fontWeight: '800', color: '#2c3e50', marginTop: 15 },
  deniedText: { fontSize: 14, color: '#7f8c8d', textAlign: 'center', marginTop: 8, marginBottom: 25, lineHeight: 22 },
  manualInputRow: { flexDirection: 'row', width: '100%', gap: 10, marginBottom: 20 },
  manualInput: { flex: 1, backgroundColor: '#fff', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#ddd', fontSize: 15 },
  manualBtn: { backgroundColor: '#2ecc71', width: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10 },
  retryText: { color: '#2ecc71', fontWeight: '700', fontSize: 15 },
});
