import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Platform, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import client from '../api/client';

export default function MyJoinedMatchesScreen({ navigation }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJoined = useCallback(async () => {
    try {
      const res = await client.get('/api/matches/player/joined');
      if (res.data.success) setMatches(res.data.matches);
    } catch (err) {
      console.log('Erreur chargement matchs rejoints:', err.response?.data || err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchJoined();
    }, [fetchJoined])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchJoined();
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  };
  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const isUpcoming = (dateStr) => new Date(dateStr) > new Date();

  const renderMatch = ({ item }) => {
    const upcoming = isUpcoming(item.dateTime);
    const spotsLeft = item.spotsLeft ?? (item.playersNeeded - (item.players?.length || 0));

    return (
      <TouchableOpacity
        style={[styles.card, !upcoming && styles.cardPast]}
        onPress={() => navigation.navigate('MatchDetail', { matchId: item._id })}
        activeOpacity={0.7}
      >
        {/* Badge statut */}
        <View style={styles.cardHeader}>
          <View style={[styles.badge, upcoming ? styles.badgeUpcoming : styles.badgePast]}>
            <Ionicons
              name={upcoming ? 'time-outline' : 'checkmark-circle-outline'}
              size={14}
              color="#fff"
            />
            <Text style={styles.badgeText}>
              {upcoming ? 'À venir' : 'Terminé'}
            </Text>
          </View>
          {item.status === 'full' && (
            <View style={[styles.badge, styles.badgeFull]}>
              <Text style={styles.badgeText}>Complet</Text>
            </View>
          )}
        </View>

        <Text style={styles.matchTitle}>{item.title}</Text>

        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color="#7f8c8d" />
          <Text style={styles.infoText}>{formatDate(item.dateTime)} à {formatTime(item.dateTime)}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color="#7f8c8d" />
          <Text style={styles.infoText} numberOfLines={1}>{item.address || 'Adresse non précisée'}</Text>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.playersInfo}>
            <Ionicons name="people" size={16} color="#2ecc71" />
            <Text style={styles.playersText}>
              {item.players?.length || 0}/{item.playersNeeded}
            </Text>
          </View>
          <Text style={styles.priceText}>
            {item.price > 0 ? `${item.price} DH` : 'Gratuit'}
          </Text>
          {item.organizerId?.name && (
            <Text style={styles.orgaName}>par {item.organizerId.name}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2ecc71" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📋 Mes matchs</Text>
        <Text style={styles.headerSubtitle}>
          {matches.length} match{matches.length > 1 ? 's' : ''} rejoint{matches.length > 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={matches}
        keyExtractor={(item) => item._id}
        renderItem={renderMatch}
        contentContainerStyle={matches.length > 0 ? styles.listContent : styles.emptyContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2ecc71']} tintColor="#2ecc71" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="football-outline" size={60} color="#ddd" />
            <Text style={styles.emptyTitle}>Aucun match rejoint</Text>
            <Text style={styles.emptyText}>
              Rejoignez des matchs depuis l'onglet "Près de moi" !
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#7f8c8d' },

  // Header
  header: {
    backgroundColor: '#fff', paddingTop: Platform.OS === 'ios' ? 55 : 15,
    paddingHorizontal: 16, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#2c3e50' },
  headerSubtitle: { fontSize: 13, color: '#95a5a6', marginTop: 4 },

  // List
  listContent: { padding: 16, paddingBottom: 30 },
  emptyContent: { flexGrow: 1, justifyContent: 'center', padding: 30 },

  // Card
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
    borderLeftWidth: 4, borderLeftColor: '#2ecc71',
  },
  cardPast: { borderLeftColor: '#bdc3c7', opacity: 0.7 },

  cardHeader: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeUpcoming: { backgroundColor: '#3498db' },
  badgePast: { backgroundColor: '#95a5a6' },
  badgeFull: { backgroundColor: '#e74c3c' },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  matchTitle: { fontSize: 17, fontWeight: '800', color: '#2c3e50', marginBottom: 8 },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  infoText: { fontSize: 14, color: '#7f8c8d', flex: 1 },

  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  playersInfo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  playersText: { fontWeight: '700', color: '#2ecc71', fontSize: 14 },
  priceText: { fontWeight: '800', color: '#f39c12', fontSize: 14 },
  orgaName: { flex: 1, textAlign: 'right', fontSize: 12, color: '#95a5a6', fontStyle: 'italic' },

  // Empty
  emptyContainer: { alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#bdc3c7', marginTop: 15 },
  emptyText: { fontSize: 14, color: '#95a5a6', textAlign: 'center', marginTop: 8, lineHeight: 22 },
});
