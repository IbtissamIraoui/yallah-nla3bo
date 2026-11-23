import React, { useState, useEffect, useCallback } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Écrans ───────────────────────────────────────────────────
import LoginScreen from "./src/screens/LoginScreen";
import Loader from "./src/components/Loader";
import client from "./src/api/client";

// Mode Joueur
import NearbyMatchesScreen from "./src/screens/NearbyMatchesScreen";
import MatchDetailScreen from "./src/screens/MatchDetailScreen";
import MyJoinedMatchesScreen from "./src/screens/MyJoinedMatchesScreen";
import ProfileScreen from "./src/screens/ProfileScreen";

// Mode Organisateur (écrans existants)
import HomeScreen from "./src/screens/HomeScreen";
import VestiaireScreen from "./src/screens/VestiaireScreen";
import MatchScreen from "./src/screens/MatchScreen";
import TechkilaScreen from "./src/screens/TechkilaScreen";
import ConditionsScreen from "./src/screens/ConditionsScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const PlayerStack = createNativeStackNavigator();

// ═══════════════════════════════════════════════════════════════
// NAVIGATION JOUEUR : Stack avec onglets + écran détail
// ═══════════════════════════════════════════════════════════════

function PlayerNearbyStack() {
  return (
    <PlayerStack.Navigator screenOptions={{ headerShown: false }}>
      <PlayerStack.Screen name="NearbyList" component={NearbyMatchesScreen} />
      <PlayerStack.Screen name="MatchDetail" component={MatchDetailScreen} />
    </PlayerStack.Navigator>
  );
}

function PlayerJoinedStack() {
  return (
    <PlayerStack.Navigator screenOptions={{ headerShown: false }}>
      <PlayerStack.Screen name="JoinedList" component={MyJoinedMatchesScreen} />
      <PlayerStack.Screen name="MatchDetail" component={MatchDetailScreen} />
    </PlayerStack.Navigator>
  );
}

function PlayerTabs({ setIsLoggedIn, onModeChanged }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Près de moi")
            iconName = focused ? "location" : "location-outline";
          else if (route.name === "Mes matchs")
            iconName = focused ? "football" : "football-outline";
          else if (route.name === "Profil")
            iconName = focused ? "person" : "person-outline";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#2ecc71",
        tabBarInactiveTintColor: "#95a5a6",
        tabBarLabelStyle: { fontFamily: "Poppins-Regular", fontSize: 11 },
        tabBarStyle: { paddingBottom: 5, height: 58 },
      })}
    >
      <Tab.Screen name="Près de moi" component={PlayerNearbyStack} />
      <Tab.Screen name="Mes matchs" component={PlayerJoinedStack} />
      <Tab.Screen name="Profil">
        {(props) => (
          <ProfileScreen
            {...props}
            setIsLoggedIn={setIsLoggedIn}
            onModeChanged={onModeChanged}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// ═══════════════════════════════════════════════════════════════
// NAVIGATION ORGANISATEUR : Onglets existants
// ═══════════════════════════════════════════════════════════════

function OrganizerTabs({ setIsLoggedIn, onModeChanged }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: "#c0392b" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontFamily: "Poppins-Bold" },
        tabBarLabelStyle: { fontFamily: "Poppins-Regular" },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Accueil")
            iconName = focused ? "home" : "home-outline";
          else if (route.name === "Vestiaire")
            iconName = focused ? "people" : "people-outline";
          else if (route.name === "Match")
            iconName = focused ? "football" : "football-outline";
          else if (route.name === "Techkila")
            iconName = focused ? "shuffle" : "shuffle-outline";
          else if (route.name === "Profil")
            iconName = focused ? "person" : "person-outline";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#2ecc71",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen name="Accueil">
        {(props) => <HomeScreen {...props} setIsLoggedIn={setIsLoggedIn} />}
      </Tab.Screen>
      <Tab.Screen name="Vestiaire" component={VestiaireScreen} />
      <Tab.Screen name="Match" component={MatchScreen} />
      <Tab.Screen name="Techkila" component={TechkilaScreen} />
      <Tab.Screen name="Profil">
        {(props) => (
          <ProfileScreen
            {...props}
            setIsLoggedIn={setIsLoggedIn}
            onModeChanged={onModeChanged}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// ═══════════════════════════════════════════════════════════════
// APP PRINCIPALE
// ═══════════════════════════════════════════════════════════════

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userMode, setUserMode] = useState("player");

  let [fontsLoaded] = useFonts({
    "Poppins-Regular": Poppins_400Regular,
    "Poppins-Bold": Poppins_700Bold,
  });

  // ─── Intercepteur 401/403 : retour au login ─────────────────
  useEffect(() => {
    client._onAuthError = () => {
      setIsLoggedIn(false);
    };
    return () => { client._onAuthError = null; };
  }, []);

  // ─── Vérifier la session au démarrage ───────────────────────
  useEffect(() => {
    const checkLogin = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (token) {
          try {
            const res = await client.get("/api/auth/me");
            if (res.data.success) {
              setUserMode(res.data.user.currentMode || "player");
              await AsyncStorage.setItem("userMode", res.data.user.currentMode || "player");
              setIsLoggedIn(true);
            } else {
              await AsyncStorage.multiRemove(["token", "userMode"]);
            }
          } catch (error) {
            console.log("Erreur vérification session:", error.message);
            await AsyncStorage.multiRemove(["token", "userMode"]);
          }
        }
      } catch (e) {
        console.log("Erreur lecture token:", e);
      } finally {
        setIsLoading(false);
      }
    };
    checkLogin();
  }, []);

  // ─── Callback quand le mode change depuis le Profil ─────────
  const handleModeChanged = useCallback(async (newMode) => {
    setUserMode(newMode);
  }, []);

  // ─── Callback login ─────────────────────────────────────────
  const handleLogin = useCallback(async (loggedIn) => {
    if (loggedIn) {
      const mode = await AsyncStorage.getItem("userMode");
      setUserMode(mode || "player");
    }
    setIsLoggedIn(loggedIn);
  }, []);

  if (!fontsLoaded || isLoading) {
    return <Loader />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          <Stack.Screen name="MainApp">
            {() =>
              userMode === "organizer" ? (
                <OrganizerTabs
                  setIsLoggedIn={setIsLoggedIn}
                  onModeChanged={handleModeChanged}
                />
              ) : (
                <PlayerTabs
                  setIsLoggedIn={setIsLoggedIn}
                  onModeChanged={handleModeChanged}
                />
              )
            }
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Login">
            {(props) => <LoginScreen {...props} setIsLoggedIn={handleLogin} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
      <Toast />
    </NavigationContainer>
  );
}
