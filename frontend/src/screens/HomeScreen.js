import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import client from "../api/client";
import MoroccanBackground from './MoroccanBackground';

const CITATIONS = [
  "Li bgha l3ssel, yasber l'9riss n7el ! 🐝",
  "Match bla 3raq machi match ! ⚽",
  "L'arbitre huwa moul ballon ! 🕴️",
  "Dirni f'balek, nji 9balek ! 🔥",
  "Sir tmarki, matb9ach t'dribbli ! 🥅",
];

export default function HomeScreen({ navigation }) {
  const [caisse, setCaisse] = useState(0);
  const [prochainMatch, setProchainMatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const isFocused = useIsFocused();
  const [citation, setCitation] = useState("");

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await client.get("/api/dashboard");
      if (res.data.success) {
        setCaisse(res.data.totalCaisse || 0);
        setProchainMatch(res.data.prochainMatch);
      }
    } catch (error) {
      console.log("Erreur dashboard:", error.response?.data || error);
    } finally {
      setLoading(false);
    }
  };

  // TODO: adapte cette fonction à ta logique d'auth (AsyncStorage, contexte, etc.)
  const handleLogout = async () => {
    try {
      // exemple : await AsyncStorage.removeItem("token");
      // éventuellement appeler ton API /logout
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    } catch (e) {
      console.log("Erreur logout:", e);
    }
  };

  const goToProfile = () => {
    navigation.navigate("Profile"); // assure-toi que l'écran existe dans ton navigator
  };

  useEffect(() => {
    const random =
      CITATIONS[Math.floor(Math.random() * CITATIONS.length)];
    setCitation(random);
    if (isFocused) fetchDashboardData();
  }, [isFocused]);

  return (
    
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={fetchDashboardData}
        />
      }
    >
      <MoroccanBackground />
      {/* HEADER AVEC LOGO + PROFIL */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Image
            source={require("../../assets/image.jpeg")}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.headerTextContainer}>
            <Text style={styles.appName}>Yallah Nl3bo</Text>
            <Text style={styles.subtitle}>Bonjour l'équipe !</Text>
          </View>
        </View>

        <View style={styles.quoteContainer}>
          <Text style={styles.quoteText}>"{citation}"</Text>
        </View>
      </View>

      {/* CARTE CAISSE */}
      <LinearGradient
        colors={["#2ecc71", "#27ae60"]}
        style={styles.card}
      >
        <View style={styles.cardHeader}>
          <Ionicons name="wallet" size={30} color="#fff" />
          <Text style={styles.cardTitle}>La Caisse</Text>
        </View>
        <Text style={styles.bigAmount}>{caisse} DH</Text>
        <Text style={styles.cardFooter}>
          Total récolté pour le terrain
        </Text>
      </LinearGradient>

      {/* CARTE PROCHAIN MATCH */}
      <View style={[styles.card, { backgroundColor: "#34495e" }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="calendar" size={30} color="#fff" />
          <Text style={styles.cardTitle}>Prochain Match</Text>
        </View>
        {prochainMatch ? (
          <View>
            <Text style={styles.matchInfo}>
              📅 {prochainMatch.date} à {prochainMatch.heure}
            </Text>
            <Text style={styles.matchInfo}>
              📍 {prochainMatch.terrain}
            </Text>
            <Text style={styles.matchInfo}>
              👥 {prochainMatch.feuilleDeMatch?.length || 0} Inscrits
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate("Match")}
            >
              <Text style={styles.buttonText}>Voir détails</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.noMatch}>
            Pas encore de match prévu.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f5f7fa", // fond doux
    padding: 20,
  },
  header: {
    marginBottom: 25,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "#16a34a",
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  appName: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#16a34a",
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    marginTop: 3,
  },

  profileContainer: {
    flexDirection: "column",
    alignItems: "flex-end",
  },
  profileButton: {
    marginBottom: 6,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e74c3c",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  logoutText: {
    color: "#fff",
    marginLeft: 5,
    fontWeight: "600",
    fontSize: 12,
  },

  quoteContainer: {
    marginTop: 15,
    backgroundColor: "#fff9e5",
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 5,
    borderLeftColor: "#f1c40f",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  quoteText: {
    fontStyle: "italic",
    color: "#856404",
    fontSize: 16,
    textAlign: "center",
  },

  card: {
    borderRadius: 22,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 10,
  },
  bigAmount: {
    color: "#fff",
    fontSize: 42,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 10,
  },
  cardFooter: {
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    fontSize: 14,
  },
  matchInfo: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 5,
  },
  noMatch: {
    color: "#ccc",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 10,
  },
  button: {
    backgroundColor: "#16a34a",
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
