import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ImageBackground, Share, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import client from '../api/client';

export default function TechkilaScreen() {
  const [joueurs, setJoueurs] = useState([]);
  const [teamA, setTeamA] = useState([]);
  const [teamB, setTeamB] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const terrainRef = useRef();
  const isFocused = useIsFocused();

  // --- Récupération des joueurs ---
  const fetchJoueurs = async () => {
    setLoading(true);
    try {
      const response = await client.get('/api/players');
      if (response.data.success) {
        const data = response.data.players.map(p => ({
          id: p._id,
          nom: p.name || "Sans Nom",
          position: p.position || "ATT",
          note: Number(p.note) || 3,
        }));
        setJoueurs(data);
      }
      setTeamA([]);
      setTeamB([]);
    } catch (error) {
      Alert.alert("Erreur", "Impossible de charger les joueurs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) fetchJoueurs();
  }, [isFocused]);

  // --- ZHER : mélange aléatoire ---
  const genererZher = () => {
    if (joueurs.length < 2) return Alert.alert("Hops !", "Pas assez de joueurs !");
    const shuffled = [...joueurs].sort(() => Math.random() - 0.5);
    const mid = Math.ceil(shuffled.length / 2);
    setTeamA(shuffled.slice(0, mid));
    setTeamB(shuffled.slice(mid));
  };

  // --- MIZAN : équilibrer par étoiles ---
  const genererMizan = () => {
    if (joueurs.length < 2) return Alert.alert("Hops !", "Pas assez de joueurs !");

    const sorted = [...joueurs].sort((a, b) => b.note - a.note);
    let A = [], B = [];
    let sumA = 0, sumB = 0;

    sorted.forEach(j => {
      if (sumA <= sumB) {
        A.push(j);
        sumA += j.note;
      } else {
        B.push(j);
        sumB += j.note;
      }
    });

    setTeamA(A);
    setTeamB(B);
  };

  // --- PARTAGE IMAGE WHATSAPP ---
  const partagerWhatsApp = async () => {
    if (teamA.length === 0 || teamB.length === 0) {
      Alert.alert("Attention", "Veuillez d'abord générer les équipes !");
      return;
    }

    setSharing(true);
    try {
      // Capture du terrain en image
      const uri = await captureRef(terrainRef, {
        format: 'png',
        quality: 1,
      });

      // Vérifier si le partage est disponible
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert("Erreur", "Le partage n'est pas disponible sur cet appareil");
        setSharing(false);
        return;
      }

      // Créer un message d'accompagnement
      const date = new Date().toLocaleDateString('fr-FR');
      const message = `🔥 Yallah Nal3bo - MATCH DU ${date} 🔥\n💰 Cotisation : 30 DH / Tête\n⏳ Soyez à l'heure !`;

      // Partager l'image
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Partager les équipes',
        UTI: 'public.png'
      });

    } catch (error) {
      console.error('Erreur de partage:', error);
      Alert.alert("Erreur", "Impossible de partager l'image");
    } finally {
      setSharing(false);
    }
  };

  // --- CALCUL DES STATISTIQUES D'ÉQUIPE ---
  const calculateTeamStats = (team) => {
    if (team.length === 0) return { total: 0, moyenne: 0 };
    const total = team.reduce((sum, j) => sum + j.note, 0);
    return { total, moyenne: (total / team.length).toFixed(1) };
  };

  const statsA = calculateTeamStats(teamA);
  const statsB = calculateTeamStats(teamB);

  return (
    <View style={styles.mainContainer}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={styles.header}>
          <Text style={styles.title}>⚖️ Techkila</Text>
          <Text style={styles.subtitle}>
            {loading ? "Chargement..." : `${joueurs.length} joueurs dans le vestiaire`}
          </Text>
        </View>

        {/* Boutons de génération */}
        <View style={styles.btnGroup}>
          <TouchableOpacity style={[styles.btn, styles.btnZher]} onPress={genererZher}>
            <Ionicons name="dice" size={24} color="#fff" />
            <Text style={styles.btnText}>Zher (Hasard)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnMizan]} onPress={genererMizan}>
            <Ionicons name="stats-chart" size={24} color="#fff" />
            <Text style={styles.btnText}>Mizan (Équilibré)</Text>
          </TouchableOpacity>
        </View>

        {/* Terrain - Zone de capture */}
        {(teamA.length || teamB.length) > 0 && (
          <View style={styles.terrainWrapper}>
            <View ref={terrainRef} collapsable={false} style={styles.captureContainer}>
              <View style={styles.terrainContainer}>
                <ImageBackground 
                  source={require('../../assets/terrain.png')} 
                  style={styles.terrainBg}
                  imageStyle={styles.terrainImage}
                >
                  {/* En-tête avec date et titre */}
                  <View style={styles.matchHeader}>
                    <Text style={styles.matchTitle}>🔥 Yallah Nal3bo 🔥</Text>
                    <Text style={styles.matchDate}>
                      {new Date().toLocaleDateString('fr-FR', { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'long' 
                      })}
                    </Text>
                  </View>

                  {/* Team A */}
                  <View style={styles.halfTerrain}>
                    <View style={styles.teamHeaderContainer}>
                      <View style={[styles.teamBadge, { backgroundColor: '#e74c3c' }]}>
                        <Ionicons name="shield" size={20} color="#fff" />
                        <Text style={styles.teamBadgeText}>ÉQUIPE A</Text>
                      </View>
                      <View style={styles.statsBox}>
                        <Ionicons name="star" size={16} color="#ffd700" />
                        <Text style={styles.teamStats}>{statsA.moyenne}</Text>
                        <Text style={styles.teamStatsTotal}>({statsA.total} pts)</Text>
                      </View>
                    </View>
                    
                    <View style={styles.playersGrid}>
                      {teamA.map((j, i) => (
                        <View key={i} style={styles.playerCard}>
                          <View style={[styles.playerAvatar, { borderColor: '#e74c3c', backgroundColor: '#fff' }]}>
                            <Ionicons name="person" size={24} color="#e74c3c" />
                          </View>
                          <View style={styles.playerDetails}>
                            <Text style={styles.playerName}>{j.nom}</Text>
                            <View style={styles.playerMeta}>
                              <Text style={styles.playerPosition}>{j.position}</Text>
                              <View style={styles.starsRow}>
                                {[...Array(j.note)].map((_, idx) => (
                                  <Ionicons key={idx} name="star" size={10} color="#ffd700" />
                                ))}
                              </View>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Ligne médiane */}
                  <View style={styles.midLineContainer}>
                    <View style={styles.midLine} />
                    <View style={styles.centerCircle}>
                      <Ionicons name="football" size={20} color="#fff" />
                    </View>
                  </View>

                  {/* Team B */}
                  <View style={styles.halfTerrain}>
                    <View style={styles.playersGrid}>
                      {teamB.map((j, i) => (
                        <View key={i} style={styles.playerCard}>
                          <View style={[styles.playerAvatar, { borderColor: '#27ae60', backgroundColor: '#fff' }]}>
                            <Ionicons name="person" size={24} color="#27ae60" />
                          </View>
                          <View style={styles.playerDetails}>
                            <Text style={styles.playerName}>{j.nom}</Text>
                            <View style={styles.playerMeta}>
                              <Text style={styles.playerPosition}>{j.position}</Text>
                              <View style={styles.starsRow}>
                                {[...Array(j.note)].map((_, idx) => (
                                  <Ionicons key={idx} name="star" size={10} color="#ffd700" />
                                ))}
                              </View>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>

                    <View style={styles.teamHeaderContainer}>
                      <View style={[styles.teamBadge, { backgroundColor: '#27ae60' }]}>
                        <Ionicons name="shield" size={20} color="#fff" />
                        <Text style={styles.teamBadgeText}>ÉQUIPE B</Text>
                      </View>
                      <View style={styles.statsBox}>
                        <Ionicons name="star" size={16} color="#ffd700" />
                        <Text style={styles.teamStats}>{statsB.moyenne}</Text>
                        <Text style={styles.teamStatsTotal}>({statsB.total} pts)</Text>
                      </View>
                    </View>
                  </View>

                  {/* Footer avec infos */}
                  <View style={styles.matchFooter}>
                    <View style={styles.infoRow}>
                      <Ionicons name="cash" size={16} color="#ffd700" />
                      <Text style={styles.infoText}>30 DH / Tête</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Ionicons name="time" size={16} color="#ffd700" />
                      <Text style={styles.infoText}>Soyez à l'heure !</Text>
                    </View>
                  </View>
                </ImageBackground>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bouton flottant WhatsApp */}
      {teamA.length > 0 && (
        <View style={styles.floatingButtonContainer}>
          <TouchableOpacity 
            style={[styles.shareBtn, sharing && styles.shareBtnDisabled]} 
            onPress={partagerWhatsApp}
            activeOpacity={0.8}
            disabled={sharing}
          >
            {sharing ? (
              <>
                <Ionicons name="hourglass" size={24} color="#fff" />
                <Text style={styles.shareBtnText}>Préparation...</Text>
              </>
            ) : (
              <>
                <Ionicons name="logo-whatsapp" size={28} color="#fff" />
                <Text style={styles.shareBtnText}>Partager</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: { 
    flex: 1,
    padding: 20,
  },
  header: { 
    alignItems: 'center', 
    marginBottom: 20, 
    marginTop: 10 
  },
  title: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    color: '#2c3e50',
    marginBottom: 5,
    letterSpacing: 1
  },
  subtitle: { 
    color: '#7f8c8d',
    fontSize: 14,
    fontWeight: '600'
  },
  btnGroup: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 25,
    gap: 15
  },
  btn: { 
    flex: 1,
    padding: 16, 
    borderRadius: 15, 
    alignItems: 'center', 
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  btnZher: { 
    backgroundColor: '#f39c12',
  },
  btnMizan: { 
    backgroundColor: '#3498db',
  },
  btnText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    marginTop: 6,
    fontSize: 13
  },
  terrainWrapper: {
    marginBottom: 100,
  },
  captureContainer: {
    backgroundColor: '#fff',
  },
  terrainContainer: { 
    backgroundColor: '#1a472a',
    borderRadius: 20, 
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  terrainBg: { 
    width: '100%',
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  terrainImage: {
    opacity: 0.3,
  },
  matchHeader: {
    alignItems: 'center',
    paddingVertical: 15,
    marginBottom: 10,
  },
  matchTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  matchDate: {
    fontSize: 14,
    color: '#ecf0f1',
    marginTop: 5,
    textTransform: 'capitalize',
    fontWeight: '600',
  },
  halfTerrain: { 
    paddingVertical: 15,
  },
  teamHeaderContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  teamBadge: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    gap: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  teamBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
  statsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 15,
    gap: 5,
  },
  teamStats: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  teamStatsTotal: {
    color: '#ecf0f1',
    fontSize: 12,
    fontWeight: '600',
  },
  playersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 5,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 15,
    minWidth: 140,
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginRight: 10,
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 3,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  playerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playerPosition: {
    color: '#ecf0f1',
    fontSize: 11,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 1,
  },
  midLineContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  midLine: {
    height: 2,
    width: '85%',
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  centerCircle: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    marginTop: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 15,
    marginHorizontal: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(245,245,245,0.95)',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  shareBtn: {
    flexDirection: 'row',
    backgroundColor: '#25D366',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    gap: 12,
  },
  shareBtnDisabled: {
    backgroundColor: '#95a5a6',
  },
  shareBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 0.5,
  },
});