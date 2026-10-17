import React, { useState, useEffect } from "react";
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

// Import des écrans
import LoginScreen from "./src/screens/LoginScreen";
import HomeScreen from "./src/screens/HomeScreen";
import VestiaireScreen from "./src/screens/VestiaireScreen";
import MatchScreen from "./src/screens/MatchScreen";
import TechkilaScreen from "./src/screens/TechkilaScreen";
import Loader from "./src/components/Loader";
import ConditionsScreen from "./src/screens/ConditionsScreen";

// ⚠️ Mettre à true UNE SEULE FOIS pour supprimer l'ancien token,
// puis remettre à false.
const RESET_TOKEN = true;

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// --- 1. LES ONGLETS (MainApp) ---
function MainApp({ setIsLoggedIn }) {
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
          else if (route.name === "Conditions")
            iconName = focused ? "document-text" : "document-text-outline";
          else if (route.name === "ChatBot")
            iconName = focused ? "chatbubbles" : "chatbubbles-outline";
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
      <Tab.Screen name="Conditions" component={ConditionsScreen} />
    </Tab.Navigator>
  );
}

// --- 2. L'APPLICATION PRINCIPALE (App) ---
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  let [fontsLoaded] = useFonts({
    "Poppins-Regular": Poppins_400Regular,
    "Poppins-Bold": Poppins_700Bold,
  });

  useEffect(() => {
    const checkLogin = async () => {
      try {
        if (RESET_TOKEN) {
          await AsyncStorage.removeItem("token");
        }
        const token = await AsyncStorage.getItem("token");
        if (token) {
          setIsLoggedIn(true);
        }
      } catch (e) {
        console.log("Erreur lecture token", e);
      } finally {
        setIsLoading(false);
      }
    };
    checkLogin();
  }, []);

  if (!fontsLoaded || isLoading) {
    return <Loader />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          <Stack.Screen name="MainApp">
            {(props) => <MainApp {...props} setIsLoggedIn={setIsLoggedIn} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Login">
            {(props) => <LoginScreen {...props} setIsLoggedIn={setIsLoggedIn} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
      <Toast />
    </NavigationContainer>
  );
}