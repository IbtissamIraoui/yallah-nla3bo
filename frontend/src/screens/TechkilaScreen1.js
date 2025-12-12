import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ImageBackground, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import client from '../api/client';

export default function TechkilaScreen() {
  const [joueurs, setJoueurs] = useState([]);
  const [teamA, setTeamA] = useState([]);
  const [teamB, setTeamB] = useState([]);
  const [loading, setLoading] = useState(false);
  const isFocused = useIsFocused();

  const fetchJoueurs = async () => {
    setLoading(true);
    try {
      const response = await client.get('/api/players');
      if (response.data.success) {
        const data = response.data.players.map(p => ({
          ...p,
          nom: p.name,
          position: p.position || 'ATT',
          note: p.note || 3
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

  const genererZher = () => {
    if (joueurs.length < 2) return Alert.alert("Hops !", "Pas assez de joueurs !");
    let shuffled = [...joueurs].sort(() => Math.random() - 0.5);
    const mid = Math.ceil(shuffled.length / 2);
    setTeamA(shuffled.slice(0, mid));
    setTeamB(shuffled.slice(mid));
  };

  const genererMizan = () => {
    if (joueurs.length < 2) return Alert.alert("Hops !", "Pas assez de joueurs !");
    let sorted = [...joueurs].sort((a, b) => (b.note || 3) - (a.note || 3));
    let A = [], B = [];
    sorted.forEach((j, i) => (i % 2 === 0 ? A.push(j) : B.push(j)));
    setTeamA(A);
    setTeamB(B);
  };

  // --- FONCTION WHATSAPP ---
  const partagerWhatsApp = () => {
    const date = new Date().toLocaleDateString('fr-FR');
    
    let message = `🔥 *KORA TIME - MATCH DU ${date}* 🔥\n`;

    message += `🦁 *L'ÉQUIPE A (Les Lions)*\n`;
    // j.nom marchera grâce à l'adaptation dans fetchJoueurs
    teamA.forEach(j => message += `🔹 ${j.nom} (${j.position || '?'}) ${"⭐".repeat(j.note || 1)}\n`);

    message += `\n🦅 *L'ÉQUIPE B (Les Aigles)*\n`;
    teamB.forEach(j => message += `🔸 ${j.nom} (${j.position || '?'}) ${"⭐".repeat(j.note || 1)}\n`);

    message += `\n💰 *Cotisation : 30 DH / Tête*`;
    message += `\n⏳ *Soyez à l'heure, li bta ichri lma !*`;

    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        return Linking.openURL(url);
      } else {
        Alert.alert("Erreur", "Installi WhatsApp a sahbi !");
      }
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.header}>
        <Text style={styles.title}>⚖️ Techkila</Text>
        <Text style={{color: '#666'}}>
          {loading ? "Chargement..." : `${joueurs.length} joueurs dans le vestiaire`}
        </Text>
      </View>

      <View style={styles.btnGroup}>
        <TouchableOpacity style={[styles.btn, styles.btnZher]} onPress={genererZher}>
          <Ionicons name="dice" size={24} color="#fff" />
          <Text style={styles.btnText}>Zher (Hasard)</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.btn, styles.btnMizan]} onPress={genererMizan}>
          <Ionicons name="stats-chart" size={24} color="#fff" />
          <Text style={styles.btnText}>Mizan (Niveau)</Text>
        </TouchableOpacity>
      </View>

      {/* VISUALISATION TERRAIN */}
      {(teamA.length > 0 || teamB.length > 0) && (
        <View style={styles.terrainContainer}>
            <ImageBackground source={require('../../assets/terrain.png')} style={styles.terrainBg}> 
            
            <View style={styles.halfTerrain}>
                <Text style={[styles.teamBadge, {backgroundColor: '#c0392b'}]}>🔴 ÉQUIPE A</Text>
                <View style={styles.playersRow}>
                    {teamA.map((j, i) => (
                        <View key={i} style={styles.playerToken}>
                            <View style={[styles.tokenCircle, {borderColor: '#c0392b'}]}>
                                <Text style={styles.tokenText}>{j.position ? j.position.substring(0,1) : '?'}</Text>
                            </View>
                            <Text style={styles.tokenName}>{j.nom}</Text>
                        </View>
                    ))}
                </View>
            </View>

            <View style={styles.midLine} />

            <View style={styles.halfTerrain}>
              <View style={styles.playersRow}>
              {teamB.map((j, i) => (
                <View key={i} style={styles.playerToken}>
                  <View style={[styles.tokenCircle, {borderColor: '#2ecc71'}]}>
                    <Text style={styles.tokenText}>{j.position.charAt(0)}</Text>
                  </View>
                  <Text style={styles.tokenName}>{j.nom}</Text>
                </View>
              ))}
              <Text style={[styles.teamBadge, {backgroundColor: '#2ecc71'}]}>🟢 ÉQUIPE B</Text>
            </View>
            </View>
            </ImageBackground>
        </View>
      )}

      {/* BOUTON WHATSAPP */}
      {(teamA.length > 0) && (
        <TouchableOpacity style={styles.shareBtn} onPress={partagerWhatsApp}>
          <Ionicons name="logo-whatsapp" size={24} color="#fff" style={{marginRight:10}} />
          <Text style={{color:'#fff', fontWeight:'bold', fontSize: 16}}>Partager sur WhatsApp</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  header: { alignItems: 'center', marginBottom: 20, marginTop:10 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  subtitle: { color: '#666', marginTop: 5 },
  btnGroup: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  btn: { flex: 0.48, padding: 15, borderRadius: 10, alignItems: 'center', justifyContent: 'center', elevation: 3 },
  btnZher: { backgroundColor: '#f39c12' },
  btnMizan: { backgroundColor: '#3498db' },
  btnText: { color: '#fff', fontWeight: 'bold', marginTop: 5 },
  terrainContainer: { backgroundColor: '#2c3e50', borderRadius: 15, overflow: 'hidden', elevation: 5, marginBottom: 20, minHeight: 400, justifyContent: 'space-between', paddingBottom: 30 },
  terrainBg: { width: '100%', height: '100%', justifyContent: 'space-between', paddingVertical: 20 },
  halfTerrain: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingVertical: 10 },
  midLine: { height: 2, backgroundColor: 'rgba(255,255,255,0.3)', width: '90%', alignSelf: 'center' },
  teamBadge: { color: 'white', fontWeight: 'bold', padding: 5, borderRadius: 5, marginBottom: 10, marginTop: 10 },
  playersRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  playerToken: { alignItems: 'center', margin: 8 },
  tokenCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 3 },
  tokenText: { fontWeight: 'bold', color: '#333' },
  tokenName: { color: 'white', fontSize: 12, fontWeight: 'bold', marginTop: 4, textShadowColor: 'black', textShadowRadius: 3 },
  shareBtn: { flexDirection: 'row', backgroundColor: '#25D366', padding: 15, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginBottom: 30, elevation: 5 },
  shareText: { color: '#fff', fontWeight: 'bold', fontSize: 18, marginLeft: 10 },
});