import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity, Modal, Alert, ActivityIndicator,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import client from '../api/client';
import MoroccanBackground from './MoroccanBackground';



const COLORS = {
  background: '#ffffffff',
  card: '#b92d32ff',
  accent: '#006233',
  gold: '#D4AF37',
  textLight: '#FFFFFF',
};

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + (parts[1]?.charAt(0) || '')).toUpperCase();
}

function getPositionBadgeStyle(position) {
  switch (position?.toUpperCase()) {
    case 'GK': case 'GARDIEN': return { backgroundColor: COLORS.accent };
    case 'DEF': case 'DÉFENSE': return { backgroundColor: COLORS.gold };
    case 'ATT': case 'ATTAQUE': return { backgroundColor: '#8B0000' };
    
    default: return { backgroundColor: '#555' };
  }
}

export default function VestiaireScreen() {
  const [players, setPlayers] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingPlayer, setEditingPlayer] = useState(null);

  const [nickname, setNickname] = useState('');
  const [position, setPosition] = useState('ATT');
  const [skill, setSkill] = useState('3');
  const [traits, setTraits] = useState('');

  const isFocused = useIsFocused();

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const response = await client.get('/api/players');
      if (response.data.success) {
        const formatted = response.data.players.map(p => ({
          id: p._id,
          nickname: p.name,
          position: p.position || 'ATT',
          skill: p.note || 3,
          traits: p.traits || '',
        }));
        setPlayers(formatted);
      }
    } catch (error) {
      console.error('Erreur Vestiaire:', error);
      Alert.alert("Erreur", "Impossible de charger le vestiaire");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) fetchPlayers();
  }, [isFocused]);

  const filteredPlayers = players
    .filter(p => p.nickname.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.skill - a.skill);

  const openEditModal = (player) => {
    setEditingPlayer(player);
    setNickname(player.nickname);
    setPosition(player.position);
    setSkill(String(player.skill));
    setTraits(player.traits);
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditingPlayer(null);
    setNickname('');
    setPosition('ATT');
    setSkill('3');
    setTraits('');
    setShowModal(true);
  };

  const handleSavePlayer = async () => {
    if (!nickname.trim()) return Alert.alert('Erreur', 'Le surnom est obligatoire');

    try {
      if (editingPlayer) {
        // Mise à jour
        await client.put(`/api/players/${editingPlayer.id}`, {
          name: nickname,
          position: position,
          note: Number(skill),
          traits: traits
        });
        Alert.alert('Succès', 'Joueur modifié !');
      } else {
        // Ajout
        await client.post('/api/players', {
          name: nickname,
          position: position,
          note: Number(skill),
          traits: traits
        });
        Alert.alert('Succès', 'Joueur ajouté au vestiaire !');
      }
      setShowModal(false);
      fetchPlayers();
      setNickname(''); setPosition('ATT'); setSkill('3'); setTraits('');
      setEditingPlayer(null);
    } catch (error) {
      Alert.alert('Erreur', editingPlayer ? 'Impossible de modifier le joueur' : 'Impossible dajouter le joueur');
    }
  };

  const deletePlayer = async (id) => {
    Alert.alert('Supprimer ?', 'Tu vas virer ce joueur du vestiaire !', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Virer', style: 'destructive', onPress: async () => {
          try {
            await client.delete(`/api/players/${id}`);
            fetchPlayers();
          } catch (error) {
            Alert.alert('Erreur', 'Suppression échouée');
          }
        }
      },
    ]);
  };

  const renderItem = ({ item }) => {
    const initials = getInitials(item.nickname);
    const badgeStyle = getPositionBadgeStyle(item.position);

    return (
      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.cardHeader}>
              <Text style={styles.name}>{item.nickname}</Text>
              <Text style={styles.level}>⭐ {item.skill}/5</Text>
            </View>
            <View style={styles.badgeRow}>
              <View style={[styles.positionBadge, badgeStyle]}>
                <Text style={styles.positionBadgeText}>{item.position}</Text>
              </View>
            </View>
            {item.traits ? <Text style={styles.traits}>Profil : {item.traits}</Text> : null}
          </View>
        </View>
        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]} 
            onPress={() => openEditModal(item)}
          >
            <Text style={styles.actionText}>Modifier</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]} 
            onPress={() => deletePlayer(item.id)}
          >
            <Text style={styles.actionText}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) return (
    <View style={[styles.container, {justifyContent:'center'}]}>
      <MoroccanBackground />
      <ActivityIndicator size="large" color={COLORS.gold}/>
    </View>
  );

  return (
    <View style={styles.container}>
      <MoroccanBackground />
      <Text style={styles.title}>Vestiaire Kora Time</Text>
      <TextInput 
        style={styles.search} 
        placeholder="Chercher un joueur..." 
        placeholderTextColor="#aaa" 
        value={search} 
        onChangeText={setSearch} 
      />

      <FlatList
        data={filteredPlayers}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>Vestiaire vide, ajoute des joueurs !</Text>}
      />

      <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
        <Text style={styles.addButtonText}>+ Ajouter un joueur</Text>
      </TouchableOpacity>

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingPlayer ? 'Modifier le Joueur' : 'Nouveau Joueur'}
            </Text>
            <TextInput 
              style={styles.input} 
              placeholder="Surnom (ex: Ronaldo, CR7)" 
              value={nickname} 
              onChangeText={setNickname} 
            />
            
            <Text style={styles.inputLabel}>Poste :</Text>
            <View style={styles.positionButtons}>
              {['GK', 'DEF', 'ATT'].map(pos => (
                <TouchableOpacity
                  key={pos}
                  style={[styles.positionBtn, position === pos && styles.positionBtnActive]}
                  onPress={() => setPosition(pos)}
                >
                  <Text style={[styles.positionBtnText, position === pos && {color: '#fff'}]}>{pos}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput 
              style={styles.input} 
              placeholder="Niveau (1 à 5)" 
              keyboardType="numeric" 
              value={skill} 
              onChangeText={setSkill} 
            />
            <TextInput 
              style={styles.input} 
              placeholder="Trait spécial (ex: Dribbleur fou)" 
              value={traits} 
              onChangeText={setTraits} 
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => {
                  setShowModal(false);
                  setEditingPlayer(null);
                }}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={handleSavePlayer}
              >
                <Text style={styles.modalButtonText}>
                  {editingPlayer ? 'Modifier' : 'Ajouter'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: COLORS.background },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: COLORS.card, 
    marginBottom: 16, 
    textAlign: 'center',
    textShadowColor: 'rgba(185, 45, 50, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  search: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 8, 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  card: { 
    backgroundColor: COLORS.card, 
    padding: 12, 
    borderRadius: 10, 
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTopRow: { flexDirection: 'row' },
  avatarContainer: { marginRight: 10, justifyContent: 'center' },
  avatarCircle: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: COLORS.gold, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarText: { color: COLORS.background, fontWeight: 'bold', fontSize: 18 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  name: { fontSize: 18, fontWeight: '700', color: COLORS.textLight },
  level: { color: COLORS.gold, fontWeight: 'bold' },
  badgeRow: { flexDirection: 'row', marginBottom: 2 },
  positionBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  positionBadgeText: { color: COLORS.textLight, fontWeight: '600', fontSize: 12 },
  traits: { color: '#FDEBD0', marginTop: 2, fontSize: 13 },
  empty: { color: '#999', textAlign: 'center', marginTop: 20, fontSize: 16 },
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, columnGap: 8 },
  actionButton: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  editButton: { backgroundColor: COLORS.accent },
  deleteButton: { backgroundColor: '#8B0000' },
  actionText: { color: COLORS.textLight, fontWeight: 'bold', fontSize: 12 },
  addButton: { 
    backgroundColor: COLORS.card, 
    paddingVertical: 14, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginTop: 8,
    elevation: 4,
    shadowColor: COLORS.card,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  addButtonText: { color: COLORS.textLight, fontSize: 16, fontWeight: 'bold' },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    padding: 20 
  },
  modalContent: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 20,
    elevation: 5,
  },
  modalTitle: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginBottom: 16,
    color: COLORS.card,
    textAlign: 'center',
  },
  inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#333' },
  positionButtons: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  positionBtn: { 
    flex: 1, 
    padding: 10, 
    backgroundColor: '#f0f0f0', 
    borderRadius: 8, 
    alignItems: 'center', 
    marginHorizontal: 4 
  },
  positionBtnActive: { backgroundColor: COLORS.accent },
  positionBtnText: { color: '#333', fontWeight: '600' },
  input: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 8, 
    paddingHorizontal: 12, 
    paddingVertical: 10, 
    marginBottom: 12,
    fontSize: 15,
  },
  modalButtonsRow: { flexDirection: 'row', justifyContent: 'flex-end', columnGap: 10, marginTop: 8 },
  modalButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  cancelButton: { backgroundColor: '#aaa' },
  saveButton: { backgroundColor: COLORS.accent },
  modalButtonText: { color: COLORS.textLight, fontWeight: 'bold', fontSize: 15 },
});