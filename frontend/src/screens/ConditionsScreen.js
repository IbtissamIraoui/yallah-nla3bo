// src/screens/ConditionsScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MoroccanBackground from './MoroccanBackground';

export default function ConditionsScreen() {
  const [conditions, setConditions] = useState([
    {
      id: '1',
      titre: 'Respect & Fair‑play',
      texte:
        "- Respect entre tous les joueurs, pas d’insultes ni de gestes agressifs.\n" +
        "- Les décisions de l’organisateur ou du capitaine sont à respecter.\n" +
        "- Garder une bonne ambiance avant, pendant et après le match.",
    },
    {
      id: '2',
      titre: 'Organisation du match',
      texte:
        "- Arrivée au terrain au moins 10 minutes avant le coup d’envoi.\n" +
        "- Prévenir le groupe en cas de retard ou d’absence.\n" +
        "- Respect du temps de jeu pour que tout le monde participe.",
    },
    {
      id: '3',
      titre: 'Cotisation & Matériel',
      texte:
        "- Cotisation fixe par joueur (terrain, ballons, eau…).\n" +
        "- Prévoir tenue de sport adaptée et chaussures correctes.\n" +
        "- Prendre soin du matériel collectif (ballons, chasubles).",
    },
    {
      id: '4',
      titre: 'Santé & Sécurité',
      texte:
        "- Chaque joueur est responsable de sa condition physique.\n" +
        "- Signaler toute blessure ou malaise pendant le match.\n" +
        "- Jeu dangereux interdit (tacles par derrière, coups volontaires, etc.).",
    },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null); // null => ajout, sinon id à modifier
  const [titreInput, setTitreInput] = useState('');
  const [texteInput, setTexteInput] = useState('');

  const openAddModal = () => {
    setEditingId(null);
    setTitreInput('');
    setTexteInput('');
    setModalVisible(true);
  };

  const openEditModal = (condition) => {
    setEditingId(condition.id);
    setTitreInput(condition.titre);
    setTexteInput(condition.texte);
    setModalVisible(true);
  };

  const saveCondition = () => {
    if (!titreInput.trim() || !texteInput.trim()) {
      return Alert.alert('Attention', 'Titre et texte sont obligatoires.');
    }

    if (editingId === null) {
      // Ajout
      const newCond = {
        id: Date.now().toString(),
        titre: titreInput.trim(),
        texte: texteInput.trim(),
      };
      setConditions((prev) => [...prev, newCond]);
    } else {
      // Modification
      setConditions((prev) =>
        prev.map((c) =>
          c.id === editingId
            ? { ...c, titre: titreInput.trim(), texte: texteInput.trim() }
            : c
        )
      );
    }

    setModalVisible(false);
  };

  const handleAccept = () => {
    Alert.alert('Merci', 'Tu as accepté les conditions de jeu.');
  };

  return (
    <View style={styles.outer}>
      <MoroccanBackground />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View style={styles.header}>
          <Text style={styles.title}>📜 Conditions de jeu</Text>
          <Text style={styles.subtitle}>Lis, ajoute ou modifie les règles du match</Text>
        </View>

        {conditions.map((cond) => (
          <View key={cond.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.sectionTitle}>{cond.titre}</Text>
              <TouchableOpacity
                style={styles.editIconBtn}
                onPress={() => openEditModal(cond)}
              >
                <Ionicons name="create-outline" size={20} color="#c0392b" />
              </TouchableOpacity>
            </View>
            <Text style={styles.text}>{cond.texte}</Text>
          </View>
        ))}

        <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
          <Ionicons name="add-circle" size={22} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.addBtnText}>Ajouter une condition</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.primaryBtn} onPress={handleAccept}>
          <Ionicons name="checkmark-circle" size={22} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.primaryBtnText}>J’ai lu et j’accepte</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal d’ajout / édition */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editingId ? 'Modifier la condition' : 'Nouvelle condition'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Titre de la condition"
              value={titreInput}
              onChangeText={setTitreInput}
            />
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Texte de la condition"
              value={texteInput}
              onChangeText={setTexteInput}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#bdc3c7' }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#27ae60' }]}
                onPress={saveCondition}
              >
                <Text style={[styles.modalBtnText, { color: '#fff' }]}>
                  Enregistrer
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
  outer: { flex: 1, backgroundColor: '#f5f5f5' },
  container: { flex: 1, padding: 20 },
  header: { alignItems: 'center', marginBottom: 20, marginTop: 10 },
  title: { fontSize: 24, fontFamily: 'Poppins-Bold', color: '#333' },
  subtitle: { marginTop: 4, color: '#666', fontFamily: 'Poppins-Regular' },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#c0392b',
    flex: 1,
    marginRight: 8,
  },
  editIconBtn: {
    padding: 4,
  },
  text: {
    color: '#444',
    lineHeight: 20,
    fontFamily: 'Poppins-Regular',
  },
  addBtn: {
    marginTop: 5,
    marginBottom: 10,
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#fff',
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
  },
  primaryBtn: {
    backgroundColor: '#27ae60',
    padding: 15,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 5,
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginLeft: 8,
  },
  modalBtnText: {
    fontFamily: 'Poppins-Bold',
    color: '#2c3e50',
  },
});