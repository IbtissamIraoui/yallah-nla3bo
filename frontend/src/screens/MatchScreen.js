import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { Audio } from 'expo-av';
import * as Location from 'expo-location';
import client from '../api/client';
import Loader from '../components/Loader';
import MapView, { Marker } from 'react-native-maps';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function MatchScreen() {
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState([]);
  const [players, setPlayers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [locationMode, setLocationMode] = useState(false);

  const [editingMatch, setEditingMatch] = useState(null);
  const [expandedMatch, setExpandedMatch] = useState(null);

  // Date / time
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  // Location
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const [newMatch, setNewMatch] = useState({
    date: '',
    heure: '',
    prixTotal: '300',
    terrain: 'City Foot',
    location: null,
  });

  const isFocused = useIsFocused();

  // ================== HELPER: GET PLAYER INFO ==================
  
  const getPlayerInfo = (joueurId) => {
    // Si c'est déjà un objet avec name
    if (joueurId && typeof joueurId === 'object' && joueurId.name) {
      return {
        id: joueurId._id || joueurId.id,
        name: joueurId.name
      };
    }
    
    // Si c'est juste un ID string, chercher dans la liste des joueurs
    if (typeof joueurId === 'string') {
      const player = players.find(p => p._id === joueurId || p.id === joueurId);
      return {
        id: joueurId,
        name: player ? player.name : 'Joueur inconnu'
      };
    }
    
    return { id: null, name: 'Joueur inconnu' };
  };

  // ================== LOAD DATA ==================

  const loadData = async () => {
    setLoading(true);
    try {
      const [resMatches, resPlayers] = await Promise.all([
        client.get('/api/matches'),
        client.get('/api/players'),
      ]);
      console.log('MATCHES ===>', resMatches.data);
      console.log('PLAYERS ===>', resPlayers.data);
      
      if (resMatches.data.success) {
        setMatches(resMatches.data.matches || []);
      }
      if (resPlayers.data.success) {
        setPlayers(resPlayers.data.players || []);
      }
    } catch (e) {
      console.log('loadData error', e?.response?.data || e.message);
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) loadData();
  }, [isFocused]);

  // ================== DATE / TIME ==================

  const onDateTimeChange = (event, selected) => {
    if (!selected) {
      setShowDatePicker(false);
      setShowTimePicker(false);
      return;
    }

    if (showDatePicker) {
      setTempDate(selected);
      setShowDatePicker(false);
      setShowTimePicker(true);
    } else if (showTimePicker) {
      const dateStr = tempDate.toISOString().split('T')[0];
      const hours = selected.getHours().toString().padStart(2, '0');
      const minutes = selected.getMinutes().toString().padStart(2, '0');

      setNewMatch(prev => ({
        ...prev,
        date: dateStr,
        heure: `${hours}:${minutes}`,
      }));

      setShowTimePicker(false);
    }
  };

  // ================== LOCATION ==================

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission refusée',
          "Veuillez autoriser l'accès à la localisation dans les paramètres",
        );
        setLocationLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      setCurrentLocation({ latitude, longitude });

      Alert.alert(
        'Localisation obtenue ✓',
        `Lat: ${latitude.toFixed(5)}\nLng: ${longitude.toFixed(5)}`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Utiliser',
            onPress: () => {
              setNewMatch(prev => ({
                ...prev,
                location: { latitude, longitude },
              }));
              setLocationMode(false);
            },
          },
        ],
      );
    } catch (error) {
      console.error('Erreur localisation:', error);
      Alert.alert('Erreur', "Impossible d'obtenir votre localisation");
    } finally {
      setLocationLoading(false);
    }
  };

  const shareLocationWhatsApp = match => {
    if (!match.location || !match.location.latitude || !match.location.longitude) {
      Alert.alert('Erreur', 'Aucune localisation disponible pour ce match');
      return;
    }

    const { latitude, longitude } = match.location;
    const mapUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
    const message = `⚽ Match du ${match.date} à ${match.heure}\n🏟️ ${match.terrain}\n📍 Localisation: ${mapUrl}`;

    // Utiliser l'API de partage WhatsApp correctement
    const whatsappUrl = Platform.select({
      ios: `whatsapp://send?text=${encodeURIComponent(message)}`,
      android: `whatsapp://send?text=${encodeURIComponent(message)}`
    });

    Linking.canOpenURL(whatsappUrl)
      .then(supported => {
        if (supported) {
          return Linking.openURL(whatsappUrl);
        } else {
          // Fallback vers l'URL web si l'app n'est pas installée
          const webUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
          return Linking.openURL(webUrl);
        }
      })
      .catch(err => {
        console.error('WhatsApp error:', err);
        Alert.alert('Erreur', "Impossible d'ouvrir WhatsApp");
      });
  };

  const openInGoogleMaps = location => {
    if (!location || !location.latitude || !location.longitude) {
      Alert.alert('Erreur', 'Localisation invalide');
      return;
    }
    
    const url = Platform.select({
      ios: `maps://app?q=${location.latitude},${location.longitude}`,
      android: `geo:${location.latitude},${location.longitude}?q=${location.latitude},${location.longitude}`
    });

    Linking.canOpenURL(url)
      .then(supported => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          // Fallback vers Google Maps web
          const webUrl = `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
          return Linking.openURL(webUrl);
        }
      })
      .catch(() => {
        const webUrl = `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
        Linking.openURL(webUrl);
      });
  };

  // ================== MATCH CRUD ==================

  const openMatchModal = (match = null) => {
    if (match) {
      setEditingMatch(match);
      setNewMatch({
        date: match.date || '',
        heure: match.heure || '',
        prixTotal: match.prixTotal?.toString() || '300',
        terrain: match.terrain || 'City Foot',
        location: match.location || null,
      });
    } else {
      setEditingMatch(null);
      const now = new Date();
      const defaultDate = now.toISOString().split('T')[0];
      const defaultTime = '20:00';

      setNewMatch({
        date: defaultDate,
        heure: defaultTime,
        prixTotal: '300',
        terrain: 'City Foot',
        location: null,
      });
    }
    setLocationMode(false);
    setShowModal(true);
  };

  const handleCreateMatch = async () => {
    if (!newMatch.date || !newMatch.heure) {
      return Alert.alert('Erreur', 'Date et heure obligatoires');
    }

    if (!validateDate(newMatch.date)) {
      return Alert.alert('Erreur', 'Format de date invalide (YYYY-MM-DD)');
    }

    if (!validateTime(newMatch.heure)) {
      return Alert.alert('Erreur', "Format d'heure invalide (HH:MM)");
    }

    const feuilleDeMatch = players.map(p => ({
      joueurId: p._id,
      present: true,
      paye: false,
      montantPaye: 0,
    }));

    setLoading(true);
    try {
      const matchData = {
        date: newMatch.date,
        heure: newMatch.heure,
        terrain: newMatch.terrain,
        prixTotal: Number(newMatch.prixTotal),
        location: newMatch.location,
      };

      if (editingMatch) {
        const res = await client.put(
          `/api/matches/${editingMatch._id}`,
          matchData,
        );
        console.log('update match res', res.data);
        
        // Mise à jour locale
        setMatches(prev =>
          prev.map(m =>
            m._id === editingMatch._id ? { ...m, ...matchData } : m,
          ),
        );
        Alert.alert('Succès', 'Match modifié avec succès');
      } else {
        const res = await client.post('/api/matches', {
          ...matchData,
          feuilleDeMatch,
        });
        console.log('create match res', res.data);
        
        if (res.data?.match) {
          setMatches(prev => [res.data.match, ...prev]);
        } else if (res.data?.success) {
          // Recharger les données si la structure est différente
          await loadData();
        }

        try {
          const { sound } = await Audio.Sound.createAsync(
            require('../../assets/sifflet.mp3'),
          );
          await sound.playAsync();
        } catch (e) {
          console.log('Erreur audio:', e);
        }

        Alert.alert('Succès', 'Match créé avec succès');
      }

      setShowModal(false);
      setEditingMatch(null);
      setNewMatch({
        date: '',
        heure: '',
        prixTotal: '300',
        terrain: 'City Foot',
        location: null,
      });
    } catch (e) {
      console.log('handleCreateMatch error', e?.response?.data || e.message);
      Alert.alert(
        'Erreur',
        editingMatch
          ? 'Impossible de modifier le match'
          : 'Impossible de créer le match',
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteMatch = match => {
    Alert.alert(
      'Confirmation',
      'Voulez-vous vraiment supprimer ce match ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const res = await client.delete(`/api/matches/${match._id}`);
              console.log('delete res', res.data);
              
              // Vérifier si la suppression a réussi
              if (res.data?.success !== false) {
                setMatches(prev => prev.filter(m => m._id !== match._id));
                Alert.alert('Succès', 'Match supprimé avec succès');
              } else {
                throw new Error(res.data?.message || 'Échec de la suppression');
              }
            } catch (e) {
              console.log('delete error', e?.response?.data || e.message);
              Alert.alert(
                'Erreur',
                e?.response?.data?.message || 'Impossible de supprimer le match',
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  // ================== PRÉSENCE & PAIEMENT ==================

  const togglePresence = async (matchId, joueurId) => {
    const match = matches.find(m => m._id === matchId);
    if (!match) return;

    const updatedFeuille = match.feuilleDeMatch.map(j => {
      const playerInfo = getPlayerInfo(j.joueurId);
      if (playerInfo.id === joueurId) {
        return { ...j, present: !j.present };
      }
      return j;
    });

    // Update local state pour feedback immédiat
    setMatches(prev =>
      prev.map(m =>
        m._id === matchId ? { ...m, feuilleDeMatch: updatedFeuille } : m,
      ),
    );

    setLoading(true);
    try {
      await client.put(`/api/matches/${matchId}`, {
        ...match,
        feuilleDeMatch: updatedFeuille,
      });
    } catch (e) {
      console.log('togglePresence error', e?.response?.data || e.message);
      Alert.alert('Erreur', 'Impossible de modifier la présence');
      loadData(); // rollback
    } finally {
      setLoading(false);
    }
  };

  const togglePaye = async (matchId, joueurId) => {
    const match = matches.find(m => m._id === matchId);
    if (!match) return;

    const playersPresent = match.feuilleDeMatch.filter(j => j.present).length;
    const montantParJoueur =
      playersPresent > 0 ? Math.round(match.prixTotal / playersPresent) : 0;

    const updatedFeuille = match.feuilleDeMatch.map(j => {
      const playerInfo = getPlayerInfo(j.joueurId);
      if (playerInfo.id === joueurId) {
        const newPaye = !j.paye;
        return {
          ...j,
          paye: newPaye,
          montantPaye: newPaye ? montantParJoueur : 0,
        };
      }
      return j;
    });

    setMatches(prev =>
      prev.map(m =>
        m._id === matchId ? { ...m, feuilleDeMatch: updatedFeuille } : m,
      ),
    );

    setLoading(true);
    try {
      await client.put(`/api/matches/${matchId}`, {
        ...match,
        feuilleDeMatch: updatedFeuille,
      });
    } catch (e) {
      console.log('togglePaye error', e?.response?.data || e.message);
      Alert.alert('Erreur', 'Impossible de modifier le paiement');
      loadData();
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentAmount = async (matchId, joueurId, amount) => {
    const match = matches.find(m => m._id === matchId);
    if (!match) return;

    const value = parseFloat(amount) || 0;

    const updatedFeuille = match.feuilleDeMatch.map(j => {
      const playerInfo = getPlayerInfo(j.joueurId);
      if (playerInfo.id === joueurId) {
        return { ...j, montantPaye: value, paye: value > 0 };
      }
      return j;
    });

    setMatches(prev =>
      prev.map(m =>
        m._id === matchId ? { ...m, feuilleDeMatch: updatedFeuille } : m,
      ),
    );

    setLoading(true);
    try {
      await client.put(`/api/matches/${matchId}`, {
        ...match,
        feuilleDeMatch: updatedFeuille,
      });
    } catch (e) {
      console.log('updatePaymentAmount error', e?.response?.data || e.message);
      Alert.alert('Erreur', 'Impossible de modifier le montant');
      loadData();
    } finally {
      setLoading(false);
    }
  };

  // ================== CALCUL STATS ==================

  const calculateMatchStats = match => {
    const playersPresent =
      match.feuilleDeMatch?.filter(j => j.present).length || 0;
    const playersPaid = match.feuilleDeMatch?.filter(j => j.paye).length || 0;
    const totalCollected =
      match.feuilleDeMatch?.reduce(
        (sum, j) => sum + (j.montantPaye || 0),
        0,
      ) || 0;
    const remaining = match.prixTotal - totalCollected;
    const costPerPlayer =
      playersPresent > 0 ? Math.round(match.prixTotal / playersPresent) : 0;

    return {
      playersPresent,
      playersPaid,
      totalCollected,
      remaining,
      costPerPlayer,
    };
  };

  // ================== RENDER ==================

  if (loading && matches.length === 0) return <Loader />;

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.title}>⚽ Mes Matchs ({matches.length})</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.btnNew}
            onPress={() => openMatchModal()}
            disabled={loading}
          >
            <Text style={styles.btnNewText}>+ Match</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsCard}>
        <Text style={styles.statsLabel}>Total Joueurs</Text>
        <Text style={styles.statsValue}>{players.length}</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {matches.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Aucun match. Créez votre premier match !
            </Text>
          </View>
        ) : (
          matches.map(match => {
            const stats = calculateMatchStats(match);
            const isExpanded = expandedMatch === match._id;

            return (
              <View key={match._id} style={styles.card}>
                {/* Header */}
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.matchTitle}>
                      {match.nom || 'Match du ' + match.date}
                    </Text>
                    <Text style={styles.matchInfos}>
                      📅 {match.date} à {match.heure}
                    </Text>
                    <Text style={styles.matchInfos}>🏟️ {match.terrain}</Text>

                    {match.location && match.location.latitude && match.location.longitude && (
                      <View style={styles.locationActions}>
                        <TouchableOpacity
                          onPress={() => shareLocationWhatsApp(match)}
                          style={styles.locationButton}
                        >
                          <Ionicons
                            name="logo-whatsapp"
                            size={16}
                            color="#25D366"
                          />
                          <Text style={styles.locationButtonText}>
                            WhatsApp
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => openInGoogleMaps(match.location)}
                          style={[styles.locationButton, { marginLeft: 8 }]}
                        >
                          <Ionicons name="map-outline" size={16} color="#fff" />
                          <Text style={styles.locationButtonText}>Ouvrir</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {/* Actions edit/delete */}
                  <View style={styles.cardHeaderActions}>
                    <TouchableOpacity
                      onPress={() => openMatchModal(match)}
                      disabled={loading}
                    >
                      <Ionicons name="create-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => deleteMatch(match)}
                      disabled={loading}
                      style={{ marginLeft: 12 }}
                    >
                      <Ionicons name="trash-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Prix Total</Text>
                    <Text style={styles.statValue}>{match.prixTotal} DH</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Par Joueur</Text>
                    <Text style={styles.statValue}>
                      {stats.costPerPlayer} DH
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Caisse</Text>
                    <Text
                      style={[
                        styles.statValue,
                        {
                          color:
                            stats.remaining <= 0 ? '#16a34a' : '#ef4444',
                        },
                      ]}
                    >
                      {stats.totalCollected} DH
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Reste</Text>
                    <Text
                      style={[
                        styles.statValue,
                        {
                          color: stats.remaining > 0 ? '#ef4444' : '#16a34a',
                        },
                      ]}
                    >
                      {stats.remaining} DH
                    </Text>
                  </View>
                </View>

                {/* Toggle joueurs */}
                <TouchableOpacity
                  style={styles.toggleButton}
                  onPress={() =>
                    setExpandedMatch(isExpanded ? null : match._id)
                  }
                  disabled={loading}
                >
                  <Text style={styles.toggleButtonText}>
                    {isExpanded ? '▼' : '▶'} Gérer les joueurs (
                    {stats.playersPresent} présents / {stats.playersPaid}{' '}
                    payés)
                  </Text>
                </TouchableOpacity>

                {/* Liste joueurs */}
                {isExpanded && (
                  <View style={styles.playersList}>
                    <View style={styles.tableHeader}>
                      <Text style={[styles.tableHeaderText, { flex: 2 }]}>
                        Joueur
                      </Text>
                      <Text style={styles.tableHeaderText}>Présent</Text>
                      <Text style={styles.tableHeaderText}>Payé</Text>
                      <Text style={styles.tableHeaderText}>Montant</Text>
                    </View>

                    {match.feuilleDeMatch?.map((j, index) => {
                      const playerInfo = getPlayerInfo(j.joueurId);

                      return (
                        <View
                          key={playerInfo.id || `player-${index}`}
                          style={styles.playerRow}
                        >
                          {/* Nom */}
                          <Text style={[styles.playerName, { flex: 2 }]}>
                            {playerInfo.name}
                          </Text>

                          {/* Présence */}
                          <TouchableOpacity
                            style={[
                              styles.presenceBtn,
                              j.present && styles.presenceBtnActive,
                            ]}
                            onPress={() =>
                              playerInfo.id &&
                              togglePresence(match._id, playerInfo.id)
                            }
                            disabled={loading || !playerInfo.id}
                          >
                            <Ionicons
                              name={j.present ? 'checkmark' : 'close'}
                              size={18}
                              color={j.present ? '#fff' : '#999'}
                            />
                          </TouchableOpacity>

                          {/* Paiement */}
                          <TouchableOpacity
                            style={[
                              styles.payBtn,
                              j.paye && styles.payBtnActive,
                            ]}
                            onPress={() =>
                              playerInfo.id &&
                              togglePaye(match._id, playerInfo.id)
                            }
                            disabled={
                              loading || !j.present || !playerInfo.id
                            }
                          >
                            <Ionicons
                              name={
                                j.paye
                                  ? 'checkmark-circle'
                                  : 'ellipse-outline'
                              }
                              size={20}
                              color={j.paye ? '#16a34a' : '#ccc'}
                            />
                          </TouchableOpacity>

                          {/* Montant */}
                          <TextInput
                            style={styles.amountInput}
                            keyboardType="numeric"
                            value={String(j.montantPaye ?? 0)}
                            onChangeText={text =>
                              playerInfo.id &&
                              updatePaymentAmount(
                                match._id,
                                playerInfo.id,
                                text,
                              )
                            }
                            editable={
                              !loading && !!j.present && !!playerInfo.id
                            }
                          />
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Modal Match */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContentCentered}>
            {!locationMode && (
              <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
                <Text style={styles.modalTitle}>
                  {editingMatch ? 'Modifier le Match' : 'Nouveau Match'}
                </Text>

                {/* Date / heure */}
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                  disabled={loading}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color="#16a34a"
                  />
                  <Text style={styles.dateButtonText}>
                    {newMatch?.date && newMatch?.heure
                      ? `${newMatch.date} ${newMatch.heure}`
                      : 'Date & Heure'}
                  </Text>
                </TouchableOpacity>

                {(showDatePicker || showTimePicker) &&
                  Platform.OS === 'ios' && (
                    <View style={{ height: 250, marginBottom: 12 }}>
                      <DateTimePicker
                        value={tempDate}
                        mode={showDatePicker ? 'date' : 'time'}
                        display="spinner"
                        onChange={onDateTimeChange}
                        style={{ flex: 1 }}
                      />
                    </View>
                  )}

                {Platform.OS === 'android' &&
                  (showDatePicker || showTimePicker) && (
                    <DateTimePicker
                      value={tempDate}
                      mode={showDatePicker ? 'date' : 'time'}
                      onChange={onDateTimeChange}
                    />
                  )}

                {/* Terrain */}
                <TextInput
                  style={styles.input}
                  placeholder="Terrain"
                  value={newMatch.terrain}
                  onChangeText={t =>
                    setNewMatch(prev => ({
                      ...prev,
                      terrain: t,
                    }))
                  }
                />

                {/* Prix */}
                <TextInput
                  style={styles.input}
                  placeholder="Prix total terrain"
                  keyboardType="numeric"
                  value={newMatch.prixTotal}
                  onChangeText={t =>
                    setNewMatch(prev => ({
                      ...prev,
                      prixTotal: t,
                    }))
                  }
                />

                {/* Localisation */}
                <TouchableOpacity
                  style={styles.locationSelectButton}
                  onPress={() => setLocationMode(true)}
                >
                  <Ionicons
                    name="location-outline"
                    size={20}
                    color="#16a34a"
                  />
                  <Text style={styles.locationSelectText}>
                    {newMatch.location
                      ? '📍 Localisation sélectionnée ✓'
                      : 'Ajouter localisation (optionnel)'}
                  </Text>
                </TouchableOpacity>

                {/* Boutons */}
                <View style={styles.modalBtns}>
                  <TouchableOpacity
                    style={styles.btnCancel}
                    onPress={() => setShowModal(false)}
                  >
                    <Text>Annuler</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.btnSave}
                    onPress={handleCreateMatch}
                  >
                    <Text
                      style={{
                        color: '#fff',
                        fontWeight: 'bold',
                      }}
                    >
                      {editingMatch ? 'Modifier' : 'Créer'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}

            {locationMode && (
              <View>
                <Text style={styles.modalTitle}>
                  Ajouter une Localisation
                </Text>

                {currentLocation && (
                  <View style={styles.locationInfo}>
                    <Text>
                      📍 Lat:{' '}
                      {currentLocation.latitude.toFixed(5)}
                    </Text>
                    <Text>
                      📍 Lng:{' '}
                      {currentLocation.longitude.toFixed(5)}
                    </Text>
                  </View>
                )}

                <MapView
                  style={{
                    width: '100%',
                    height: 250,
                    borderRadius: 10,
                    marginVertical: 10,
                  }}
                  initialRegion={{
                    latitude: currentLocation
                      ? currentLocation.latitude
                      : 31.63,
                    longitude: currentLocation
                      ? currentLocation.longitude
                      : -8.0,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                >
                  {currentLocation && (
                    <Marker coordinate={currentLocation} />
                  )}
                </MapView>

                <TouchableOpacity
                  style={styles.getCurrentLocationBtn}
                  onPress={getCurrentLocation}
                >
                  <Ionicons
                    name="navigate-circle-outline"
                    size={24}
                    color="#fff"
                  />
                  <Text style={styles.getCurrentLocationText}>
                    Obtenir ma position actuelle
                  </Text>
                </TouchableOpacity>

                {newMatch.location && (
                  <TouchableOpacity
                    style={styles.removeLocationBtn}
                    onPress={() => {
                      setNewMatch(prev => ({
                        ...prev,
                        location: null,
                      }));
                      setCurrentLocation(null);
                    }}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color="#ef4444"
                    />
                    <Text style={styles.removeLocationText}>
                      Supprimer la localisation
                    </Text>
                  </TouchableOpacity>
                )}

                <View style={styles.modalBtns}>
                  <TouchableOpacity
                    style={styles.btnCancel}
                    onPress={() => setLocationMode(false)}
                  >
                    <Text>Retour</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// =============== HELPERS ===============

function validateDate(str) {
  // format YYYY-MM-DD très simple
  return /^\d{4}-\d{2}-\d{2}$/.test(str);
}

function validateTime(str) {
  // format HH:MM 24h
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(str);
}

// =============== STYLES ===============

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
    padding: 15,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerButtons: {
    flexDirection: 'row',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  btnNew: {
    backgroundColor: '#16a34a',
    padding: 10,
    borderRadius: 8,
  },
  btnNewText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  statsCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
    elevation: 2,
  },
  statsLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  statsValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: 48,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#ffffffff',
    borderRadius: 15,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 3,
  },
  cardHeader: {
    backgroundColor: '#16a34a',
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderActions: {
    flexDirection: 'row',
  },
  matchTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  matchInfos: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    marginTop: 2,
  },
  locationActions: {
    flexDirection: 'row',
    marginTop: 6,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  locationButtonText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  toggleButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
  },
  toggleButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  playersList: {
    padding: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 6,
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6b7280',
    textAlign: 'center',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  playerName: {
    fontSize: 13,
    color: '#111827',
  },
  presenceBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    backgroundColor: '#fff',
  },
  presenceBtnActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  payBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    backgroundColor: '#fff',
  },
  payBtnActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  amountInput: {
    width: 60,
    height: 32,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 6,
    fontSize: 12,
    textAlign: 'center',
    marginLeft: 4,
  },

  // MODAL CENTERED
  modalContainer: {
    flex: 1,
    justifyContent: 'center', // centré vertical
    alignItems: 'center', // centré horizontal
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContentCentered: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#16a34a',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12,
    backgroundColor: '#ffffffff',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginBottom: 12,
    backgroundColor: '#ffffffff',
  },
  dateButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#374151',
  },
  locationSelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginBottom: 12,
    backgroundColor: '#ecfdf5',
  },
  locationSelectText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#065f46',
    fontWeight: '500',
  },
  modalBtns: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  btnCancel: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginRight: 8,
    backgroundColor: '#e5e7eb',
  },
  btnSave: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#16a34a',
  },

  // Location part in modal
  locationInfo: {
    marginBottom: 10,
  },
  getCurrentLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginTop: 10,
  },
  getCurrentLocationText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
  },
  removeLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  removeLocationText: {
    marginLeft: 6,
    color: '#ef4444',
  },
});
