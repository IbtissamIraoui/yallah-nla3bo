import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ImageBackground, Linking, ActivityIndicator, Clipboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import client from '../api/client';

export default function TechkilaScreen() {
  const [joueurs, setJoueurs] = useState([]);
  const [teamA, setTeamA] = useState([]);
  const [teamB, setTeamB] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortType, setSortType] = useState('none'); // none | note | position | nom
  const isFocused = useIsFocused();

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
          favorite: false // nouveau champ
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

  // --- Toggle favori ---
  const toggleFavorite = (id) => {
    setJoueurs(prev => prev.map(j => j.id === id ? {...j, favorite: !j.favorite} : j));
  };

  // --- Tri dynamique ---
  const sortJoueurs = (type) => {
    let sorted = [...joueurs];
    if (type === 'note') sorted.sort((a,b) => b.note - a.note);
    if (type === 'position') sorted.sort((a,b) => a.position.localeCompare(b.position));
    if (type === 'nom') sorted.sort((a,b) => a.nom.localeCompare(b.nom));
    setSortType(type);
    setJoueurs(sorted);
  };

  // --- ZHER ---
  const genererZher = () => {
    if (joueurs.length < 2) return Alert.alert("Hops !", "Pas assez de joueurs !");
    const favorisA = joueurs.filter(j => j.favorite && j.favoriteTeam === 'A');
    const favorisB = joueurs.filter(j => j.favorite && j.favoriteTeam === 'B');
    const nonFavoris = joueurs.filter(j => !j.favorite);

    const shuffled = [...nonFavoris].sort(() => Math.random() - 0.5);
    const mid = Math.ceil(shuffled.length / 2);
    setTeamA([...favorisA, ...shuffled.slice(0, mid)]);
    setTeamB([...favorisB, ...shuffled.slice(mid)]);
  };

  // --- MIZAN ---
  const genererMizan = () => {
    if (joueurs.length < 2) return Alert.alert("Hops !", "Pas assez de joueurs !");
    const sorted = [...joueurs].sort((a,b) => b.note - a.note);
    let A = [], B = [], sumA = 0, sumB = 0;
    sorted.forEach(j => {
      if (sumA <= sumB) { A.push(j); sumA += j.note; } 
      else { B.push(j); sumB += j.note; }
    });
    setTeamA(A);
    setTeamB(B);
    checkBalance(A, B);
  };

  const checkBalance = (A, B) => {
    const sumA = A.reduce((acc,j)=> acc+j.note,0);
    const sumB = B.reduce((acc,j)=> acc+j.note,0);
    if (Math.abs(sumA - sumB) > 2) Alert.alert("Attention", "Équipes un peu déséquilibrées !");
  };

  const partagerWhatsApp = () => {
    if (!teamA.length || !teamB.length) return;
    const date = new Date().toLocaleDateString('fr-FR');
    let message = `🔥 *KORA TIME - MATCH DU ${date}* 🔥\n\n`;
    message += `🦁 *ÉQUIPE A*\n`;
    teamA.forEach(j => message += `🔹 ${j.nom} (${j.position}) ${"⭐".repeat(j.note)}\n`);
    message += `\n🦅 *ÉQUIPE B*\n`;
    teamB.forEach(j => message += `🔸 ${j.nom} (${j.position}) ${"⭐".repeat(j.note)}\n`);
    message += `\n💰 Cotisation : 30 DH / Tête\n⏳ Soyez à l'heure !`;

    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
    Linking.canOpenURL(url)
      .then(supported => supported ? Linking.openURL(url) : Alert.alert("Erreur", "WhatsApp non installé."));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.header}>
        <Text style={styles.title}>⚖️ Techkila</Text>
        <Text style={{ color: '#666' }}>{loading ? "Chargement..." : `${joueurs.length} joueurs dans le vestiaire`}</Text>
        {loading && <ActivityIndicator size="small" color="#3498db" style={{ marginTop: 5 }} />}
      </View>

      {/* Tri joueurs */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 }}>
        <TouchableOpacity onPress={() => sortJoueurs('note')}><Text>⭐ Note</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => sortJoueurs('position')}><Text>📍 Position</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => sortJoueurs('nom')}><Text>🅰️ Nom</Text></TouchableOpacity>
      </View>

      {/* Liste joueurs */}
      <ScrollView horizontal style={{ marginBottom: 20 }}>
        {joueurs.map(j => (
          <TouchableOpacity key={j.id} style={{ padding: 8, margin: 5, borderWidth: 1, borderColor: j.favorite ? 'gold' : '#ccc', borderRadius: 5 }} onPress={() => toggleFavorite(j.id)}>
            <Text>{j.nom} ({j.position}) ⭐{j.note}</Text>
            {j.favorite && <Text style={{ color: 'gold' }}>❤️</Text>}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Boutons génération équipes */}
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

      {/* Terrain et équipes */}
      {(teamA.length || teamB.length) > 0 && (
        <View style={styles.terrainContainer}>
          <ImageBackground source={require('../../assets/terrain.png')} style={styles.terrainBg}>
            <View style={styles.halfTerrain}>
              <Text style={[styles.teamBadge, { backgroundColor: '#c0392b' }]}>🔴 ÉQUIPE A</Text>
              <View style={styles.playersRow}>{teamA.map((j,i)=>(<View key={i} style={styles.playerToken}><Text>{j.nom}</Text></View>))}</View>
            </View>
            <View style={styles.midLine} />
            <View style={styles.halfTerrain}>
              <Text style={[styles.teamBadge, { backgroundColor: '#2ecc71' }]}>🟢 ÉQUIPE B</Text>
              <View style={styles.playersRow}>{teamB.map((j,i)=>(<View key={i} style={styles.playerToken}><Text>{j.nom}</Text></View>))}</View>
            </View>
          </ImageBackground>
        </View>
      )}

      {/* Partage */}
      {teamA.length > 0 && (
        <TouchableOpacity style={styles.shareBtn} onPress={partagerWhatsApp}>
          <Ionicons name="logo-whatsapp" size={24} color="#fff" style={{ marginRight: 10 }} />
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Partager sur WhatsApp</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}
