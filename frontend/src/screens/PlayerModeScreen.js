import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import client from '../api/client';

export default function PlayerModeScreen({ setIsLoggedIn }) {
  const [matches, setMatches] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const isFocused = useIsFocused();

  const loadMatches = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await client.get('/api/player/matches');
      setMatches(response.data.matches || []);
    } catch (error) {
      Alert.alert('Erreur', error.response?.data?.msg || 'Impossible de charger vos matchs.');
    } finally {
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => { if (isFocused) loadMatches(); }, [isFocused, loadMatches]);

  const confirmPresence = async (match, present) => {
    try {
      await client.patch(`/api/player/matches/${match._id}/presence`, { present });
      setMatches(current => current.map(item => item._id === match._id
        ? { ...item, feuilleDeMatch: item.feuilleDeMatch.map(entry => ({ ...entry, present })) }
        : item));
    } catch (error) {
      Alert.alert('Erreur', error.response?.data?.msg || 'Impossible de modifier votre présence.');
    }
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['token', 'userRole']);
    setIsLoggedIn(false);
  };

  const renderMatch = ({ item }) => {
    const myEntry = item.feuilleDeMatch?.[0];
    return <View style={styles.card}>
      <Text style={styles.matchName}>{item.nom || `Match du ${item.date}`}</Text>
      <Text style={styles.info}><Ionicons name="calendar-outline" size={16} />  {item.date} à {item.heure}</Text>
      <Text style={styles.info}><Ionicons name="location-outline" size={16} />  {item.terrain}</Text>
      <Text style={styles.payment}>Participation : {myEntry?.montantPaye || 0} / {Math.ceil((item.prixTotal || 0) / Math.max(item.feuilleDeMatch?.filter(p => p.present).length || 1, 1))} DH</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.action, myEntry?.present && styles.yes]} onPress={() => confirmPresence(item, true)}>
          <Text style={styles.actionText}>Je viens</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.action, myEntry && !myEntry.present && styles.no]} onPress={() => confirmPresence(item, false)}>
          <Text style={styles.actionText}>Absent</Text>
        </TouchableOpacity>
      </View>
    </View>;
  };

  return <View style={styles.container}>
    <View style={styles.header}>
      <View><Text style={styles.title}>Mon espace joueur</Text><Text style={styles.subtitle}>Mes matchs et mes présences</Text></View>
      <TouchableOpacity onPress={logout} style={styles.logout}><Ionicons name="log-out-outline" size={23} color="#fff" /></TouchableOpacity>
    </View>
    <FlatList
      data={matches}
      keyExtractor={item => item._id}
      renderItem={renderMatch}
      contentContainerStyle={matches.length ? styles.list : styles.emptyList}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadMatches} />}
      ListEmptyComponent={<Text style={styles.empty}>Aucun match ne vous est encore attribué. Demandez à l’organisateur de vous ajouter au vestiaire et à la feuille de match.</Text>}
    />
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f2' },
  header: { backgroundColor: '#166534', padding: 22, paddingTop: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: '#fff', fontWeight: '800', fontSize: 23 }, subtitle: { color: '#dcfce7', marginTop: 4 },
  logout: { padding: 10, backgroundColor: '#ffffff30', borderRadius: 12 },
  list: { padding: 16, paddingBottom: 30 }, emptyList: { flexGrow: 1, justifyContent: 'center', padding: 28 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 17, marginBottom: 14, elevation: 2 },
  matchName: { color: '#14532d', fontSize: 18, fontWeight: '800', marginBottom: 10 }, info: { color: '#475569', marginBottom: 6 },
  payment: { color: '#166534', fontWeight: '700', marginTop: 7 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 15 }, action: { flex: 1, alignItems: 'center', padding: 11, borderRadius: 10, backgroundColor: '#64748b' },
  yes: { backgroundColor: '#16a34a' }, no: { backgroundColor: '#dc2626' }, actionText: { color: '#fff', fontWeight: '700' },
  empty: { color: '#475569', textAlign: 'center', lineHeight: 23 },
});
